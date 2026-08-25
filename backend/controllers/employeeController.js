const { Employee, User, Department, Designation, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser } = require('../services/notify');
const { Op } = Sequelize;

/**
 * GET /api/employees
 * Get all employees with pagination, search, and filters
 */
const getEmployees = asyncHandler(async (req, res) => {
  const { 
    page = 1, limit = 10, search, status, departmentId, designationId,
    employmentType, gender, role, sortBy = 'createdAt', sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Managers can only see employees assigned to them
  if (req.user.role === 'manager') {
    const managerEmployee = await Employee.findOne({ where: { userId: req.user.id } });
    if (managerEmployee) {
      where.reportingManagerId = managerEmployee.id;
    } else {
      // Manager has no employee record — return empty
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 }
      });
    }
  }

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { employeeId: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }

  if (status) where.employmentStatus = status;
  if (departmentId) where.departmentId = departmentId;
  if (designationId) where.designationId = designationId;
  if (employmentType) where.employmentType = employmentType;
  if (gender) where.gender = gender;

  // Role filtering: only for admin/super_admin
  const includeUser = { model: User, as: 'user', attributes: ['id', 'username', 'email', 'role', 'isActive'] };
  if (role && ['super_admin', 'admin', 'manager', 'employee'].includes(role)) {
    includeUser.where = { role };
    includeUser.required = true;
  }

  const { count, rows } = await Employee.findAndCountAll({
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
      { model: Designation, as: 'designation', attributes: ['id', 'title', 'code'] },
      { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      includeUser
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  });
});

/**
 * GET /api/employees/lite
 * Get a lightweight list of active employees (id, employeeId, name)
 * Managers only see their team members
 */
const getEmployeesLite = asyncHandler(async (req, res) => {
  const where = { employmentStatus: 'active' };

  // Managers can only see their team members (subordinates only, not themselves)
  if (req.user.role === 'manager') {
    const managerEmployee = await Employee.findOne({ where: { userId: req.user.id } });
    if (managerEmployee) {
      where.reportingManagerId = managerEmployee.id;
    } else {
      return res.json({ success: true, data: [] });
    }
  }

  const employees = await Employee.findAll({
    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'departmentId'],
    where,
    include: [
      { model: Department, as: 'department', attributes: ['name'] },
      { model: Designation, as: 'designation', attributes: ['title'] }
    ],
    order: [['firstName', 'ASC']]
  });

  res.json({ success: true, data: employees });
});

/**
 * GET /api/employees/my-team
 * Get only the team members reporting to the current manager
 */
const getMyTeam = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const team = await Employee.findAll({
    where: { reportingManagerId: emp.id, employmentStatus: 'active' },
    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'designationId', 'departmentId'],
    include: [
      { model: Department, as: 'department', attributes: ['name'] },
      { model: Designation, as: 'designation', attributes: ['title'] }
    ],
    order: [['firstName', 'ASC']]
  });

  // Also include the manager themselves
  const myself = await Employee.findByPk(emp.id, {
    attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'designationId', 'departmentId'],
    include: [
      { model: Department, as: 'department', attributes: ['name'] },
      { model: Designation, as: 'designation', attributes: ['title'] }
    ]
  });

  res.json({ success: true, data: { team, myself } });
});

/**
 * GET /api/employees/:id
 * Get single employee by ID
 */
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByPk(req.params.id, {
    include: [
      { model: Department, as: 'department' },
      { model: Designation, as: 'designation' },
      { model: Employee, as: 'manager', include: [
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Designation, as: 'designation', attributes: ['title'] }
      ]},
      { model: User, as: 'user', attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires'] } },
      { model: Employee, as: 'subordinates', include: [
        { model: Department, as: 'department', attributes: ['name'] },
        { model: Designation, as: 'designation', attributes: ['title'] }
      ]}
    ]
  });

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  res.json({ success: true, data: employee });
});

/**
 * POST /api/employees
 * Create new employee with user account
 */
