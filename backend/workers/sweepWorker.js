const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Deposit = require('../models/Deposit');
const GasLog = require('../models/GasLog');
const User = require('../models/User');

class SweepWorker {
  constructor() {
    this.provider = null;
    this.masterWallet = null;
    this.isRunning = false;
    this.processingQueue = [];
    this.sweepInterval = null;
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nxchain');
      console.log('✅ Sweep Worker: MongoDB connected');

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
      console.log('✅ Sweep Worker: BSC provider initialized');

      // Initialize master wallet
      const masterSeedPhrase = process.env.MASTER_SEED_PHRASE || 'danger attack gesture cliff clap stage tag spare loop cousin either put';
      this.masterWallet = ethers.Wallet.fromPhrase(masterSeedPhrase);
      console.log('✅ Sweep Worker: Master wallet initialized:', this.masterWallet.address);

      return true;
    } catch (error) {
      console.error('❌ Sweep Worker initialization failed:', error);
      return false;
    }
  }

  async getPrivateKeyForWallet(address) {
    try {
      // Derive child wallet private key
      const hdNode = ethers.HDNodeWallet.fromPhrase(this.masterWallet.mnemonic.phrase);
      const userId = await this.getUserIdFromAddress(address);
      
      if (!userId) {
        throw new Error('User not found for address');
      }

      const derivationPath = `m/44'/60'/0'/0/${userId}`;
      const userWalletNode = hdNode.derivePath(derivationPath);
      
      return userWalletNode.privateKey;
    } catch (error) {
      console.error('❌ Error deriving private key:', error);
      throw error;
    }
  }

  async getUserIdFromAddress(address) {
    try {
      const user = await User.findOne({ address: address.toLowerCase() });
      return user ? user.userId : null;
    } catch (error) {
      console.error('❌ Error getting user from address:', error);
      return null;
    }
  }

  async checkGasBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Error checking gas balance:', error);
      return '0';
    }
  }

  async topUpGasIfNeeded(address) {
    try {
      const gasBalance = await this.checkGasBalance(address);
      const minGas = '0.001'; // Minimum BNB for gas
      
      if (parseFloat(gasBalance) < parseFloat(minGas)) {
        console.log(`⛽ Topping up gas for ${address} (current: ${gasBalance} BNB)`);
        
        const topUpAmount = '0.005'; // Top up amount
        const tx = {
          to: address,
          value: ethers.parseEther(topUpAmount),
          gasLimit: 21000,
          gasPrice: await this.provider.getFeeData()
        };

        const signedTx = await this.masterWallet.sendTransaction(tx);
        await signedTx.wait();
        
        console.log(`✅ Gas top-up completed: ${signedTx.hash}`);
        
        // Log gas operation
        await GasLog.create({
          userId: await this.getUserIdFromAddress(address),
          address: address,
          amount: topUpAmount,
          txHash: signedTx.hash,
          type: 'gas_topup',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error topping up gas:', error);
    }
  }

  async createSweepTransaction(deposit) {
    try {
      const privateKey = await this.getPrivateKeyForWallet(deposit.childWallet);
      const userWallet = new ethers.Wallet(privateKey, this.provider);

      let tx;
      
      if (deposit.token === 'BNB') {
        // Native BNB sweep
        const balance = await this.provider.getBalance(deposit.childWallet);
        const gasPrice = await this.provider.getFeeData();
        const gasLimit = 21000;
        const gasCost = gasPrice.gasPrice * BigInt(gasLimit);
        const sweepAmount = balance - gasCost;

        if (sweepAmount <= 0n) {
          console.log(`⚠️ Insufficient balance for sweep: ${deposit.childWallet}`);
          return null;
        }

        tx = {
          to: this.masterWallet.address,
          value: sweepAmount,
          gasLimit: gasLimit,
          gasPrice: gasPrice.gasPrice
        };
      } else {
        // ERC20 token sweep
        const tokenContract = new ethers.Contract(
          deposit.token,
          ['function transfer(address to, uint256 amount) returns (bool)'],
          userWallet
        );

        const balance = await tokenContract.balanceOf(deposit.childWallet);
        if (balance === 0n) {
          console.log(`⚠️ No token balance for sweep: ${deposit.childWallet}`);
          return null;
        }

        tx = await tokenContract.transfer.populateTransaction(
          this.masterWallet.address,
          balance
        );
      }

      return tx;
    } catch (error) {
      console.error('❌ Error creating sweep transaction:', error);
      return null;
    }
  }

  async executeSweep(deposit) {
    try {
      console.log(`🔄 Processing sweep for deposit: ${deposit.txHash}`);

      // Check and top-up gas if needed
      await this.topUpGasIfNeeded(deposit.childWallet);

      // Create sweep transaction
      const tx = await this.createSweepTransaction(deposit);
      if (!tx) {
        throw new Error('Failed to create sweep transaction');
      }

      // Sign and send transaction
      const privateKey = await this.getPrivateKeyForWallet(deposit.childWallet);
      const userWallet = new ethers.Wallet(privateKey, this.provider);
      
      const signedTx = await userWallet.sendTransaction(tx);
      const receipt = await signedTx.wait();

      // Update deposit status
      await Deposit.findByIdAndUpdate(deposit._id, {
        status: 'completed',
        sweepTxHash: signedTx.hash,
        sweepTimestamp: new Date()
      });

      // Log sweep operation
      await GasLog.create({
        userId: deposit.userId,
        address: deposit.childWallet,
        amount: deposit.amount,
        token: deposit.token,
        txHash: signedTx.hash,
        type: 'sweep',
        timestamp: new Date()
      });

      console.log(`✅ Sweep completed: ${signedTx.hash} for ${deposit.amount} ${deposit.token}`);
      
      return receipt;
    } catch (error) {
      console.error('❌ Error executing sweep:', error);
      
      // Update deposit status to failed
      await Deposit.findByIdAndUpdate(deposit._id, {
        status: 'failed',
        error: error.message
      });
      
      throw error;
    }
  }

  async processPendingDeposits() {
    try {
      const pendingDeposits = await Deposit.find({ status: 'pending' }).sort({ timestamp: 1 });
      
      if (pendingDeposits.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingDeposits.length} pending deposits...`);

      for (const deposit of pendingDeposits) {
        try {
          await this.executeSweep(deposit);
          
          // Add delay between sweeps
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Failed to process deposit ${deposit.txHash}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending deposits:', error);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Sweep Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting sweep worker...');

    // Process pending deposits every 30 seconds
    this.sweepInterval = setInterval(async () => {
      await this.processPendingDeposits();
    }, 30000);

    console.log('✅ Sweep worker started successfully');
  }

  async stop() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Sweep worker stopped');
  }
}

// Start sweep worker if run directly
if (require.main === module) {
  const sweepWorker = new SweepWorker();
  
  sweepWorker.initialize().then(success => {
    if (success) {
      sweepWorker.start();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('🛑 Shutting down sweep worker...');
        await sweepWorker.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('🛑 Shutting down sweep worker...');
        await sweepWorker.stop();
        process.exit(0);
      });
    } else {
      console.error('❌ Failed to initialize sweep worker');
      process.exit(1);
    }
  });
}

module.exports = SweepWorker;
