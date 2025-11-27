const bip39 = require('bip39');
const hdkey = require('hdkey');
const ethUtil = require('ethereumjs-util');
const crypto = require('crypto-js');
const ethers = require('ethers');
const Web3 = require('web3');

class HDWalletService {
  constructor() {
    // Master mnemonic from user (EXTREMELY SECURE!)
    this.masterMnemonic = 'danger attack gesture cliff clap stage tag spare loop cousin either put';
    
    // Network configurations
    this.networks = {
      bnb: {
        name: 'Binance Smart Chain (BEP-20)',
        derivationPath: "m/44'/714'/0'/0",
        rpcUrl: 'https://bsc-dataseed.binance.org/',
        contractAddress: '0x55d398326f99059ff775485246999027b3197955', // USDT on BSC
        decimals: 18
      },
      ethereum: {
        name: 'Ethereum (ERC-20)',
        derivationPath: "m/44'/60'/0'/0",
        rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        contractAddress: '0x0755BF4a88cf59adEd7f8800Ef34CcA8a8105Cfe', // USDT on Ethereum
        decimals: 6
      },
      tron: {
        name: 'TRON (TRC-20)',
        derivationPath: "m/44'/195'/0'/0",
        rpcUrl: 'https://api.trongrid.io',
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // USDT on TRON
        decimals: 6
      },
      polygon: {
        name: 'Polygon (MATIC)',
        derivationPath: "m/44'/60'/0'/0",
        rpcUrl: 'https://polygon-rpc.com',
        contractAddress: '0xc2132D05D31c914a87C661d10748AEb04B58e8F', // USDT on Polygon
        decimals: 6
      }
    };

    // Generate master HD wallet
    this.masterSeed = bip39.mnemonicToSeedSync(this.masterMnemonic);
    this.masterHDWallet = hdkey.fromMasterSeed(this.masterSeed);
    this.xpub = this.masterHDWallet.publicExtendedKey();
    this.xprv = this.masterHDWallet.privateExtendedKey();
  }

  // Generate wallet for specific user
  generateUserWallet(userId) {
    console.log(`🔥 Generating wallet for user: ${userId}`);
    
    const userIndex = this.getUserIndex(userId);
    const userWallet = {
      userId,
      mnemonicEncrypted: this.encrypt(this.masterMnemonic, userId),
      xpub: this.xpub,
      xprvEncrypted: this.encrypt(this.xprv, userId),
      addresses: {},
      createdAt: new Date()
    };

    // Generate addresses for all networks
    for (const [networkKey, network] of Object.entries(this.networks)) {
      const addressData = this.generateAddress(networkKey, userIndex);
      userWallet.addresses[networkKey] = addressData;
    }

    return userWallet;
  }

  // Generate address for specific network
  generateAddress(network, userIndex) {
    const networkConfig = this.networks[network];
    if (!networkConfig) {
      throw new Error(`Network ${network} not supported`);
    }

    const derivationPath = `${networkConfig.derivationPath}/${userIndex}`;
    const child = this.masterHDWallet.derivePath(derivationPath);
    
    let address, privateKey;

    if (network === 'tron') {
      // TRON uses different address format
      const privateKeyBuffer = child.privateKey;
      privateKey = privateKeyBuffer.toString('hex');
      
      // Generate TRON address (simplified version)
      const addressBuffer = ethUtil.privateToAddress(privateKeyBuffer);
      address = this.tronAddressFromHex(addressBuffer.toString('hex'));
    } else {
      // Ethereum-compatible addresses (BSC, ETH, Polygon)
      privateKey = child.privateKey.toString('hex');
      const publicKey = ethUtil.privateToPublic(child.privateKey);
      address = '0x' + ethUtil.publicToAddress(publicKey).toString('hex');
    }

    return {
      network,
      address,
      privateKey: this.encrypt(privateKey, userIndex.toString()),
      publicKey: child.publicKey.toString('hex'),
      derivationPath,
      index: userIndex,
      contractAddress: networkConfig.contractAddress,
      decimals: networkConfig.decimals,
      rpcUrl: networkConfig.rpcUrl
    };
  }

  // Convert hex to TRON address format
  tronAddressFromHex(hexAddress) {
    // Simplified TRON address generation
    // In production, use proper TRON address generation
    return 'T' + hexAddress.substring(2, 10).toUpperCase() + hexAddress.substring(10, 26).toUpperCase();
  }

  // Get user index from userId
  getUserIndex(userId) {
    // Generate deterministic index from userId
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  // Encrypt sensitive data
  encrypt(data, key) {
    return crypto.AES.encrypt(data, key).toString();
  }

  // Decrypt sensitive data
  decrypt(encryptedData, key) {
    const bytes = crypto.AES.decrypt(encryptedData, key);
    return bytes.toString(crypto.enc.Utf8);
  }

  // Get private key for user and network
  getPrivateKey(userId, network) {
    const userIndex = this.getUserIndex(userId);
    const derivationPath = `${this.networks[network].derivationPath}/${userIndex}`;
    const child = this.masterHDWallet.derivePath(derivationPath);
    
    if (network === 'tron') {
      return child.privateKey.toString('hex');
    } else {
      return '0x' + child.privateKey.toString('hex');
    }
  }

  // Get all network addresses for user
  getUserAddresses(userId) {
    const userIndex = this.getUserIndex(userId);
    const addresses = {};

    for (const [networkKey, network] of Object.entries(this.networks)) {
      const addressData = this.generateAddress(networkKey, userIndex);
      addresses[networkKey] = {
        address: addressData.address,
        network: networkKey,
        contractAddress: addressData.contractAddress,
        decimals: addressData.decimals
      };
    }

    return addresses;
  }

  // Validate address format
  validateAddress(address, network) {
    if (network === 'tron') {
      return address.startsWith('T') && address.length === 34;
    } else {
      return address.startsWith('0x') && address.length === 42;
    }
  }

  // Get network configuration
  getNetworkConfig(network) {
    return this.networks[network];
  }

  // Get master wallet info (for admin only)
  getMasterWalletInfo() {
    return {
      mnemonicLength: this.masterMnemonic.split(' ').length,
      xpub: this.xpub.substring(0, 20) + '...', // Partial for security
      supportedNetworks: Object.keys(this.networks),
      totalUsers: 'N/A' // Will be updated from database
    };
  }
}

module.exports = HDWalletService;
