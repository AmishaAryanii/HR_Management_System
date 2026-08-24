/**
 * Rebuild payrolls and payslips tables with all required columns.
 * Run: node scripts/rebuild-payroll-schema.js
 */
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    { replacements: [table, column], type: QueryTypes.SELECT }
  );
  const row = Array.isArray(rows) ? rows[0] : rows;
  return !!row;
}

async function addColumnIfMissing(table, columnDef) {
  const [colName] = columnDef.split(' ');
  const exists = await columnExists(table, colName);
  if (exists) {
    console.log('  ✓ ' + table + '.' + colName + ' already exists');
    return;
  }
  try {
    await sequelize.query('ALTER TABLE `' + table + '` ADD COLUMN ' + columnDef, { type: QueryTypes.RAW });
    console.log('  + ' + table + '.' + colName + ' added');
  } catch (err) {
    console.log('  ✗ ' + table + '.' + colName + ' FAILED: ' + err.message);
  }
}

async function main() {
  await sequelize.authenticate();
  console.log('Database connected.\n');

  // ═══════════════════════════════════════
  // payrolls table - ALL columns
  // ═══════════════════════════════════════
  console.log('=== payrolls table ===');

  const payrollColumns = [
    'employee_id INT NOT NULL',
    'month INT NOT NULL',
    'year INT NOT NULL',
    'basic_salary DECIMAL(12,2) NOT NULL',
    'hra DECIMAL(12,2) DEFAULT 0',
    'da DECIMAL(12,2) DEFAULT 0',
    'ta DECIMAL(12,2) DEFAULT 0',
    'special_allowance DECIMAL(12,2) DEFAULT 0',
    'medical_allowance DECIMAL(12,2) DEFAULT 0',
    'phone_allowance DECIMAL(12,2) DEFAULT 0',
    'bonus DECIMAL(12,2) DEFAULT 0',
    'overtime_pay DECIMAL(12,2) DEFAULT 0',
    'gross_pay DECIMAL(12,2) NOT NULL',
    'pf_deduction DECIMAL(12,2) DEFAULT 0',
    'tax_deduction DECIMAL(12,2) DEFAULT 0',
    'insurance_deduction DECIMAL(12,2) DEFAULT 0',
    'loan_deduction DECIMAL(12,2) DEFAULT 0',
    'other_deductions DECIMAL(12,2) DEFAULT 0',
    'total_deductions DECIMAL(12,2) DEFAULT 0',
    'net_pay DECIMAL(12,2) NOT NULL',
    "status ENUM('draft','generated','approved','paid','cancelled') DEFAULT 'draft'",
    'processed_by INT NULL',
    'processed_by_name VARCHAR(100) NULL',
    'processed_by_role VARCHAR(50) NULL',
    'processed_at DATETIME NULL',
    'approved_by INT NULL',
    'approved_by_name VARCHAR(100) NULL',
    'approved_by_role VARCHAR(50) NULL',
    'approved_at DATETIME NULL',
    'paid_by INT NULL',
    'paid_by_name VARCHAR(100) NULL',
    'paid_by_role VARCHAR(50) NULL',
    'paid_at DATETIME NULL',
    "payment_method ENUM('bank_transfer','cheque','cash') DEFAULT 'bank_transfer'",
    'notes TEXT NULL',
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  ];

  for (const col of payrollColumns) {
    await addColumnIfMissing('payrolls', col);
  }

  // ═══════════════════════════════════════
  // payslips table - ALL columns
  // ═══════════════════════════════════════
  console.log('\n=== payslips table ===');

  const payslipColumns = [
    'employee_id INT NOT NULL',
    'payroll_id INT NULL',
    'payslip_number VARCHAR(50) NOT NULL',
    'month INT NOT NULL',
    'year INT NOT NULL',
    'start_date DATE NULL',
    'end_date DATE NULL',
    'working_days INT NULL',
    'paid_days DECIMAL(6,2) NULL',
    'lop_days INT NULL',
    'basic_salary DECIMAL(12,2) NOT NULL',
    'allowances JSON NULL',
    'deductions JSON NULL',
    'gross_pay DECIMAL(12,2) NOT NULL',
    'total_deductions DECIMAL(12,2) NOT NULL',
    'net_pay DECIMAL(12,2) NOT NULL',
    'daily_rate DECIMAL(12,2) NULL',
    'pdf_path VARCHAR(255) NULL',
    "status ENUM('generated','sent','downloaded') DEFAULT 'generated'",
    'sent_at DATETIME NULL',
    'created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  ];

  for (const col of payslipColumns) {
    await addColumnIfMissing('payslips', col);
  }

  // Add indexes
  console.log('\n=== Indexes ===');
  try {
    const [indexes] = await sequelize.query(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payrolls' AND INDEX_NAME = 'payrolls_employee_id_month_year'",
      { type: QueryTypes.SELECT }
    );
    if (!indexes || (Array.isArray(indexes) && indexes.length === 0)) {
      await sequelize.query(
        'ALTER TABLE `payrolls` ADD UNIQUE INDEX `payrolls_employee_id_month_year` (`employee_id`, `month`, `year`)',
        { type: QueryTypes.RAW }
      );
      console.log('  + payrolls unique index added');
    } else {
      console.log('  ✓ payrolls unique index exists');
    }
  } catch (err) {
    console.log('  ✗ payrolls index: ' + err.message);
  }

  // Unique index on payslip_number
  try {
    const [idx2] = await sequelize.query(
      "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payslips' AND INDEX_NAME = 'payslip_number'",
      { type: QueryTypes.SELECT }
    );
    if (!idx2 || (Array.isArray(idx2) && idx2.length === 0)) {
      await sequelize.query(
        'ALTER TABLE `payslips` ADD UNIQUE INDEX `payslip_number` (`payslip_number`)',
        { type: QueryTypes.RAW }
      );
      console.log('  + payslips unique index on payslip_number added');
    } else {
      console.log('  ✓ payslips unique index exists');
    }
  } catch (err) {
    console.log('  ✗ payslips index: ' + err.message);
  }

  console.log('\n=== Schema rebuild complete! ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
