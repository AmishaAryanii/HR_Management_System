const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken');
const http = require('http');

async function main() {
  await sequelize.authenticate();
  console.log('=== Full Payroll Workflow Test ===\n');

  const User = require('../models').User;
  const Employee = require('../models').Employee;

  const admin = await User.findOne({ where: { role: 'admin', isActive: true }, order: [['createdAt', 'ASC']] });
  if (!admin) { console.log('No admin found'); process.exit(1); }

  const normalUser = await User.findOne({ where: { role: 'employee', isActive: true }, order: [['createdAt', 'ASC']] });
  if (!normalUser) { console.log('No employee found'); process.exit(1); }

  const adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const empToken = jwt.sign({ id: normalUser.id, role: normalUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const emp = await Employee.findOne({ where: { userId: normalUser.id } });
  console.log('Admin:', admin.email, '(' + admin.role + ')');
  console.log('Employee:', normalUser.email, '(' + normalUser.role + ')' + (emp ? ' EmpID: ' + emp.id : ''));
  console.log('');

  function req(method, path, body, token) {
    return new Promise(resolve => {
      const postData = body ? JSON.stringify(body) : null;
      const opts = {
        hostname: 'localhost', port: 5000, path, method,
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
      };
      if (postData) opts.headers['Content-Length'] = Buffer.byteLength(postData);
      const r = http.request(opts, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { const j = JSON.parse(d); resolve({ success: j.success, msg: j.message, data: j.data, status: res.statusCode }); }
          catch (e) { resolve({ success: false, msg: 'Parse error: ' + d.substring(0, 100), status: res.statusCode }); }
        });
      });
      r.on('error', e => resolve({ success: false, msg: e.message }));
      if (postData) r.write(postData);
      r.end();
    });
  }

  // 1. Employee tries to access payroll list (should be denied)
  console.log('1. Employee accesses GET /api/payroll');
  let r = await req('GET', '/api/payroll', null, empToken);
  console.log(r.status === 403 ? '   ✅ Correctly blocked (403)' : '   ❌ Unexpected: ' + r.status + ' - ' + (r.msg || ''));

  // 2. Admin accesses payroll list
  console.log('2. Admin accesses GET /api/payroll');
  r = await req('GET', '/api/payroll', null, adminToken);
  console.log(r.success ? '   ✅ OK' : '   ❌ Failed: ' + (r.msg || ''));

  // 3. Process payroll
  console.log('3. Process payroll for employee');
  r = await req('POST', '/api/payroll/process', {
    employeeId: emp.id, month: 6, year: 2026,
    basicSalary: 30000, hra: 8000, bonus: 2000,
    pfDeduction: 1800, taxDeduction: 500
  }, adminToken);
  console.log(r.success ? '   ✅ OK: ' + (r.msg || 'Done') : '   ❌ Failed: ' + (r.msg || ''));
  const payrollId = r.data?.id;

  // 4. Get payslips list
  console.log('4. GET /api/payroll/payslips');
  r = await req('GET', '/api/payroll/payslips', null, adminToken);
  if (r.success) {
    const count = Array.isArray(r.data) ? r.data.length : 0;
    console.log('   ✅ OK (' + count + ' payslips)');
  } else {
    console.log('   ❌ Failed: ' + (r.msg || ''));
  }

  // 5. View a single payslip
  console.log('5. GET /api/payroll/payslips/:id');
  const payslips = Array.isArray(r.data) ? r.data : [];
  if (payslips.length > 0) {
    r = await req('GET', '/api/payroll/payslips/' + payslips[0].id, null, adminToken);
    console.log(r.success ? '   ✅ OK' : '   ❌ Failed: ' + (r.msg || ''));
  } else {
    console.log('   ⚠️ No payslips to check');
  }

  // 6. Approve payroll
  if (payrollId) {
    console.log('6. PUT /api/payroll/:id/approve');
    r = await req('PUT', '/api/payroll/' + payrollId + '/approve', {}, adminToken);
    console.log(r.success ? '   ✅ OK: ' + (r.msg || 'Done') : '   ❌ Failed: ' + (r.msg || ''));
  }

  // 7. Mark as paid
  if (payrollId) {
    console.log('7. PUT /api/payroll/:id/mark-paid');
    r = await req('PUT', '/api/payroll/' + payrollId + '/mark-paid', {}, adminToken);
    console.log(r.success ? '   ✅ OK: ' + (r.msg || 'Done') : '   ❌ Failed: ' + (r.msg || ''));
  }

  // 8. Employee views payslips
  console.log('8. Employee accesses GET /api/payroll/payslips');
  r = await req('GET', '/api/payroll/payslips', null, empToken);
  console.log(r.success ? '   ✅ OK' : '   ❌ Failed: ' + (r.msg || ''));

  // 9. Download PDF (admin)
  if (payslips.length > 0) {
    console.log('9. GET /api/payroll/payslips/:id/pdf');
    r = await req('GET', '/api/payroll/payslips/' + payslips[0].id + '/pdf', null, adminToken);
    console.log(r.success ? '   ✅ OK (PDF downloaded)' : '   ❌ Failed: ' + (r.msg || ''));
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
