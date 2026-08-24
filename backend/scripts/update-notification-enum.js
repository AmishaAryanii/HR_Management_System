/**
 * Updates the notifications.type ENUM to include all new types.
 * Run: node scripts/update-notification-enum.js
 */
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function main() {
  await sequelize.authenticate();
  console.log('Database connected.');

  // Check current ENUM values
  const [rows] = await sequelize.query(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'",
    { type: QueryTypes.SELECT }
  );

  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || !row.COLUMN_TYPE) {
    console.log('Could not read notifications.type column');
    process.exit(1);
  }

  const currentEnum = row.COLUMN_TYPE;
  console.log('Current ENUM:', currentEnum);

  const desiredValues = [
    'leave_request', 'leave_approved', 'leave_rejected',
    'task_assigned', 'task_updated', 'task_completed',
    'announcement',
    'payroll_updated', 'payslip_generated', 'payroll_approved', 'payroll_paid',
    'attendance_reminder', 'attendance_correction', 'attendance_approved', 'attendance_rejected',
    'review_scheduled', 'review_added',
    'document_verified', 'candidate_status',
    'role_changed', 'employee_created', 'employee_promoted',
    'general'
  ];

  // Parse existing values from ENUM definition
  const match = currentEnum.match(/^enum\((.*)\)$/i);
  if (!match) { console.log('Not an ENUM column'); process.exit(1); }

  const existingValues = match[1].split(',').map(v => v.replace(/'/g, '').trim());
  console.log('Existing values (' + existingValues.length + '):', existingValues);

  const missing = desiredValues.filter(v => !existingValues.includes(v));
  if (missing.length === 0) {
    console.log('No missing values - ENUM is already up to date');
    process.exit(0);
  }

  console.log('Missing values (' + missing.length + '):', missing);

  // Build the quoted list for the SQL
  const quoted = desiredValues.map(v => "'" + v + "'");
  const sql = "ALTER TABLE notifications MODIFY COLUMN type ENUM(" + quoted.join(',') + ") NOT NULL";

  await sequelize.query(sql, { type: QueryTypes.RAW });
  console.log('ENUM updated successfully with new values:', missing);
  process.exit(0);
}

main().catch(e => { console.log('Fatal:', e.message); process.exit(1); });
