const crypto = require('crypto');
const { ethers } = require('ethers');
const { encrypt, decrypt } = require('../utils/encryption');

class WalletManager {
  constructor() {
    this.masterWallet = null;
    this.masterSeedPhrase = process.env.MASTER_SEED_PHRASE || 'danger attack gesture cliff clap stage tag spare loop cousin either put';
    this.initializeMasterWallet();
  }

  async initializeMasterWallet() {
    try {
      // Create master wallet from seed phrase
      this.masterWallet = ethers.Wallet.fromPhrase(this.masterSeedPhrase);
      
      console.log('Master Wallet Initialized:');
      console.log('Address:', this.masterWallet.address);
      console.log('Network: BNB Smart Chain');
      
      return this.masterWallet;
    } catch (error) {
      console.error('Failed to initialize master wallet:', error);
      throw error;
    }
  }

  // Generate user wallet using HD wallet derivation
  generateUserWallet(userId) {
    try {
      // BNB Smart Chain uses same derivation as Ethereum
      // m/44'/60'/0'/0/USER_ID
      const derivationPath = `m/44'/60'/0'/0/${userId}`;
      
      // Create HD wallet from master wallet (not seed phrase directly)
      const hdNode = ethers.HDNodeWallet.fromPhrase(this.masterSeedPhrase);
      const userWalletNode = hdNode.derivePath(derivationPath);
      
      const userWallet = {
        userId,
        address: userWalletNode.address,
        publicKey: userWalletNode.publicKey,
        privateKey: userWalletNode.privateKey,
        privateKeyEncrypted: encrypt(userWalletNode.privateKey),
        derivationPath,
        created_at: new Date()
      };

      console.log(`Generated wallet for user ${userId}:`, {
        address: userWallet.address,
        derivationPath: userWallet.derivationPath
      });

      return userWallet;
    } catch (error) {
      console.error('Failed to generate user wallet:', error);
      throw error;
    }
  }

  // Get master wallet details
  getMasterWallet() {
    if (!this.masterWallet) {
      throw new Error('Master wallet not initialized');
    }

    return {
      address: this.masterWallet.address,
      publicKey: this.masterWallet.publicKey,
      privateKey: this.masterWallet.privateKey,
      privateKeyEncrypted: encrypt(this.masterWallet.privateKey),
      seedPhrase: this.masterSeedPhrase
    };
  }

  // Decrypt user private key for operations
  decryptUserPrivateKey(encryptedPrivateKey) {
    try {
      return decrypt(encryptedPrivateKey);
    } catch (error) {
      console.error('Failed to decrypt private key:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
  async estimateGas(provider, to, value = '0', data = '0x') {
    try {
      const gasEstimate = await provider.estimateGas({
        to,
        value,
        data
      });
      
      const gasPrice = await provider.getGasPrice();
      
      return {
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
        gasCost: gasEstimate.mul(gasPrice)
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  }

  // Create sweep transaction for BNB
  async createSweepTransaction(userWallet, masterAddress, provider) {
    try {
      const balance = await provider.getBalance(userWallet.address);
      const gasEstimate = await this.estimateGas(provider, masterAddress, balance);
      
      // Calculate sweep amount (balance - gas cost)
      const sweepAmount = balance.sub(gasEstimate.gasCost);
      
      if (sweepAmount.lte(0)) {
        throw new Error('Insufficient balance for gas fees');
      }

      const privateKey = this.decryptUserPrivateKey(userWallet.privateKeyEncrypted);
      const wallet = new ethers.Wallet(privateKey, provider);

      const tx = {
        to: masterAddress,
        value: sweepAmount,
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice
      };

      const signedTx = await wallet.sendTransaction(tx);
      
      return {
        transactionHash: signedTx.hash,
        from: userWallet.address,
        to: masterAddress,
        amount: ethers.formatEther(sweepAmount),
        gasUsed: gasEstimate.gasLimit,
        gasPrice: ethers.formatUnits(gasEstimate.gasPrice, 'gwei'),
        gasCost: ethers.formatEther(gasEstimate.gasCost)
      };
    } catch (error) {
      console.error('Failed to create sweep transaction:', error);
      throw error;
    }
  }

  // Create token sweep transaction
  async createTokenSweep(userWallet, masterAddress, tokenContract, amount, provider) {
    try {
      const privateKey = this.decryptUserPrivateKey(userWallet.privateKeyEncrypted);
      const wallet = new ethers.Wallet(privateKey, provider);

      // ERC20 ABI for transfer function
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ];

      const tokenContractInstance = new ethers.Contract(tokenContract, erc20Abi, wallet);
      
      // Get decimals for proper formatting
      const decimals = await tokenContractInstance.decimals();
      const formattedAmount = ethers.parseUnits(amount.toString(), decimals);

      // Estimate gas for token transfer
      const gasEstimate = await this.estimateGas(
        provider, 
        tokenContract, 
        0, 
        tokenContractInstance.interface.encodeFunctionData('transfer', [masterAddress, formattedAmount])
      );

      const tx = await tokenContractInstance.transfer(masterAddress, formattedAmount, {
        gasLimit: gasEstimate.gasLimit,
        gasPrice: gasEstimate.gasPrice
      });

      return {
        transactionHash: tx.hash,
        from: userWallet.address,
        to: masterAddress,
        amount: amount,
        tokenContract,
        gasUsed: gasEstimate.gasLimit,
        gasPrice: ethers.formatUnits(gasEstimate.gasPrice, 'gwei'),
        gasCost: ethers.formatEther(gasEstimate.gasCost)
      };
    } catch (error) {
      console.error('Failed to create token sweep transaction:', error);
      throw error;
    }
  }

  // Get wallet balance (BNB and tokens)
  async getWalletBalance(address, provider, tokenContracts = []) {
    try {
      const balances = {
        BNB: '0',
        tokens: {}
      };

      // Get BNB balance
      const bnbBalance = await provider.getBalance(address);
      balances.BNB = ethers.formatEther(bnbBalance);

      // Get token balances
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];

      for (const contract of tokenContracts) {
        try {
          const tokenContract = new ethers.Contract(contract.address, erc20Abi, provider);
          const balance = await tokenContract.balanceOf(address);
          const decimals = await tokenContract.decimals();
          const symbol = await tokenContract.symbol();
          
          balances.tokens[contract.address] = {
            symbol,
            balance: ethers.formatUnits(balance, decimals),
            decimals
          };
        } catch (error) {
          console.error(`Failed to get balance for token ${contract.address}:`, error);
        }
      }

      return balances;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw error;
    }
  }

  // Validate wallet address
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Get transaction details
  async getTransaction(txHash, provider) {
    try {
      const tx = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasLimit: tx.gasLimit,
        gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei'),
        gasUsed: receipt.gasUsed,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        confirmations: await provider.getTransactionCount(tx.hash)
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      throw error;
    }
  }
}

module.exports = WalletManager;
