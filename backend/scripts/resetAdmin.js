#!/usr/bin/env node
/**
 * Reset admin password
 * Usage: node scripts/resetAdmin.js [newPassword]
 * Default new password: admin123
 */
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User } = require('../models');

const newPassword = process.argv[2] || 'admin123';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      console.error('❌ No admin user found. Run seeders first: npm run seed');
      process.exit(1);
    }

    // The User model has a beforeUpdate hook that hashes the password,
    // so we just need to set the plain text and save.
    admin.password = newPassword;
    await admin.save();

    console.log(`\n✅ Admin password has been reset successfully!`);
    console.log(`\n  Username: ${admin.username}`);
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Password: ${newPassword}`);
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
