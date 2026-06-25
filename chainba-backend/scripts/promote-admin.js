// Promote (or demote) a user to admin by phone number.
//
//   node scripts/promote-admin.js <phone>            # grant admin
//   node scripts/promote-admin.js <phone> --revoke   # remove admin
//
// Run from the chainba-backend directory so .env is picked up.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const phone = process.argv[2];
  const revoke = process.argv.includes('--revoke');
  if (!phone) {
    console.error('Usage: node scripts/promote-admin.js <phone> [--revoke]');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ phone });
    if (!user) {
      console.error(`No user found with phone "${phone}".`);
      process.exit(1);
    }
    user.isAdmin = !revoke;
    await user.save();
    console.log(`${user.fullName} (${phone}) isAdmin = ${user.isAdmin}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
