const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

class DepositScanner {
  constructor() {
    this.provider = null;
    this.masterWallet = null;
    this.isRunning = false;
    this.lastScannedBlock = 0;
    this.scanInterval = null;
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nxchain');
      console.log('✅ Scanner: MongoDB connected');

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
      console.log('✅ Scanner: BSC provider initialized');

      // Initialize master wallet
      const masterSeedPhrase = process.env.MASTER_SEED_PHRASE || 'danger attack gesture cliff clap stage tag spare loop cousin either put';
      this.masterWallet = ethers.Wallet.fromPhrase(masterSeedPhrase);
      console.log('✅ Scanner: Master wallet initialized:', this.masterWallet.address);

      // Get last scanned block
      await this.getLastScannedBlock();
      console.log('📍 Scanner: Starting from block:', this.lastScannedBlock);

      return true;
    } catch (error) {
      console.error('❌ Scanner initialization failed:', error);
      return false;
    }
  }

  async getLastScannedBlock() {
    try {
      const lastDeposit = await Deposit.findOne().sort({ blockNumber: -1 });
      this.lastScannedBlock = lastDeposit ? lastDeposit.blockNumber : await this.provider.getBlockNumber() - 1;
    } catch (error) {
      console.error('❌ Error getting last scanned block:', error);
      this.lastScannedBlock = await this.provider.getBlockNumber() - 1;
    }
  }

  async scanBlock(blockNumber) {
    try {
      console.log(`🔍 Scanning block ${blockNumber}...`);
      
      // Get block data
      const blockData = await this.provider.getBlock(blockNumber, true);
      if (!blockData) {
        console.log(`⚠️ Block ${blockNumber} not found`);
        return;
      }

      // Process transactions
      const txList = blockData.transactions;
      const deposits = [];

      for (const tx of txList) {
        if (tx.to && this.isChildWallet(tx.to)) {
          const deposit = await this.processTransaction(tx, blockNumber);
          if (deposit) {
            deposits.push(deposit);
          }
        }
      }

      // Save deposits
      if (deposits.length > 0) {
        await Deposit.insertMany(deposits);
        console.log(`💰 Found ${deposits.length} deposits in block ${blockNumber}`);
        
        // Trigger sweep worker for each deposit
        for (const deposit of deposits) {
          await this.triggerSweepWorker(deposit);
        }
      }

      // Clean up memory
      txList.length = 0;
      blockData.transactions = null;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log(`✅ Completed scanning block ${blockNumber}`);
      
    } catch (error) {
      console.error(`❌ Error scanning block ${blockNumber}:`, error);
    }
  }

  isChildWallet(address) {
    // Check if address matches our child wallet pattern
    // This should be implemented based on your wallet derivation logic
    return address.toLowerCase().startsWith('0x'); // Simplified check
  }

  async processTransaction(tx, blockNumber) {
    try {
      // Get transaction receipt for token transfers
      const receipt = await this.provider.getTransactionReceipt(tx.hash);
      if (!receipt) return null;

      // Check for token transfers
      const logs = receipt.logs;
      let tokenDeposit = null;

      for (const log of logs) {
        if (log.topics && log.topics.length >= 3) {
          // ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
          const to = '0x' + log.topics[2].slice(26);
          if (to.toLowerCase() === tx.to.toLowerCase()) {
            tokenDeposit = {
              userId: await this.getUserIdFromWallet(tx.to),
              childWallet: tx.to,
              amount: ethers.formatUnits(log.data, 18),
              txHash: tx.hash,
              token: log.address,
              status: 'pending',
              blockNumber: blockNumber,
              timestamp: new Date(),
              type: 'token'
            };
          }
        }
      }

      // Check for native BNB transfers
      if (tx.value && tx.value > 0n) {
        return {
          userId: await this.getUserIdFromWallet(tx.to),
          childWallet: tx.to,
          amount: ethers.formatEther(tx.value),
          txHash: tx.hash,
          token: 'BNB',
          status: 'pending',
          blockNumber: blockNumber,
          timestamp: new Date(),
          type: 'native'
        };
      }

      return tokenDeposit;
      
    } catch (error) {
      console.error('❌ Error processing transaction:', error);
      return null;
    }
  }

  async getUserIdFromWallet(address) {
    try {
      const user = await User.findOne({ address: address.toLowerCase() });
      return user ? user.userId : null;
    } catch (error) {
      console.error('❌ Error getting user from wallet:', error);
      return null;
    }
  }

  async triggerSweepWorker(deposit) {
    try {
      // Call sweep worker via internal API or direct function
      console.log(`🔄 Triggering sweep for deposit: ${deposit.txHash}`);
      
      // This would call your sweep worker
      // For now, we'll just log it
      console.log(`📋 Sweep queued for: ${deposit.amount} ${deposit.token} to ${deposit.childWallet}`);
      
    } catch (error) {
      console.error('❌ Error triggering sweep worker:', error);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Scanner is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting deposit scanner...');

    // Use interval-based scanning instead of infinite loop
    this.scanInterval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > this.lastScannedBlock) {
          // Process blocks one by one
          for (let block = this.lastScannedBlock + 1; block <= currentBlock; block++) {
            await this.scanBlock(block);
            this.lastScannedBlock = block;
            
            // Add delay between blocks
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        console.error('❌ Scanner error:', error);
      }
    }, 3000); // Check every 3 seconds

    console.log('✅ Deposit scanner started successfully');
  }

  async stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Deposit scanner stopped');
  }
}

// Start scanner if run directly
if (require.main === module) {
  const scanner = new DepositScanner();
  
  scanner.initialize().then(success => {
    if (success) {
      scanner.start();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('🛑 Shutting down scanner...');
        await scanner.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('🛑 Shutting down scanner...');
        await scanner.stop();
        process.exit(0);
      });
    } else {
      console.error('❌ Failed to initialize scanner');
      process.exit(1);
    }
  });
}

module.exports = DepositScanner;
