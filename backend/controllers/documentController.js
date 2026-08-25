const { Document, Employee, ActivityLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

const getDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, employeeId, type, verificationStatus } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (type) where.type = type;
  if (verificationStatus) where.verificationStatus = verificationStatus;

  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.employeeId = emp.id;
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      subIds.push(emp.id); // include manager's own docs
      where.employeeId = { [require('../models').Sequelize.Op.in]: subIds };
    }
  }

  const { count, rows } = await Document.findAndCountAll({
    where,
    include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByPk(req.params.id, { include: [{ association: 'employee' }] });
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
  res.json({ success: true, data: document });
});

const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { title, type, description, employeeId } = req.body;
  let empId = employeeId;

  // Employees can only upload for themselves
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    empId = emp.id;
  } else if (req.user.role === 'manager') {
    // Managers can only upload for their subordinates
    const managerEmp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!managerEmp) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (empId && parseInt(empId) !== managerEmp.id) {
      const target = await Employee.findByPk(parseInt(empId));
      if (!target || target.reportingManagerId !== managerEmp.id) {
        return res.status(403).json({ success: false, message: 'You can only upload documents for your team members' });
      }
    }
  }

  const document = await Document.create({
    employeeId: empId, title, type, description,
    filePath: req.file.path,
    fileName: req.file.filename,
    fileSize: req.file.size,
    mimeType: req.file.mimetype
  });

  res.status(201).json({ success: true, message: 'Document uploaded', data: document });
});

const verifyDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

  const { verificationStatus } = req.body;
  await document.update({ verificationStatus, verifiedBy: req.user.id, verifiedAt: new Date() });

  res.json({ success: true, message: `Document ${verificationStatus}`, data: document });
});

const downloadDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

  const filePath = path.resolve(document.filePath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });

  res.download(filePath, document.fileName);
});

const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByPk(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

  // Delete file from disk
  const filePath = path.resolve(document.filePath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await document.destroy();
  res.json({ success: true, message: 'Document deleted' });
});

module.exports = { getDocuments, getDocument, uploadDocument, verifyDocument, downloadDocument, deleteDocument };
