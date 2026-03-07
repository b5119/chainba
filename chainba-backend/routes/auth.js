const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, nrcNumber, password } = req.body;
    if (!fullName || !phone || !nrcNumber || !password)
      return res.status(400).json({ error: 'All fields are required' });

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
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password are required' });

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(400).json({ error: 'No account found with this phone number. Please register first.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });

    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { fullName: user.fullName, phone: user.phone, walletAddress: user.walletAddress, identityHash: user.identityHash }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;