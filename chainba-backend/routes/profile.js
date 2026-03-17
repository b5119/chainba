const express = require('express');
const ethers = require('ethers');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -encryptedKey');
    if (!user)
      return res.status(404).json({ error: 'User not found' });

    // Get ETH balance from blockchain
    const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_RPC);
    const balance = await provider.getBalance(user.walletAddress);

    res.json({
      ...user.toObject(),
      ethBalance: ethers.formatEther(balance)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
