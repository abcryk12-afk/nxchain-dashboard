const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  
  // HD Wallet Information
  mnemonicEncrypted: {
    type: String,
    required: true
  },
  xpub: {
    type: String,
    required: true
  },
  xprvEncrypted: {
    type: String,
    required: true
  },
  
  // Multi-Network Addresses
  addresses: {
    bnb: {
      address: String,
      privateKeyEncrypted: String,
      publicKey: String,
      derivationPath: String,
      index: Number,
      contractAddress: String,
      decimals: Number,
      createdAt: { type: Date, default: Date.now }
    },
    ethereum: {
      address: String,
      privateKeyEncrypted: String,
      publicKey: String,
      derivationPath: String,
      index: Number,
      contractAddress: String,
      decimals: Number,
      createdAt: { type: Date, default: Date.now }
    },
    tron: {
      address: String,
      privateKeyEncrypted: String,
      publicKey: String,
      derivationPath: String,
      index: Number,
      contractAddress: String,
      decimals: Number,
      createdAt: { type: Date, default: Date.now }
    },
    polygon: {
      address: String,
      privateKeyEncrypted: String,
      publicKey: String,
      derivationPath: String,
      index: Number,
      contractAddress: String,
      decimals: Number,
      createdAt: { type: Date, default: Date.now }
    }
  },
  
  // Wallet Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Security
  walletPassword: {
    type: String,
    required: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
walletSchema.index({ 'addresses.bnb.address': 1 });
walletSchema.index({ 'addresses.ethereum.address': 1 });
walletSchema.index({ 'addresses.tron.address': 1 });
walletSchema.index({ 'addresses.polygon.address': 1 });
walletSchema.index({ createdAt: 1 });

// Pre-save middleware
walletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
walletSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true });
};

walletSchema.statics.findByAddress = function(address, network) {
  const query = {};
  query[`addresses.${network}.address`] = address;
  return this.findOne(query);
};

// Instance methods
walletSchema.methods.getAddress = function(network) {
  return this.addresses[network];
};

walletSchema.methods.getAllAddresses = function() {
  const addresses = {};
  for (const [network, data] of Object.entries(this.addresses)) {
    addresses[network] = {
      address: data.address,
      contractAddress: data.contractAddress,
      decimals: data.decimals,
      createdAt: data.createdAt
    };
  }
  return addresses;
};

walletSchema.methods.updateAddress = function(network, addressData) {
  if (this.addresses[network]) {
    this.addresses[network] = { ...this.addresses[network], ...addressData };
    this.markModified(`addresses.${network}`);
  }
  return this.save();
};

walletSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);
