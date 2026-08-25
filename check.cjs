require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({}).lean();
  console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, name: u.name, userId: u.userId })), null, 2));
  process.exit(0);
});
