/**
 * Schema sync script - adds missing columns to database tables
 * without dropping or altering existing data.
 *
 * Run: node scripts/sync-schema.js
 */
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function getExistingColumns(tableName) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName`,
    { replacements: { tableName }, type: QueryTypes.SELECT }
  );
  // The result might be an array or a single row depending on driver
  if (Array.isArray(rows)) return rows.map(r => r.COLUMN_NAME);
  if (rows && rows.length === undefined) return [rows.COLUMN_NAME];
  return [];
}

async function addColumn(table, column, definition) {
  try {
    // Check if column already exists
    const [rows] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      { replacements: [table, column], type: QueryTypes.SELECT }
    );

    const exists = rows && (Array.isArray(rows) ? rows.length > 0 : true);
    if (exists) {
      console.log(`  ✓ ${table}.${column} already exists`);
      return;
    }

    await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    console.log(`  + ${table}.${column} added`);
  } catch (err) {
    console.log(`  ✗ ${table}.${column} FAILED: ${err.message}`);
  }
}

async function main() {
  console.log('\n=== Syncing Database Schema ===\n');

  try {
    await sequelize.authenticate();
    console.log('Database connected.\n');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  // === tasks table ===
  console.log('--- tasks ---');
  await addColumn('tasks', 'attachments', "attachments JSON NULL COMMENT 'Array of { filename, url, uploadedAt }'");
  await addColumn('tasks', 'comments', "comments JSON NULL COMMENT 'Array of { userId, name, text, createdAt }'");
  await addColumn('tasks', 'verified_by', 'verified_by INT NULL');
  await addColumn('tasks', 'verified_at', 'verified_at DATETIME NULL');

  // === leaves table ===
  console.log('\n--- leaves ---');
  await addColumn('leaves', 'approved_by_manager_name', 'approved_by_manager_name VARCHAR(100) NULL');
  await addColumn('leaves', 'approved_by_manager_role', 'approved_by_manager_role VARCHAR(50) NULL');
  await addColumn('leaves', 'approved_by_admin_name', 'approved_by_admin_name VARCHAR(100) NULL');
  await addColumn('leaves', 'approved_by_admin_role', 'approved_by_admin_role VARCHAR(50) NULL');
  await addColumn('leaves', 'rejected_by', 'rejected_by INT NULL');
  await addColumn('leaves', 'rejected_by_name', 'rejected_by_name VARCHAR(100) NULL');
  await addColumn('leaves', 'rejected_by_role', 'rejected_by_role VARCHAR(50) NULL');
  await addColumn('leaves', 'rejected_at', 'rejected_at DATETIME NULL');
  await addColumn('leaves', 'approved_at', 'approved_at DATETIME NULL');

  // === attendances table ===
  console.log('\n--- attendances ---');
  await addColumn('attendances', 'marked_by_name', 'marked_by_name VARCHAR(100) NULL');
  await addColumn('attendances', 'status_updated_by', 'status_updated_by INT NULL');
  await addColumn('attendances', 'status_updated_by_name', 'status_updated_by_name VARCHAR(100) NULL');
  await addColumn('attendances', 'status_updated_by_role', 'status_updated_by_role VARCHAR(50) NULL');
  await addColumn('attendances', 'status_updated_at', 'status_updated_at DATETIME NULL');

  // === payrolls table ===
  console.log('\n--- payrolls ---');
  await addColumn('payrolls', 'processed_by_name', 'processed_by_name VARCHAR(100) NULL');
  await addColumn('payrolls', 'processed_by_role', 'processed_by_role VARCHAR(50) NULL');
  await addColumn('payrolls', 'processed_at', 'processed_at DATETIME NULL');
  await addColumn('payrolls', 'approved_by_name', 'approved_by_name VARCHAR(100) NULL');
  await addColumn('payrolls', 'approved_by_role', 'approved_by_role VARCHAR(50) NULL');
  await addColumn('payrolls', 'approved_at', 'approved_at DATETIME NULL');
  await addColumn('payrolls', 'paid_by_name', 'paid_by_name VARCHAR(100) NULL');
  await addColumn('payrolls', 'paid_by_role', 'paid_by_role VARCHAR(50) NULL');
  await addColumn('payrolls', 'paid_at', 'paid_at DATETIME NULL');
  await addColumn('payrolls', 'payment_method', "payment_method ENUM('bank_transfer','cheque','cash') DEFAULT 'bank_transfer' NULL");

  // === performance_reviews table ===
  console.log('\n--- performance_reviews ---');
  await addColumn('performance_reviews', 'reviewer_role', 'reviewer_role VARCHAR(50) NULL');

  // === payslips table ===
  console.log('\n--- payslips ---');
  await addColumn('payslips', 'start_date', 'start_date DATE NULL');
  await addColumn('payslips', 'end_date', 'end_date DATE NULL');
  await addColumn('payslips', 'working_days', 'working_days INT NULL');
  await addColumn('payslips', 'paid_days', 'paid_days INT NULL');
  await addColumn('payslips', 'lop_days', 'lop_days INT NULL');
  await addColumn('payslips', 'daily_rate', 'daily_rate DECIMAL(12,2) NULL');

  console.log('\n=== Schema sync complete ===\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
