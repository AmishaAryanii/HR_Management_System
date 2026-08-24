const { Payroll, Payslip, Employee, Attendance, ActivityLog, Sequelize, Company, User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { notifyUser } = require('../services/notify');
const { sendEmail } = require('../services/email');

const { Op } = Sequelize;

const getPayrolls = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, month, year, status, employeeId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;
  const { rows, count } = await Payroll.findAndCountAll({
    where,
    include: [{ model: Employee, as: 'employee', include: [{ association: 'department' }, { association: 'designation' }] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
});

const processPayroll = asyncHandler(async (req, res) => {
  const { employeeId, month, year, basicSalary, hra, bonus, pfDeduction, taxDeduction, startDate, endDate } = req.body;
  const employee = await Employee.findByPk(employeeId);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  // Get the processor's info for audit trail
  const processorEmp = await Employee.findOne({ where: { userId: req.user.id } });
  const processorName = processorEmp ? `${processorEmp.firstName} ${processorEmp.lastName}` : req.user.username;
  const processorRole = req.user.role;

  // Support flexible date ranges (full month or custom partial range)
  const useCustomRange = !!(startDate && endDate);
  const effectiveStartDate = startDate || `${year}-${String(month).padStart(2, '0')}-01`;
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const effectiveEndDate = endDate || `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

  // Check for existing payroll - for custom ranges, check by date range
  if (!useCustomRange) {
    const existing = await Payroll.findOne({ where: { employeeId, month, year } });
    if (existing) return res.status(400).json({ success: false, message: 'Payroll already processed for this employee for the given period' });
  }

  // ── Calculate pay with pro-ration for partial months ──
  const bSalary = parseFloat(basicSalary) || 0;
  const hraAmt = parseFloat(hra) || 0;
  const bonusAmt = parseFloat(bonus) || 0;
  const pfAmt = parseFloat(pfDeduction) || 0;
  const taxAmt = parseFloat(taxDeduction) || 0;

  // Calculate working days using actual attendance data
  const start = new Date(effectiveStartDate);
  const end = new Date(effectiveEndDate);
  const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Count Sundays in the range
  let sundaysInRange = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) sundaysInRange++;
  }
  const workingDaysInRange = rangeDays - sundaysInRange;

  // Count total working days in the full month (accurate)
  let totalSundays = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0) totalSundays++;
  }
  const totalWorkingDays = totalDaysInMonth - totalSundays;

  // Fetch attendance records for the period to calculate actual paid days
  const attendanceRecords = await Attendance.findAll({
    where: { employeeId, date: { [Op.between]: [effectiveStartDate, effectiveEndDate] } }
  });
  const presentDays = attendanceRecords.filter(r => ['present', 'late'].includes(r.status)).length;
  const halfDayCount = attendanceRecords.filter(r => r.status === 'half_day').length;
  const leaveDays = attendanceRecords.filter(r => r.status === 'on_leave').length;
  const paidDays = presentDays + (halfDayCount * 0.5) + leaveDays;
  const lopDays = Math.max(0, workingDaysInRange - Math.ceil(paidDays));

  // Pro-rate based on actual paid days vs working days in the range
  const effectiveWorkingDays = useCustomRange ? workingDaysInRange : totalWorkingDays;
  const effectivePaidDays = useCustomRange ? Math.max(Math.ceil(paidDays), 1) : effectiveWorkingDays;
  const dailyRate = effectiveWorkingDays > 0 ? bSalary / effectiveWorkingDays : 0;
  const lopAmount = lopDays * dailyRate;
  const prorationFactor = effectivePaidDays / Math.max(effectiveWorkingDays, 1);  const proratedBasic = Math.round(bSalary * prorationFactor * 100) / 100;
  const proratedHra = Math.round(hraAmt * prorationFactor * 100) / 100;
  const proratedBonus = Math.round(bonusAmt * prorationFactor * 100) / 100;
  const proratedPf = Math.round(pfAmt * prorationFactor * 100) / 100;
  const proratedTax = Math.round(taxAmt * prorationFactor * 100) / 100;

  const allowances = { basicSalary: proratedBasic, hra: proratedHra, bonus: proratedBonus };
  const deductions = { pf: proratedPf, tds: proratedTax };
  const grossPay = proratedBasic + proratedHra + proratedBonus;
  const totalDeductions = proratedPf + proratedTax;
  const netPay = grossPay - totalDeductions;

  const payroll = await Payroll.create({
    employeeId, month: parseInt(month), year: parseInt(year),
    basicSalary: proratedBasic, hra: proratedHra, bonus: proratedBonus,
    pfDeduction: proratedPf, taxDeduction: proratedTax,
    allowances, deductions,
    grossPay, totalDeductions, netPay, status: 'generated',
    processedBy: req.user.id,
    processedByName: processorName,
    processedByRole: processorRole,
    processedAt: new Date()
  });
  await Payslip.create({
    employeeId, payrollId: payroll.id, month: parseInt(month), year: parseInt(year),
    startDate: useCustomRange ? effectiveStartDate : null,
    endDate: useCustomRange ? effectiveEndDate : null,
    workingDays: workingDaysInRange,
    paidDays: Math.ceil(paidDays),
    lopDays,
    basicSalary: proratedBasic, allowances, deductions,
    grossPay, totalDeductions, netPay,
    dailyRate,
    payslipNumber: 'PSL-' + Date.now()
  });

  await ActivityLog.create({
    userId: req.user.id, action: 'Process Payroll', resource: 'payroll',
    resourceId: payroll.id,
    description: 'Payroll processed for ' + employee.firstName + ' ' + employee.lastName
  });

  // Notify employee via in-app + email
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const periodLabel = monthNames[parseInt(month) - 1] + ' ' + year;
  const periodDesc = useCustomRange
    ? `${effectiveStartDate} to ${effectiveEndDate}`
    : periodLabel;
  await notifyUser({
    userId: employee.userId,
    employeeId: employee.id,
    type: 'payslip_generated',
    title: 'Payslip Generated',
    message: `Your payslip for ${periodDesc} has been generated. Net Pay: ₹${parseFloat(netPay).toLocaleString('en-IN', {minimumFractionDigits:2})}`,
    actionUrl: '/payroll'
  });

  res.status(201).json({ success: true, data: payroll, message: 'Payroll processed successfully' });
});

const getPayslips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, month, year } = req.query;
  const offset = (page - 1) * limit;
  let where = {};
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.employeeId = emp.id;
  }
  const { rows, count } = await Payslip.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'employee', include: [{ association: 'department' }, { association: 'designation' }] },
      { model: Payroll, as: 'payroll' }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
});

const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findByPk(req.params.id, {
    include: [
      { model: Employee, as: 'employee', include: [{ association: 'department' }, { association: 'designation' }] },
      { model: Payroll, as: 'payroll' }
    ]
  });
  if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || payslip.employeeId !== emp.id) return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, data: payslip });
});

/**
 * PUT /api/payroll/:id/approve
 * Approve a generated payroll (approval step after generation)
 */
const approvePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
  if (payroll.status !== 'generated') {
    return res.status(400).json({ success: false, message: `Payroll status is '${payroll.status}'. Only 'generated' payrolls can be approved.` });
  }

  const approverEmp = await Employee.findOne({ where: { userId: req.user.id } });
  const approverName = approverEmp ? `${approverEmp.firstName} ${approverEmp.lastName}` : req.user.username;

  await payroll.update({
    status: 'approved',
    approvedBy: req.user.id,
    approvedByName: approverName,
    approvedByRole: req.user.role,
    approvedAt: new Date()
  });

  const employee = await Employee.findByPk(payroll.employeeId);
  if (employee) {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    await notifyUser({
      userId: employee.userId,
      employeeId: employee.id,
      type: 'payroll_approved',
      title: 'Payroll Approved',
      message: `Your salary for ${monthNames[payroll.month - 1] || payroll.month}/${payroll.year} has been approved by ${approverName}.`,
      actionUrl: '/payroll',
      responsibleUser: approverName,
      responsibleRole: req.user.role
    });
  }

  await ActivityLog.create({
    userId: req.user.id, action: 'Approve Payroll',
    resource: 'payroll', resourceId: payroll.id,
    description: `Payroll #${payroll.id} approved by ${approverName}`
  });

  res.json({ success: true, data: payroll, message: 'Payroll approved successfully' });
});

/**
 * PUT /api/payroll/:id/mark-paid
 * Mark an approved payroll as paid
 */
const markPaid = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
  if (payroll.status !== 'approved') {
    return res.status(400).json({ success: false, message: `Payroll status is '${payroll.status}'. Only 'approved' payrolls can be marked paid.` });
  }

  const payerEmp = await Employee.findOne({ where: { userId: req.user.id } });
  const payerName = payerEmp ? `${payerEmp.firstName} ${payerEmp.lastName}` : req.user.username;

  await payroll.update({
    status: 'paid',
    paidBy: req.user.id,
    paidByName: payerName,
    paidByRole: req.user.role,
    paidAt: new Date()
  });

  const employee = await Employee.findByPk(payroll.employeeId);
  if (employee) {
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    await notifyUser({
      userId: employee.userId,
      employeeId: employee.id,
      type: 'payroll_paid',
      title: 'Payment Completed',
      message: `Your salary for ${monthNames[payroll.month - 1] || payroll.month}/${payroll.year} has been paid by ${payerName}.`,
      actionUrl: '/payroll',
      responsibleUser: payerName,
      responsibleRole: req.user.role
    });
  }

  await ActivityLog.create({
    userId: req.user.id, action: 'Mark Paid',
    resource: 'payroll', resourceId: payroll.id,
    description: `Payroll #${payroll.id} marked as paid by ${payerName}`
  });

  res.json({ success: true, data: payroll, message: 'Payroll marked as paid successfully' });
});

