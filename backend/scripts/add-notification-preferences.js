const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if column exists
    const [columns] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'notification_preferences'",
      { type: QueryTypes.SELECT }
    );

    if (columns) {
      console.log('✓ notification_preferences column already exists');
    } else {
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN notification_preferences JSON NULL AFTER reset_password_expires",
        { type: QueryTypes.RAW }
      );
      console.log('✅ Added notification_preferences column to users table');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
