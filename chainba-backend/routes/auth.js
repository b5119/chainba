const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, nrcNumber, password } = req.body;

    if (!fullName || !phone || !nrcNumber || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const exists = await User.findOne({ $or: [{ phone }, { nrcNumber }] });
    if (exists)
      return res.status(400).json({ error: 'Phone or NRC already registered' });

    // Auto-create blockchain wallet
    const wallet = ethers.Wallet.createRandom();

    // Encrypt wallet with user password
    const encryptedKey = await wallet.encrypt(password);

    // Hash password for login
    const passwordHash = await bcrypt.hash(password, 12);

    // Create identity hash (same as smart contract)
    const identityHash = crypto
      .createHash('sha256')
      .update(fullName + nrcNumber + phone)
      .digest('hex');

    const user = new User({
      fullName,
      phone,
      nrcNumber,
      passwordHash,
      walletAddress: wallet.address,
      encryptedKey,
      identityHash
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, walletAddress: wallet.address },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        fullName: user.fullName,
        phone: user.phone,
        walletAddress: wallet.address,
        identityHash
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user)
      return res.status(400).json({ error: 'Invalid phone or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(400).json({ error: 'Invalid phone or password' });

    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        fullName: user.fullName,
        phone: user.phone,
        walletAddress: user.walletAddress,
        identityHash: user.identityHash
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
