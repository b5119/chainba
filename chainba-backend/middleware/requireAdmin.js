const User = require('../models/User');

// Role-based admin gate. MUST run after authMiddleware, which sets req.user
// from the verified JWT. The admin flag is read from the database (not trusted
// from the token) so that revoking admin takes effect immediately, without
// waiting for the token to expire.
module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.user.userId).select('isAdmin');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
