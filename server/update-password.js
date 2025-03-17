// Add this to a temporary script file (update-password.js) in your server directory
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const updatePassword = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sologram');
    console.log('MongoDB connected');
    
    // Generate a new hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('BethisGreat2019!', salt);
    
    // Update user's password
    const result = await User.updateOne(
      { email: 'abutler911@gmail.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('Password updated:', result.modifiedCount > 0 ? 'Success' : 'Failed');
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
};

updatePassword();