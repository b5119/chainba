const express = require('express');
const User = require('../models/User');
const router = express.Router();

const ADMIN_KEY = "chainba2026";

const adminAuth = (req, res, next) => {
  if (req.headers["x-admin-key"] !== ADMIN_KEY)
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash -encryptedKey').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;