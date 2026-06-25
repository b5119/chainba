const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName:            { type: String, required: true },
  phone:               { type: String, required: true, unique: true },
  nrcNumber:           { type: String, required: true, unique: true },
  passwordHash:        { type: String, required: true },
  walletAddress:       { type: String, required: true, unique: true },
  encryptedKey:        { type: String, required: true },
  identityHash:        { type: String, required: true },
  email:               { type: String, default: '' },
  isAdmin:             { type: Boolean, default: false },
  twoFactorEnabled:    { type: Boolean, default: false },
  emailNotifications:  { type: Boolean, default: true },
  smsNotifications:    { type: Boolean, default: false },
  createdAt:           { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
