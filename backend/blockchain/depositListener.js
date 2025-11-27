const { ethers } = require('ethers');
const WalletManager = require('./walletManager');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Sweep = require('../models/Sweep');

class DepositListener {
  constructor() {
    this.provider = null;
    this.walletManager = new WalletManager();
    this.isListening = false;
    this.processedTxs = new Set(); // Track processed transactions
    this.maxProcessedTxs = 1000; // Limit processed transactions to prevent memory issues
    this.initializeProvider();
  }

  initializeProvider() {
    try {
      // BNB Smart Chain RPC
      const rpcUrl = process.env.BNB_RPC_URL || 'https://bsc-dataseed1.binance.org/';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      console.log('BNB Smart Chain provider initialized');
      console.log('Connected to:', rpcUrl);
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      throw error;
    }
  }

  // Start listening for deposits
  async startListening() {
    if (this.isListening) {
      console.log('Deposit listener already running');
      return;
    }

    this.isListening = true;
    console.log('🚀 Deposit listener started for BNB Smart Chain');

    // Monitor blocks for new transactions
    this.provider.on('block', async (blockNumber) => {
      await this.processBlock(blockNumber);
    });

    // Also run periodic checks as backup
    setInterval(async () => {
      await this.checkAllUserWallets();
    }, 30000); // Every 30 seconds
  }

  // Process a new block
  async processBlock(blockNumber) {
    try {
      const block = await this.provider.getBlock(blockNumber, true);
      
      if (!block || !block.transactions) {
        return;
      }

      console.log(`Processing block ${blockNumber} with ${block.transactions.length} transactions`);

      // Smart filtering: Process only transactions with value > 0 or to known addresses
      const valuableTransactions = block.transactions.filter(tx => {
        // Keep transactions with value > 0.001 BNB
        if (tx.value && parseFloat(ethers.formatEther(tx.value)) > 0.001) {
          return true;
        }
        // Keep transactions that might be token transfers (has logs)
        if (tx.to) {
          return true; // Process all to-address transactions for token monitoring
        }
        return false;
      });

      console.log(`Processing ${valuableTransactions.length} relevant transactions (skipped ${block.transactions.length - valuableTransactions.length} zero-value/empty transactions)`);
      
      for (const tx of valuableTransactions) {
        await this.processTransaction(tx);
      }
    } catch (error) {
      console.error(`Error processing block ${blockNumber}:`, error);
    }
  }

  // Add transaction to processed set with memory management
  addToProcessedTxs(txHash) {
    this.processedTxs.add(txHash);
    
    // Clean up old transactions if set gets too large
    if (this.processedTxs.size > this.maxProcessedTxs) {
      const entries = Array.from(this.processedTxs);
      const toRemove = entries.slice(0, 500); // Remove oldest 500
      toRemove.forEach(hash => this.processedTxs.delete(hash));
      console.log(`Cleaned up ${toRemove.length} old processed transactions to prevent memory issues`);
    }
  }

  // Process individual transaction
  async processTransaction(tx) {
    try {
      // Skip if transaction is undefined or already processed
      if (!tx || !tx.hash || this.processedTxs.has(tx.hash)) {
        return;
      }

      // Check if transaction has a 'to' address
      if (!tx.to) {
        return;
      }

      // Check if transaction is to a user wallet
      const userWallet = await User.findOne({ address: tx.to.toLowerCase() });
      
      if (!userWallet) {
        return;
      }

      console.log(`🎯 Found deposit transaction: ${tx.hash}`);
      console.log(`To: ${tx.to}, Value: ${ethers.formatEther(tx.value)} BNB`);

      // Get transaction receipt for confirmations
      const receipt = await this.provider.getTransactionReceipt(tx.hash);
      
      if (!receipt) {
        console.log(`Transaction ${tx.hash} not yet confirmed`);
        return;
      }

      // Wait for at least 6 confirmations
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      if (confirmations < 6) {
        console.log(`Transaction ${tx.hash} has ${confirmations} confirmations (need 6)`);
        return;
      }

      // Check if deposit already exists
      const existingDeposit = await Deposit.findOne({ txHash: tx.hash });
      if (existingDeposit) {
        this.addToProcessedTxs(tx.hash);
        return;
      }

      // Create deposit record
      const deposit = new Deposit({
        userId: userWallet.userId,
        amount: parseFloat(ethers.formatEther(tx.value)),
        tokenType: 'BNB',
        tokenContract: null,
        txHash: tx.hash,
        from: tx.from,
        to: tx.to,
        confirmations: confirmations,
        status: 'confirmed',
        swept: false,
        createdAt: new Date(),
        confirmedAt: new Date()
      });

      await deposit.save();

      // Update user internal balance
      await User.findByIdAndUpdate(userWallet._id, {
        $inc: { balance: parseFloat(ethers.formatEther(tx.value)) }
      });

      console.log(`✅ BNB deposit confirmed and saved: ${tx.hash}`);
      console.log(`Amount: ${ethers.formatEther(tx.value)} BNB`);
      console.log(`User: ${userWallet.userId}`);

      // Mark as processed
      this.addToProcessedTxs(tx.hash);

      // Trigger auto-sweep
      setTimeout(() => {
        this.autoSweep(userWallet.userId, 'BNB', parseFloat(ethers.formatEther(tx.value)));
      }, 5000);

    } catch (error) {
      console.error(`Error processing transaction ${tx.hash}:`, error);
    }
  }

