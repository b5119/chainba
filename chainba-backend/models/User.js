const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName:      { type: String, required: true },
  phone:         { type: String, required: true, unique: true },
  nrcNumber:     { type: String, required: true, unique: true },
  passwordHash:  { type: String, required: true },
  walletAddress: { type: String, required: true, unique: true },
  encryptedKey:  { type: String, required: true },
  identityHash:  { type: String, required: true },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
