require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sologram');
    console.log('MongoDB connected');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create salt & hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
    
    // Create new admin user
    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      bio: 'SoloGram Administrator',
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Admin user created successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser();