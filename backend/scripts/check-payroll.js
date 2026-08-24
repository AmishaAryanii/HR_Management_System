const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const http = require('http');

async function main() {
  await sequelize.authenticate();
  console.log('=== Database Connected ===\n');

  // Check payrolls table columns
  console.log('--- payrolls table ---');
  const [pr] = await sequelize.query(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payrolls' ORDER BY ORDINAL_POSITION",
    { type: QueryTypes.SELECT }
  );
  const payrollCols = Array.isArray(pr) ? pr : [pr];
  payrollCols.forEach(c => console.log('  ' + c.COLUMN_NAME + ' (' + c.COLUMN_TYPE + ')'));

  // Check payslips table columns
  console.log('\n--- payslips table ---');
  const [ps] = await sequelize.query(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payslips' ORDER BY ORDINAL_POSITION",
    { type: QueryTypes.SELECT }
  );
  const payslipCols = Array.isArray(ps) ? ps : [ps];
  payslipCols.forEach(c => console.log('  ' + c.COLUMN_NAME + ' (' + c.COLUMN_TYPE + ')'));

  // Test the API
  console.log('\n=== Testing Payroll API ===');
  const User = require('../models').User;
  const user = await User.findOne({ where: { isActive: true }, order: [['role', 'ASC']] });
  if (!user) { console.log('No active user found'); process.exit(1); }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Testing as:', user.email, '(' + user.role + ')\n');

  function httpGet(path) {
    return new Promise(resolve => {
      const opts = { hostname: 'localhost', port: 5000, path, headers: { 'Authorization': 'Bearer ' + token }, timeout: 10000 };
      http.get(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { const d = JSON.parse(data); resolve({ status: res.statusCode, success: d.success, data: d.data, msg: d.message }); }
          catch (e) { resolve({ status: res.statusCode, error: 'Parse error', raw: data.substring(0, 200) }); }
        });
      }).on('error', e => resolve({ error: e.message }));
    });
  }

  const endpoints = [
    ['GET /api/payroll', '/api/payroll'],
    ['GET /api/payroll/payslips', '/api/payroll/payslips'],
  ];

  for (const [label, path] of endpoints) {
    const result = await httpGet(path);
    if (result.success === true) {
      const items = Array.isArray(result.data) ? result.data.length : 'ok';
      console.log('  ' + label + ': ✅ OK (' + items + ' items)');
    } else {
      console.log('  ' + label + ': ❌ FAIL - ' + (result.msg || result.error || JSON.stringify(result)));
    }
  }

  // Try to find a user who can process payroll
  const adminUser = await User.findOne({ where: { role: ['super_admin', 'admin'], isActive: true } });
  if (adminUser) {
    const adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('\n  --- Testing with admin token (' + adminUser.email + ') ---');
    const result = await httpGet('/api/payroll');
    if (result.success === true) {
      console.log('  GET /api/payroll (admin): ✅ OK (' + (Array.isArray(result.data) ? result.data.length : 'n/a') + ' items)');
    } else {
      console.log('  GET /api/payroll (admin): ❌ FAIL - ' + (result.msg || result.error || JSON.stringify(result)));
    }
  } else {
    console.log('\n  No admin user found to test authorized endpoints');
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
