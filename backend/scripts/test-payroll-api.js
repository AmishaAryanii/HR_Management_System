const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken');
const http = require('http');

async function main() {
  await sequelize.authenticate();
  console.log('=== Testing All Payroll Endpoints ===\n');

  const User = require('../models').User;
  const Employee = require('../models').Employee;

  const admin = await User.findOne({ where: { role: 'admin', isActive: true } });
  if (!admin) { console.log('No admin user found'); process.exit(1); }

  const token = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Testing as:', admin.email, '(' + admin.role + ')');

  const emp = await Employee.findOne({ where: { userId: { [require('sequelize').Op.ne]: admin.id } } });
  if (!emp) { console.log('No employee found for payroll test'); process.exit(1); }
  console.log('Target employee:', emp.firstName, emp.lastName, '(ID:', emp.id, ')\n');

  function request(method, path, body) {
    return new Promise(resolve => {
      const postData = body ? JSON.stringify(body) : null;
      const opts = {
        hostname: 'localhost', port: 5000, path,
        method,
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
      };
      if (postData) opts.headers['Content-Length'] = Buffer.byteLength(postData);

      const req = http.request(opts, res => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { const j = JSON.parse(data); resolve({ status: res.statusCode, success: j.success, msg: j.message, data: j.data }); }
          catch(e) { resolve({ status: res.statusCode, raw: data.substring(0, 200) }); }
        });
      });
      req.on('error', e => resolve({ error: e.message }));
      if (postData) req.write(postData);
      req.end();
    });
  }

  // 1. GET payslips
  console.log('1. GET /api/payroll/payslips');
  let r = await request('GET', '/api/payroll/payslips');
  console.log(r.success === true ? '   ✅ OK' : '   ❌ ' + (r.msg || r.raw));

  // 2. GET payroll list
  console.log('2. GET /api/payroll');
  r = await request('GET', '/api/payroll');
  console.log(r.success === true ? '   ✅ OK' : '   ❌ ' + (r.msg || r.raw));

  // 3. POST process payroll (employee must exist)
  console.log('3. POST /api/payroll/process (full month)');
  r = await request('POST', '/api/payroll/process', {
    employeeId: emp.id, month: 6, year: 2026,
    basicSalary: 30000, hra: 8000, bonus: 2000,
    pfDeduction: 1800, taxDeduction: 500
  });
  console.log(r.success === true ? '   ✅ OK: ' + (r.msg || '') : '   ❌ ' + (r.msg || r.raw));

  // 4. POST process payroll with custom date range
  console.log('4. POST /api/payroll/process (custom range)');
  r = await request('POST', '/api/payroll/process', {
    employeeId: emp.id, month: 6, year: 2026,
    basicSalary: 30000, hra: 8000, bonus: 2000,
    pfDeduction: 1800, taxDeduction: 500,
    startDate: '2026-06-28', endDate: '2026-06-30'
  });
  console.log(r.success === true ? '   ✅ OK: ' + (r.msg || '') : '   ❌ ' + (r.msg || r.raw));

  // 5. GET payslips (should have data now)
  console.log('5. GET /api/payroll/payslips (after process)');
  r = await request('GET', '/api/payroll/payslips');
  if (r.success === true) {
    const count = Array.isArray(r.data) ? r.data.length : 'unknown';
    console.log('   ✅ OK (' + count + ' items)');
  } else {
    console.log('   ❌ ' + (r.msg || r.raw));
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
