const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// Reject non-string inputs. Without this, a JSON body like {"phone": {"$gt": ""}}
// turns a findOne() into a NoSQL operator query (injection).
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, nrcNumber, password } = req.body;
    if (![fullName, phone, nrcNumber, password].every(isNonEmptyString))
      return res.status(400).json({ error: 'All fields are required' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check each duplicate separately for specific messages
    const phoneExists = await User.findOne({ phone });
    if (phoneExists)
      return res.status(400).json({ error: 'This phone number is already registered. Please login instead.' });

    const nrcExists = await User.findOne({ nrcNumber });
    if (nrcExists)
      return res.status(400).json({ error: 'This NRC number is already registered. Each person can only have one account.' });

    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = await wallet.encrypt(password);
    const passwordHash = await bcrypt.hash(password, 12);
    const identityHash = crypto.createHash('sha256').update(fullName + nrcNumber + phone).digest('hex');

    const user = new User({ fullName, phone, nrcNumber, passwordHash, walletAddress: wallet.address, encryptedKey, identityHash });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, walletAddress: wallet.address },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { fullName: user.fullName, phone: user.phone, walletAddress: wallet.address, identityHash }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!isNonEmptyString(phone) || !isNonEmptyString(password))
      return res.status(400).json({ error: 'Phone and password are required' });

    const user = await User.findOne({ phone });

    // Always run a bcrypt comparison (even when the user is missing) so that
    // response timing does not reveal whether an account exists.
    const hash = user ? user.passwordHash : '$2a$12$0000000000000000000000000000000000000000000000000000a';
    const valid = await bcrypt.compare(password, hash);

    if (!user || !valid)
      return res.status(400).json({ error: 'Invalid phone number or password.' });

    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { fullName: user.fullName, phone: user.phone, walletAddress: user.walletAddress, identityHash: user.identityHash, isAdmin: user.isAdmin }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
