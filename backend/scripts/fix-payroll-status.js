/**
 * Fix payrolls.status ENUM and ensure proper default value.
 * Run: node scripts/fix-payroll-status.js
 */
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function main() {
  await sequelize.authenticate();
  console.log('Connected.\n');

  // 1. Check current ENUM for payrolls.status
  console.log('--- Checking payrolls.status column ---');
  const [rows] = await sequelize.query(
    "SELECT COLUMN_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS " +
    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payrolls' AND COLUMN_NAME = 'status'",
    { type: QueryTypes.SELECT }
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) {
    console.log('payrolls.status column not found - need to add it');
    await sequelize.query(
      "ALTER TABLE payrolls ADD COLUMN status ENUM('draft','generated','approved','paid','cancelled') DEFAULT 'draft'",
      { type: QueryTypes.RAW }
    );
    console.log('  + Column added');
  } else {
    console.log('  Current type:', row.COLUMN_TYPE);
    console.log('  Current default:', row.COLUMN_DEFAULT);

    // Check if ENUM includes all expected values
    const expectedValues = ['draft', 'generated', 'approved', 'paid', 'cancelled'];
    const currentType = row.COLUMN_TYPE || '';
    const allPresent = expectedValues.every(v => currentType.includes("'" + v + "'"));

    if (!allPresent) {
      console.log('  ENUM values mismatch - updating...');
      await sequelize.query(
        "ALTER TABLE payrolls MODIFY COLUMN status ENUM('draft','generated','approved','paid','cancelled') DEFAULT 'draft'",
        { type: QueryTypes.RAW }
      );
      console.log('  ✅ ENUM updated');
    } else {
      console.log('  ✅ ENUM is correct');
    }
  }

  // 2. Fix existing rows with empty/null status
  console.log('\n--- Fixing existing records ---');
  const [result] = await sequelize.query(
    "UPDATE payrolls SET status = 'draft' WHERE status IS NULL OR status = ''",
    { type: QueryTypes.UPDATE }
  );
  console.log('  ✅ Updated ' + (result?.affectedRows || 0) + ' rows');

  // 3. Check payslips table too
  console.log('\n--- Checking payslips.status column ---');
  const [psRows] = await sequelize.query(
    "SELECT COLUMN_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS " +
    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payslips' AND COLUMN_NAME = 'status'",
    { type: QueryTypes.SELECT }
  );
  const psRow = Array.isArray(psRows) ? psRows[0] : psRows;
  if (psRow) {
    console.log('  Type:', psRow.COLUMN_TYPE);
    console.log('  Default:', psRow.COLUMN_DEFAULT);
    // Fix empty statuses
    const [psResult] = await sequelize.query(
      "UPDATE payslips SET status = 'generated' WHERE status IS NULL OR status = ''",
      { type: QueryTypes.UPDATE }
    );
    console.log('  ✅ Updated ' + (psResult?.affectedRows || 0) + ' payslips');
  } else {
    console.log('  payslips.status column not found');
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
