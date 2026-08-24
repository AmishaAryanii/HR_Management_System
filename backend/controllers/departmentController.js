const { Department, Employee, ActivityLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.findAll({
    include: [
      { model: Employee, as: 'employees', attributes: ['id', 'firstName', 'lastName', 'employmentStatus'] },
      { model: Employee, as: 'head', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }
    ],
    order: [['name', 'ASC']]
  });

  const data = departments.map(dept => ({
    ...dept.toJSON(),
    employeeCount: dept.employees?.filter(e => e.employmentStatus === 'active').length || 0
  }));

  res.json({ success: true, data });
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id, {
    include: [
      { model: Employee, as: 'employees', include: [
        { association: 'designation', attributes: ['title'] },
        { association: 'user', attributes: ['email'] }
      ]},
      { model: Employee, as: 'head', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }
    ]
  });

  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  res.json({ success: true, data: department });
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, headOfDepartment } = req.body;

  const existing = await Department.findOne({ where: { [require('sequelize').Op.or]: [{ name }, { code }] } });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Department name or code already exists' });
  }

  const department = await Department.create({ name, code, description, headOfDepartment });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'DEPARTMENT_CREATED',
    resource: 'department',
    description: `Created department ${name}`,
    severity: 'info'
  });

  res.status(201).json({ success: true, message: 'Department created successfully', data: department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  await department.update(req.body);

  await ActivityLog.create({
    userId: req.user.id,
    action: 'DEPARTMENT_UPDATED',
    resource: 'department',
    description: `Updated department ${department.name}`,
    severity: 'info'
  });

  res.json({ success: true, message: 'Department updated successfully', data: department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByPk(req.params.id);
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found' });
  }

  const employeeCount = await Employee.count({ where: { departmentId: req.params.id, employmentStatus: 'active' } });
  if (employeeCount > 0) {
    return res.status(400).json({ success: false, message: `Cannot delete department with ${employeeCount} active employees` });
  }

  await department.update({ status: 'inactive' });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'DEPARTMENT_DELETED',
    resource: 'department',
    description: `Deactivated department ${department.name}`,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Department deactivated successfully' });
});

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