const createEmployee = asyncHandler(async (req, res) => {
  const { 
    firstName, lastName, email, phone, address, gender, dateOfBirth, joiningDate,
    employmentType, salary, departmentId, designationId, reportingManagerId,
    bankName, bankAccountNo, ifscCode, emergencyContactName, emergencyContactPhone,
    emergencyContactRelation, role = 'employee', password
  } = req.body;

  // Check if email already exists
  const existingEmployee = await Employee.findOne({ where: { email } });
  if (existingEmployee) {
    return res.status(409).json({ success: false, message: 'Employee with this email already exists' });
  }

  // Generate employee ID — find the highest existing number for this dept to avoid collisions
  const dept = await Department.findByPk(departmentId);
  const deptCode = dept ? dept.code : 'XX';
  const prefix = `EMP${deptCode}`;
  const lastEmployee = await Employee.findOne({
    where: { employeeId: { [Op.like]: `${prefix}%` } },
    order: [['id', 'DESC']]
  });
  let nextNum = 1;
  if (lastEmployee) {
    const lastNum = parseInt(lastEmployee.employeeId.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  const employeeId = `${prefix}${String(nextNum).padStart(4, '0')}`;

  // Generate username from email
  const username = email.split('@')[0];

  // Use provided password or default
  const userPassword = password || 'changeme123';

  // Create user account
  const user = await User.create({
    username,
    email,
    password: userPassword,
    role,
    isVerified: !!password // Auto-verify if admin sets a password
  });

  // Create employee record
  const employee = await Employee.create({
    employeeId,
    firstName, lastName, email, phone, address, gender, dateOfBirth, joiningDate,
    employmentType, salary, departmentId, designationId, reportingManagerId,
    bankName, bankAccountNo, ifscCode, emergencyContactName, emergencyContactPhone,
    emergencyContactRelation, userId: user.id,
    profilePhoto: req.file ? '/uploads/profiles/' + req.file.filename : null
  });

  await ActivityLog.create({
    userId: req.user.id,
    employeeId: employee.id,
    action: 'EMPLOYEE_CREATED',
    resource: 'employee',
    description: `Created employee ${firstName} ${lastName} (${employeeId}) with role ${role}`,
    severity: 'info'
  });

  // Notify the new employee about their account creation
  await notifyUser({
    userId: user.id,
    employeeId: employee.id,
    type: 'employee_created',
    title: 'Welcome to HRMS',
    message: `Your employee account has been created. Employee ID: ${employeeId}, Role: ${role}. Please login to complete your profile.`,
    actionUrl: '/dashboard'
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: employee
  });
});

/**
 * PUT /api/employees/:id
 * Update employee
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const updateData = { ...req.body };
  if (req.file) updateData.profilePhoto = '/uploads/profiles/' + req.file.filename;

  await employee.update(updateData);

  await ActivityLog.create({
    userId: req.user.id,
    employeeId: employee.id,
    action: 'EMPLOYEE_UPDATED',
    resource: 'employee',
    description: `Updated employee ${employee.firstName} ${employee.lastName}`,
    severity: 'info'
  });

  res.json({
    success: true,
    message: 'Employee updated successfully',
    data: employee
  });
});

/**
 * PUT /api/employees/:id/role
 * Update employee's user role (promote/demote)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['super_admin', 'admin', 'manager', 'employee'];

  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be one of: ' + validRoles.join(', ')
    });
  }

  // Only super_admin can create/assign super_admin role
  if (role === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only super admins can assign super admin role'
    });
  }

  const employee = await Employee.findByPk(req.params.id, {
    include: [{ model: User, as: 'user' }]
  });

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  if (!employee.user) {
    return res.status(400).json({ success: false, message: 'Employee has no user account' });
  }

  const oldRole = employee.user.role;
  employee.user.role = role;
  // Prevent self-demotion
  if (employee.user.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "You cannot change your own role. Ask another admin to do it."
    });
  }
  await employee.user.save();

  await ActivityLog.create({
    userId: req.user.id,
    employeeId: employee.id,
    action: 'ROLE_CHANGED',
    resource: 'employee',
    description: `Changed role for ${employee.firstName} ${employee.lastName} from ${oldRole} to ${role}`,
    severity: 'warning'
  });

  // Notify the employee about their role change
  await notifyUser({
    userId: employee.user.id,
    employeeId: employee.id,
    type: 'role_changed',
    title: 'Role Updated',
    message: `Your role has been changed from ${oldRole} to ${role} by ${req.user.username || 'an administrator'}.`
  });

  res.json({
    success: true,
    message: `Role updated from ${oldRole} to ${role}`,
    data: {
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      oldRole,
      newRole: role
    }
  });
});

/**
 * DELETE /api/employees/:id
 * Delete employee (soft - deactivate)
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByPk(req.params.id, {
    include: [{ model: User, as: 'user' }]
  });

  if (!employee) {
 
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  // Soft delete - deactivate user and employee
  if (employee.user) {
    await employee.user.update({ isActive: false });
  }
  await employee.update({ employmentStatus: 'terminated' });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'EMPLOYEE_DELETED',
    resource: 'employee',
    description: `Deactivated employee ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
    severity: 'warning'
  });

  res.json({
    success: true,
    message: 'Employee deactivated successfully'
  });
});

/**
 * GET /api/employees/stats
 * Get employee statistics
 */
const getEmployeeStats = asyncHandler(async (req, res) => {
  const total = await Employee.count();
  const active = await Employee.count({ where: { employmentStatus: 'active' } });
  const byDepartment = await Employee.findAll({
    attributes: [
      'departmentId',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    where: { employmentStatus: 'active' },
    include: [{ model: Department, as: 'department', attributes: ['name'] }],
    group: ['departmentId', 'department.id', 'department.name']
  });
  const byGender = await Employee.findAll({
    attributes: ['gender', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    group: ['gender']
  });
  const byStatus = await Employee.findAll({
    attributes: ['employmentStatus', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    group: ['employmentStatus']
  });

  res.json({
    success: true,
    data: { total, active, byDepartment, byGender, byStatus }
  });
});

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const photoUrl = '/uploads/profiles/' + req.file.filename;
  await emp.update({ profilePhoto: photoUrl });
  res.json({ success: true, message: 'Profile photo updated', data: { profilePhoto: photoUrl } });
});

/**
 * PUT /api/employees/profile
 * Allow any authenticated user to update their own basic info (phone, address)
 */
const updateSelf = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const { phone, address } = req.body;
  const updateData = {};
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;

  await emp.update(updateData);
  res.json({ success: true, message: 'Profile updated successfully', data: emp });
});

module.exports = {
  getEmployees,
  getEmployeesLite,
  getMyTeam,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  updateUserRole,
  uploadProfilePhoto,
  updateSelf
};