  // Monitor BEP20 token transfers
  async monitorTokenTransfers(tokenContract) {
    try {
      const erc20Abi = [
        'event Transfer(address indexed from, address indexed to, uint256 value)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      const contract = new ethers.Contract(tokenContract, erc20Abi, this.provider);
      
      // Listen for Transfer events
      contract.on('Transfer', async (from, to, value, event) => {
        await this.processTokenTransfer(from, to, value, tokenContract, event);
      });

      console.log(`📡 Started monitoring token transfers for: ${tokenContract}`);
    } catch (error) {
      console.error(`Failed to monitor token transfers for ${tokenContract}:`, error);
    }
  }

  // Process token transfer event
  async processTokenTransfer(from, to, value, tokenContract, event) {
    try {
      // Check if recipient is a user wallet
      const userWallet = await User.findOne({ address: to.toLowerCase() });
      
      if (!userWallet) {
        return;
      }

      console.log(`🎯 Found token transfer to user wallet`);
      console.log(`Token: ${tokenContract}`);
      console.log(`To: ${to}`);
      console.log(`Value: ${value.toString()}`);

      // Get token details
      const erc20Abi = ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
      const contract = new ethers.Contract(tokenContract, erc20Abi, this.provider);
      
      const decimals = await contract.decimals();
      const symbol = await contract.symbol();
      const formattedAmount = parseFloat(ethers.formatUnits(value, decimals));

      // Check if deposit already exists
      const existingDeposit = await Deposit.findOne({ 
        txHash: event.transactionHash,
        tokenContract: tokenContract
      });
      
      if (existingDeposit) {
        return;
      }

      // Get transaction for confirmations
      const tx = await this.provider.getTransaction(event.transactionHash);
      const receipt = await this.provider.getTransactionReceipt(event.transactionHash);
      
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      if (confirmations < 6) {
        console.log(`Token transfer has ${confirmations} confirmations (need 6)`);
        return;
      }

      // Create deposit record
      const deposit = new Deposit({
        userId: userWallet.userId,
        amount: formattedAmount,
        tokenType: 'BEP20',
        tokenContract: tokenContract,
        tokenSymbol: symbol,
        txHash: event.transactionHash,
        from: from,
        to: to,
        confirmations: confirmations,
        status: 'confirmed',
        swept: false,
        createdAt: new Date(),
        confirmedAt: new Date()
      });

      await deposit.save();

      // Update user internal balance (in USD equivalent - you'd need price oracle)
      const usdEquivalent = await this.getUSDValue(formattedAmount, symbol);
      await User.findByIdAndUpdate(userWallet._id, {
        $inc: { balance: usdEquivalent }
      });

      console.log(`✅ Token deposit confirmed: ${event.transactionHash}`);
      console.log(`Amount: ${formattedAmount} ${symbol}`);
      console.log(`USD Value: $${usdEquivalent}`);

      // Trigger auto-sweep
      setTimeout(() => {
        this.autoSweep(userWallet.userId, tokenContract, formattedAmount);
      }, 5000);

    } catch (error) {
      console.error('Error processing token transfer:', error);
    }
  }

  // Auto-sweep function
  async autoSweep(userId, tokenType, amount) {
    try {
      console.log(`🔄 Starting auto-sweep for user ${userId}`);
      console.log(`Token: ${tokenType}, Amount: ${amount}`);

      const userWallet = await User.findOne({ userId });
      const masterWallet = this.walletManager.getMasterWallet();

      if (!userWallet) {
        throw new Error('User wallet not found');
      }

      let sweepResult;

      if (tokenType === 'BNB') {
        sweepResult = await this.walletManager.createSweepTransaction(
          userWallet,
          masterWallet.address,
          this.provider
        );
      } else {
        // For tokens, you'd need the token contract address
        sweepResult = await this.walletManager.createTokenSweep(
          userWallet,
          masterWallet.address,
          tokenType,
          amount,
          this.provider
        );
      }

      // Save sweep record
      const sweep = new Sweep({
        userId: userId,
        fromAddress: userWallet.address,
        toAddress: masterWallet.address,
        amount: sweepResult.amount,
        tokenType: tokenType,
        tokenContract: tokenType === 'BNB' ? null : tokenType,
        txHash: sweepResult.transactionHash,
        gasUsed: sweepResult.gasUsed,
        gasPrice: sweepResult.gasPrice,
        gasCost: sweepResult.gasCost,
        status: 'completed',
        createdAt: new Date()
      });

      await sweep.save();

      // Mark deposit as swept
      await Deposit.updateMany(
        { 
          userId: userId,
          tokenType: tokenType,
          swept: false 
        },
        { 
          swept: true,
          sweptAt: new Date(),
          sweepTxHash: sweepResult.transactionHash
        }
      );

      console.log(`✅ Auto-sweep completed: ${sweepResult.transactionHash}`);
      console.log(`Amount swept: ${sweepResult.amount}`);
      console.log(`Gas cost: ${sweepResult.gasCost}`);

      return sweepResult;

    } catch (error) {
      console.error(`Auto-sweep failed for user ${userId}:`, error);
      
      // Log failed sweep attempt
      const failedSweep = new Sweep({
        userId: userId,
        tokenType: tokenType,
        amount: amount,
        status: 'failed',
        error: error.message,
        createdAt: new Date()
      });

      await failedSweep.save();
      throw error;
    }
  }

  // Check all user wallets for missed deposits
  async checkAllUserWallets() {
    try {
      const users = await User.find({});
      const tokenContracts = [
        { address: process.env.USDT_CONTRACT || '0x55d398326f99059ff775485246999027b3197955' }, // USDT on BSC
        { address: process.env.USDC_CONTRACT || '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' }, // USDC on BSC
        { address: process.env.BUSD_CONTRACT || '0xe9e7cea3dedca5984780bafc599bd69add087d56' }  // BUSD on BSC
      ];

      for (const user of users) {
        try {
          const balances = await this.walletManager.getWalletBalance(
            user.address, 
            this.provider, 
            tokenContracts
          );

          // Check for new BNB deposits
          const bnbBalance = parseFloat(balances.BNB);
          if (bnbBalance > 0.001) { // Minimum threshold
            console.log(`Found BNB balance in ${user.address}: ${bnbBalance} BNB`);
            // Trigger sweep if not recently swept
            await this.checkAndSweepIfNeeded(user, 'BNB', bnbBalance);
          }

          // Check for token balances
          for (const [contractAddress, tokenData] of Object.entries(balances.tokens)) {
            const tokenBalance = parseFloat(tokenData.balance);
            if (tokenBalance > 1) { // Minimum threshold
              console.log(`Found ${tokenData.symbol} balance in ${user.address}: ${tokenBalance} ${tokenData.symbol}`);
              await this.checkAndSweepIfNeeded(user, contractAddress, tokenBalance);
            }
          }

        } catch (error) {
          console.error(`Error checking wallet ${user.address}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in checkAllUserWallets:', error);
    }
  }

  // Check if sweep is needed and perform it
  async checkAndSweepIfNeeded(user, tokenType, balance) {
    try {
      // Check if there's a recent sweep for this token type
      const recentSweep = await Sweep.findOne({
        userId: user.userId,
        tokenType: tokenType,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
      });

      if (recentSweep) {
        console.log(`Recent sweep found for ${user.userId} ${tokenType}, skipping`);
        return;
      }

      // Perform sweep
      await this.autoSweep(user.userId, tokenType, balance);

    } catch (error) {
      console.error(`Check and sweep failed for ${user.userId}:`, error);
    }
  }

  // Get USD value (mock implementation - you'd integrate with price oracle)
  async getUSDValue(amount, tokenSymbol) {
    // Mock prices - integrate with CoinGecko/CoinMarketCap API
    const prices = {
      'USDT': 1.0,
      'USDC': 1.0,
      'BUSD': 1.0,
      'BNB': 250.0, // Mock price
      'ETH': 2000.0  // Mock price
    };

    return amount * (prices[tokenSymbol] || 1.0);
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    console.log('🛑 Deposit listener stopped');
  }

  // Get listener status
  getStatus() {
    return {
      isListening: this.isListening,
      processedTransactions: this.processedTxs.size,
      providerConnected: this.provider !== null
    };
  }
}

module.exports = DepositListener;
