const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-passwordHash -encryptedKey -identityHash')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
