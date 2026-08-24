const { Designation, Department, Employee, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = Sequelize;

const getDesignations = asyncHandler(async (req, res) => {
  const { status, departmentId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  const designations = await Designation.findAll({
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Employee, as: 'employees', attributes: ['id'], where: { employmentStatus: 'active' }, required: false }
    ],
    order: [['title', 'ASC']]
  });

  const data = designations.map(d => ({
    ...d.toJSON(),
    employeeCount: d.employees?.length || 0
  }));

  res.json({ success: true, data });
});

const getDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findByPk(req.params.id, {
    include: [{ association: 'department' }, { association: 'employees', where: { employmentStatus: 'active' }, required: false }]
  });
  if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
  res.json({ success: true, data: designation });
});

const createDesignation = asyncHandler(async (req, res) => {
  const { title, code, description, grade, minSalary, maxSalary, departmentId } = req.body;
  const existing = await Designation.findOne({ where: { code } });
  if (existing) return res.status(409).json({ success: false, message: 'Designation code already exists' });

  const designation = await Designation.create({ title, code, description, grade, minSalary, maxSalary, departmentId });
  await ActivityLog.create({ userId: req.user.id, action: 'DESIGNATION_CREATED', resource: 'designation', description: `Created designation ${title}`, severity: 'info' });
  res.status(201).json({ success: true, message: 'Designation created', data: designation });
});

const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findByPk(req.params.id);
  if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
  await designation.update(req.body);
  res.json({ success: true, message: 'Designation updated', data: designation });
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findByPk(req.params.id);
  if (!designation) return res.status(404).json({ success: false, message: 'Designation not found' });
  const count = await Employee.count({ where: { designationId: req.params.id, employmentStatus: 'active' } });
  if (count > 0) return res.status(400).json({ success: false, message: `Cannot delete designation with ${count} active employees` });
  await designation.update({ status: 'inactive' });
  res.json({ success: true, message: 'Designation deactivated' });
});

module.exports = { getDesignations, getDesignation, createDesignation, updateDesignation, deleteDesignation };