const downloadPayslipPDF = asyncHandler(async (req, res) => {
  const payslip = await Payslip.findByPk(req.params.id, {
    include: [
      { model: Employee, as: 'employee', include: [{ association: 'department' }, { association: 'designation' }] },
      { model: Payroll, as: 'payroll' }
    ]
  });
  if (!payslip) return res.status(404).json({ success: false, message: 'Payslip not found' });
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || payslip.employeeId !== emp.id) return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const emp = payslip.employee;
  const payroll = payslip.payroll || {};
  const allowances = payslip.allowances || {};
  const deductions = payslip.deductions || {};
  const company = await Company.findOne({ order: [['id', 'ASC']] });

  const companyName = company?.companyName || 'HRMS';
  const companyAddress = company?.address || '';
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const { month, year } = payslip;
  const periodLabel = monthNames[month - 1] + ' ' + year;

  // ── Use stored payslip values (calculated at generation time) ──
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  let sundays = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0) sundays++;
  }
  const monthWorkingDays = totalDaysInMonth - sundays;

  // Use stored payslip values for all financial calculations
  const workingDays = payslip.workingDays || monthWorkingDays;
  const paidDays = parseFloat(payslip.paidDays) || 0;
  const lopDays = payslip.lopDays || 0;
  const dailyRate = parseFloat(payslip.dailyRate) || 0;
  const lopAmount = lopDays * dailyRate;

  // Attendance detail counts (display only, fetched with correct date range)
  const attStartDate = payslip.startDate || `${year}-${String(month).padStart(2, '0')}-01`;
  const attEndDate = payslip.endDate || `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;
  const attendanceRecords = await Attendance.findAll({
    where: { employeeId: payslip.employeeId, date: { [Op.between]: [attStartDate, attEndDate] } }
  });

  const presentDays = attendanceRecords.filter(r => ['present', 'late'].includes(r.status)).length;
  const halfDayCount = attendanceRecords.filter(r => r.status === 'half_day').length;
  const leaveDays = attendanceRecords.filter(r => r.status === 'on_leave').length;
  const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;

  const fullBasic = parseFloat(payslip.basicSalary || allowances.basicSalary || 0);

  // ── PDF Generation (buffer mode for download + email) ──
  const pdfBuffer = await new Promise((resolvePromise, rejectPromise) => {
    const pdfChunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', chunk => pdfChunks.push(chunk));
    doc.on('end', () => resolvePromise(Buffer.concat(pdfChunks)));
    doc.on('error', (err) => { console.error('PDF generation error:', err); rejectPromise(err); });

  // ── Colour palette: White / Blue-600 / Black (Debox Technology theme) ──
  // NOTE: pdfkit does not reliably support 8-digit alpha hex (e.g. '#2563eb15'),
  // which was causing the wrong (yellow-ish) tint to render. Using solid,
  // pre-mixed light-blue swatches instead fixes that.
  const headerBg = '#2563eb';       // blue-600 — main header + net pay band
  const sectionBg = '#1d4ed8';      // blue-700 — section title bars
  const accentColor = '#2563eb';    // blue-600 — text/number accents
  const darkColor = '#000000';      // black — primary text
  const textMuted = '#6b7280';      // gray-500 — secondary/meta text
  const lightBg = '#f8fafc';        // near-white — alternating row background
  const borderColor = '#e5e7eb';    // light gray — table borders
  const headerTextMuted = '#bfdbfe';// blue-200 — muted text on blue header
  const blueTintSoft = '#eff6ff';   // blue-50 — light highlight fill
  const blueTintStrong = '#dbeafe'; // blue-100 — stronger highlight fill (totals)

  // Page content box: x from 50 to 545 (width 495)
  const pageLeft = 50;
  const pageRight = 545;
  const pageWidth = 495;

  // ── Helper: format INR ──
  const fmtINR = (val) => {
    const num = parseFloat(val || 0);
    const parts = num.toFixed(2).split('.');
    let intPart = parts[0];
    const lastThree = intPart.substring(intPart.length - 3);
    const rest = intPart.substring(0, intPart.length - 3);
    if (rest) intPart = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    else intPart = lastThree;
    return 'INR ' + intPart + '.' + parts[1];
  };

  // ═══════════════ HEADER ═══════════════
  if (company?.logo) {
    const logoPath = path.join(__dirname, '..', company.logo);
    const ext = path.extname(company.logo).toLowerCase();
    if (['.png', '.jpg', '.jpeg'].includes(ext) && fs.existsSync(logoPath)) {
      try { doc.image(logoPath, 55, 33, { width: 46, height: 46, fit: [46, 46] }); } catch (e) { /* skip */ }
    }
  }

  // Blue-600 header bar
  doc.rect(pageLeft, 40, pageWidth, 64).fill(headerBg);

  const nameX = company?.logo ? 112 : 58;
  const nameBlockWidth = 260; // reserved space before the right-side "SALARY SLIP" box

  doc.fill('#ffffff').fontSize(18).font('Helvetica-Bold')
    .text(companyName, nameX, 50, { width: nameBlockWidth, ellipsis: true });
  doc.fontSize(8).font('Helvetica').fill(headerTextMuted)
    .text(companyAddress || company?.email || '', nameX, 74, { width: nameBlockWidth, height: 24, ellipsis: true });

  // Right-side "SALARY SLIP" + period box (x: 370 to 535, padded inside header)
  const rightBoxX = 370;
  const rightBoxWidth = pageRight - rightBoxX - 10; // = 165
  doc.fontSize(12).font('Helvetica-Bold').fill('#ffffff')
    .text('SALARY SLIP', rightBoxX, 50, { width: rightBoxWidth, align: 'right' });
  doc.fontSize(7).font('Helvetica').fill(headerTextMuted)
    .text('Period', rightBoxX, 70, { width: rightBoxWidth, align: 'right' });
  doc.fontSize(10).font('Helvetica-Bold').fill('#ffffff')
    .text(periodLabel, rightBoxX, 81, { width: rightBoxWidth, align: 'right' });

  // Black accent line below header
  doc.rect(pageLeft, 104, pageWidth, 3).fill(darkColor);

  // ═══════════════ PAYSLIP META ═══════════════
  let cy = 117;
  doc.rect(pageLeft, cy, pageWidth, 20).fill(lightBg);
  doc.fill(textMuted).fontSize(7.5).font('Helvetica');
  doc.text('Payslip #: ' + (payslip.payslipNumber || 'N/A'), pageLeft + 8, cy + 6, { width: 240 });
  doc.text('Generated: ' + new Date().toLocaleDateString('en-IN'), pageLeft + 260, cy + 6, { width: 225, align: 'right' });
  doc.rect(pageLeft, cy, pageWidth, 20).stroke(borderColor).lineWidth(0.5);
  cy += 32;

  // ═══════════════ EMPLOYEE INFO ═══════════════
  doc.rect(pageLeft, cy, pageWidth, 24).fill(sectionBg);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text('EMPLOYEE INFORMATION', pageLeft + 8, cy + 8);
  cy += 30;

  const leftX = pageLeft + 6, rightX = pageLeft + 246, colW = 234, rowH = 22;
  const fields = [
    { label: 'Employee ID', value: emp?.employeeId || 'N/A' },
    { label: 'Employee Name', value: ((emp?.firstName || '') + ' ' + (emp?.lastName || '')).trim() || 'N/A' },
    { label: 'Department', value: emp?.department?.name || 'N/A' },
    { label: 'Designation', value: emp?.designation?.title || 'N/A' },
    { label: 'Date of Joining', value: emp?.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : 'N/A' },
    { label: 'PAN / UAN', value: emp?.panNumber || '-' },
  ];

  fields.forEach((f, i) => {
    const x = i < 3 ? leftX : rightX;
    const y = cy + (i % 3) * rowH;
    doc.rect(x - 6, y - 2, colW, rowH - 2).fill(i % 2 === 0 ? '#ffffff' : lightBg);
    doc.fill(textMuted).fontSize(7.5).font('Helvetica').text(f.label, x, y + 1, { width: colW - 12 });
    doc.fill(darkColor).fontSize(9).font('Helvetica-Bold')
      .text(f.value, x, y + 11, { width: colW - 12, align: 'right', ellipsis: true });
    doc.rect(x - 6, y - 2, colW, rowH - 2).stroke(borderColor).lineWidth(0.3);
  });
  cy += 3 * rowH + 10;

  // ═══════════════ ATTENDANCE SUMMARY ═══════════════
  doc.rect(pageLeft, cy, pageWidth, 24).fill(sectionBg);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text('ATTENDANCE SUMMARY', pageLeft + 8, cy + 8);
  cy += 30;

  const attData = [
    { label: 'Working Days', value: workingDays },
    { label: 'Present', value: presentDays },
    { label: 'Half Days', value: halfDayCount },
    { label: 'On Leave', value: leaveDays },
    { label: 'Absent', value: absentDays },
    { label: 'Paid Days', value: Math.ceil(paidDays) },
    { label: 'LOP Days', value: lopDays },
  ];

  const attGap = 4;
  const attBoxW = (pageWidth - attGap * (attData.length - 1)) / attData.length;
  const attBoxH = 56;
  attData.forEach((item, i) => {
    const x = pageLeft + i * (attBoxW + attGap);
    doc.rect(x, cy, attBoxW, attBoxH).fill(blueTintSoft);
    doc.rect(x, cy, attBoxW, attBoxH).stroke(borderColor).lineWidth(0.3);
    doc.fill(darkColor).fontSize(6.8).font('Helvetica')
      .text(item.label, x + 3, cy + 8, { width: attBoxW - 6, align: 'center' });
    doc.fill(accentColor).fontSize(13).font('Helvetica-Bold')
      .text(String(item.value), x + 3, cy + 28, { width: attBoxW - 6, align: 'center' });
  });
  cy += attBoxH + 12;

  // ═══════════════ EARNINGS ═══════════════
  doc.rect(pageLeft, cy, pageWidth, 24).fill(sectionBg);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text('EARNINGS', pageLeft + 8, cy + 8);
  cy += 30;

  // Column layout: description col (0-350), amount col (350-495)
  const descColX = pageLeft;
  const descColW = 350;
  const amtColX = pageLeft + 350;
  const amtColW = pageWidth - 350;

  // Table header
  doc.rect(descColX, cy, descColW, 20).fill(blueTintSoft);
  doc.rect(amtColX, cy, amtColW, 20).fill(blueTintSoft);
  doc.fill(darkColor).fontSize(7.5).font('Helvetica-Bold');
  doc.text('Description', descColX + 8, cy + 6, { width: descColW - 16 });
  doc.text('Amount (INR)', amtColX + 8, cy + 6, { width: amtColW - 16, align: 'right' });
  doc.rect(pageLeft, cy, pageWidth, 20).stroke(borderColor).lineWidth(0.3);
  cy += 22;

  const earnItems = [
    { label: 'Basic Salary', value: fullBasic },
    { label: 'HRA (House Rent Allowance)', value: parseFloat(allowances.hra || 0) },
    { label: 'Dearness Allowance (DA)', value: parseFloat(allowances.da || 0) },
    { label: 'Travel Allowance (TA)', value: parseFloat(allowances.ta || 0) },
    { label: 'Special Allowance', value: parseFloat(allowances.specialAllowance || 0) },
    { label: 'Medical Allowance', value: parseFloat(allowances.medicalAllowance || 0) },
    { label: 'Phone Allowance', value: parseFloat(allowances.phoneAllowance || 0) },
    { label: 'Bonus', value: parseFloat(allowances.bonus || 0) },
    { label: 'Overtime Pay', value: parseFloat(allowances.overtimePay || 0) },
  ];

  let ri = 0;
  // Use stored payslip grossPay value (calculated at generation time)
  const computedGross = parseFloat(payslip.grossPay || 0);
  earnItems.forEach(item => {
    if (item.value > 0 || item.label === 'Basic Salary') {
      const rowBg = ri % 2 === 0 ? '#ffffff' : lightBg;
      doc.rect(descColX, cy, descColW, 22).fill(rowBg);
      doc.rect(amtColX, cy, amtColW, 22).fill(rowBg);
      doc.fill(darkColor).fontSize(8).font('Helvetica');
      doc.text(item.label, descColX + 8, cy + 7, { width: descColW - 16, ellipsis: true });
      doc.text(fmtINR(item.value), amtColX + 8, cy + 7, { width: amtColW - 16, align: 'right' });
      doc.rect(pageLeft, cy, pageWidth, 22).stroke(borderColor).lineWidth(0.3);
      cy += 22;
      ri++;
    }
  });

  // LOP deduction row
  if (lopAmount > 0) {
    doc.rect(descColX, cy, descColW, 22).fill(lightBg);
    doc.rect(amtColX, cy, amtColW, 22).fill(lightBg);
    doc.fill(darkColor).fontSize(8).font('Helvetica');
    doc.text('Loss of Pay (' + lopDays + ' day' + (lopDays > 1 ? 's' : '') + ')', descColX + 8, cy + 7, { width: descColW - 16, ellipsis: true });
    doc.text('-' + fmtINR(lopAmount), amtColX + 8, cy + 7, { width: amtColW - 16, align: 'right' });
    doc.rect(pageLeft, cy, pageWidth, 22).stroke(borderColor).lineWidth(0.3);
    cy += 22;
    ri++;

    // Pro-ration note using stored payslip values
    doc.fill(textMuted).fontSize(6.5).font('Helvetica');
    doc.text('Pro-rated: ' + fmtINR(dailyRate) + '/day × ' + Math.ceil(paidDays) + '/' + workingDays + ' working days', descColX + 8, cy + 3, { width: pageWidth - 16 });
    cy += 16;
  }

  // Gross Pay row (displayed from stored value)
  doc.rect(descColX, cy, descColW, 24).fill(blueTintStrong);
  doc.rect(amtColX, cy, amtColW, 24).fill(blueTintStrong);
  doc.fill(darkColor).fontSize(9).font('Helvetica-Bold');
  doc.text('GROSS PAY', descColX + 8, cy + 8, { width: descColW - 16 });
  doc.text(fmtINR(computedGross), amtColX + 8, cy + 8, { width: amtColW - 16, align: 'right' });
  cy += 34;

  // ═══════════════ DEDUCTIONS ═══════════════
  doc.rect(pageLeft, cy, pageWidth, 24).fill(sectionBg);
  doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS', pageLeft + 8, cy + 8);
  cy += 30;

  // Table header
  doc.rect(descColX, cy, descColW, 20).fill(lightBg);
  doc.rect(amtColX, cy, amtColW, 20).fill(lightBg);
  doc.fill(darkColor).fontSize(7.5).font('Helvetica-Bold');
  doc.text('Description', descColX + 8, cy + 6, { width: descColW - 16 });
  doc.text('Amount (INR)', amtColX + 8, cy + 6, { width: amtColW - 16, align: 'right' });
  doc.rect(pageLeft, cy, pageWidth, 20).stroke(borderColor).lineWidth(0.3);
  cy += 22;

  const dedItems = [
    { label: 'Provident Fund (PF)', value: parseFloat(deductions.pf || payroll.pfDeduction || 0) },
    { label: 'Income Tax (TDS)', value: parseFloat(deductions.tds || payroll.taxDeduction || 0) },
    { label: 'Professional Tax', value: parseFloat(deductions.professionalTax || 0) },
    { label: 'Insurance Premium', value: parseFloat(deductions.insurance || 0) },
    { label: 'Loan Repayment', value: parseFloat(deductions.loan || 0) },
    { label: 'Other Deductions', value: parseFloat(deductions.other || 0) },
  ];

  let rd = 0;
  const computedTotalDeductions = parseFloat(payslip.totalDeductions || 0);
  dedItems.forEach(item => {
    if (item.value > 0) {
      const rowBg = rd % 2 === 0 ? '#ffffff' : lightBg;
      doc.rect(descColX, cy, descColW, 22).fill(rowBg);
      doc.rect(amtColX, cy, amtColW, 22).fill(rowBg);
      doc.fill(darkColor).fontSize(8).font('Helvetica');
      doc.text(item.label, descColX + 8, cy + 7, { width: descColW - 16, ellipsis: true });
      doc.text(fmtINR(item.value), amtColX + 8, cy + 7, { width: amtColW - 16, align: 'right' });
      doc.rect(pageLeft, cy, pageWidth, 22).stroke(borderColor).lineWidth(0.3);
      cy += 22;
      rd++;
    }
  });

  if (rd === 0) {
    doc.fill(textMuted).fontSize(8).font('Helvetica');
    doc.text('No deductions for this period', descColX + 8, cy + 7, { width: pageWidth - 16 });
    cy += 22;
  }

  // Total Deductions
  doc.rect(descColX, cy, descColW, 24).fill(lightBg);
  doc.rect(amtColX, cy, amtColW, 24).fill(lightBg);
  doc.fill(darkColor).fontSize(9).font('Helvetica-Bold');
  doc.text('TOTAL DEDUCTIONS', descColX + 8, cy + 8, { width: descColW - 16 });
  doc.text(fmtINR(computedTotalDeductions), amtColX + 8, cy + 8, { width: amtColW - 16, align: 'right' });
  cy += 36;

  // ═══════════════ NET PAY ═══════════════
  const computedNetPay = parseFloat(payslip.netPay || 0);
  const netPayBoxH = 64;

  doc.rect(pageLeft, cy, pageWidth, netPayBoxH).fill(headerBg);
  doc.fill('#ffffff').fontSize(12).font('Helvetica-Bold')
    .text('NET PAYABLE', pageLeft + 14, cy + 12, { width: 280 });
  doc.fontSize(7.5).font('Helvetica').fill(headerTextMuted)
    .text('Amount in words:', pageLeft + 14, cy + 32, { width: 280 });
  doc.fill('#ffffff').fontSize(7.5).font('Helvetica')
    .text(numberToWords(computedNetPay) + ' only', pageLeft + 14, cy + 43, { width: 280, height: 18, ellipsis: true });
  doc.fill('#ffffff').fontSize(17).font('Helvetica-Bold')
    .text(fmtINR(computedNetPay), pageLeft + 300, cy + 20, { width: pageWidth - 300 - 14, align: 'right' });
  cy += netPayBoxH + 12;

  // ═══════════════ FOOTER ═══════════════
  doc.rect(pageLeft, cy, pageWidth, 38).fill(lightBg);
  doc.fill(textMuted).fontSize(7).font('Helvetica');
  doc.text('This is a computer-generated salary slip. No signature is required.', pageLeft + 8, cy + 6, { align: 'center', width: pageWidth - 16 });
  doc.text('Generated on: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), pageLeft + 8, cy + 18, { align: 'center', width: pageWidth - 16 });
  doc.text('HRMS Portal', pageLeft + 8, cy + 28, { align: 'center', width: pageWidth - 16 });

  doc.end();
  });

  // Send the PDF as a download response
  const filename = 'payslip-' + (payslip.payslipNumber || 'payslip') + '.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
  res.send(pdfBuffer);

  // Send the payslip PDF via email to the employee (fire & forget in catch, but await inside try)
  try {
    const user = await User.findByPk(emp.userId);
    if (user && user.email) {
      const netPayVal = (payslip.netPay || 0);
      const emailHtml = `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Your Payslip</h1>
          </div>
          <div style="padding: 24px; background: #fff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #000000; font-size: 14px; line-height: 1.6;">Dear <strong>${emp?.firstName || ''} ${emp?.lastName || ''}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your payslip for <strong>${periodLabel}</strong> is attached to this email.</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Net Pay: <strong style="color: #2563eb;">₹${parseFloat(netPayVal).toLocaleString('en-IN', {minimumFractionDigits:2})}</strong></p>
            <p style="color: #64748b; font-size: 13px; margin-top: 16px;">You can also download your payslip from the HRMS portal anytime.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated email from the HRMS system.</p>
          </div>
        </div>
      `;
      await sendEmail({
        to: user.email,
        subject: 'Your Payslip - ' + periodLabel,
        html: emailHtml,
        attachments: [{ filename, content: pdfBuffer }]
      });
    }
  } catch (emailErr) {
    console.error('Failed to send payslip email:', emailErr.message);
  }
});

/**
 * Convert a number to Indian-format words (e.g. 125430 -> One Lakh Twenty-Five Thousand Four Hundred Thirty)
 */
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const absNum = Math.round(Math.abs(num));
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBelow1000 = (n) => {
    if (n === 0) return '';
    let res = '';
    if (n >= 100) { res += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { res += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    if (n > 0) { res += ones[n] + ' '; }
    return res.trim();
  };

  let result = '';
  let n = absNum;

  const crores = Math.floor(n / 10000000);
  if (crores > 0) { result += convertBelow1000(crores) + ' Crore '; n %= 10000000; }

  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) { result += convertBelow1000(lakhs) + ' Lakh '; n %= 100000; }

  const thousands = Math.floor(n / 1000);
  if (thousands > 0) { result += convertBelow1000(thousands) + ' Thousand '; n %= 1000; }

  if (n > 0) { result += convertBelow1000(n); }

  return result.trim() + ' Rupees';
}

module.exports = { getPayrolls, processPayroll, getPayslips, getPayslip, approvePayroll, markPaid, downloadPayslipPDF };