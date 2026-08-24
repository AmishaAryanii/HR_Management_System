const jwt = require('jsonwebtoken');
const { User, Employee, ActivityLog } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendEmail, resetEmailTemplate } = require('../services/email');

// Generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h', issuer: process.env.JWT_ISSUER }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: process.env.JWT_ISSUER }
  );
};

// Generate token pair
const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};

/**
 * Portal-to-role mapping: which roles are allowed for each portal
 */
const PORTAL_ROLE_MAP = {
  admin: ['super_admin', 'admin'],
  manager: ['manager'],
  employee: ['employee']
};

/**
 * Get user-friendly role label for error messages
 */
const getRoleLabel = (role) => {
  const labels = {
    super_admin: 'Admins',
    admin: 'Admins',
    manager: 'Managers',
    employee: 'Employees'
  };
  return labels[role] || role;
};

/**
 * Get the correct portal name for a given role
 */
const getCorrectPortal = (role) => {
  const portals = {
    super_admin: 'Admin Portal',
    admin: 'Admin Portal',
    manager: 'Manager Portal',
    employee: 'Employee Portal'
  };
  return portals[role] || 'appropriate portal';
};

/**
 * Validate that the user's role matches the portal they're logging into
 */
const validatePortalAccess = (user, portal) => {
  const allowedRoles = PORTAL_ROLE_MAP[portal];
  if (!allowedRoles) {
    return { allowed: false, message: 'Invalid portal specified.' };
  }

  // Portal matches user role — allow access
  if (allowedRoles.includes(user.role)) {
    return { allowed: true };
  }

  // Portal mismatch — generate clear error message
  const roleLabel = getRoleLabel(user.role);
  const correctPortal = getCorrectPortal(user.role);
  return {
    allowed: false,
    message: `${roleLabel} can only log in through the ${correctPortal}.`
  };
};

/**
 * POST /api/auth/login
 * Login user with portal-based access restriction
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, portal: reqPortal } = req.body;
  const portal = reqPortal || 'employee';

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({
    where: { email },
    include: [{ model: Employee, as: 'employee' }]
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact administrator.' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Enforce portal-based access restriction
  const portalCheck = validatePortalAccess(user, portal);
  if (!portalCheck.allowed) {
    return res.status(403).json({ success: false, message: portalCheck.message });
  }

  const tokens = generateTokens(user);

  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  user.lastLoginIp = req.ip;
  await user.save();

  await ActivityLog.create({
    userId: user.id,
    employeeId: user.employee?.id,
    action: 'LOGIN',
    resource: 'auth',
    description: `User ${user.email} logged in`,
    ipAddress: req.ip,
    severity: 'info'
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      employee: user.employee,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Employee, as: 'employee' }]
    });

    if (!user || !user.isActive || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (user) {
    user.refreshToken = null;
    await user.save();

    await ActivityLog.create({
      userId: user.id,
      action: 'LOGOUT',
      resource: 'auth',
      description: `User ${user.email} logged out`,
      ipAddress: req.ip,
      severity: 'info'
    });
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires'] },
    include: [
      { 
        model: Employee, as: 'employee',
        include: [
          { association: 'department' },
          { association: 'designation' },
          { association: 'manager' }
        ]
      }
    ]
  });

  res.json({ success: true, data: user });
});

/**
 * POST /api/auth/change-password
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findByPk(req.user.id);
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();

  await ActivityLog.create({
    userId: user.id,
    action: 'PASSWORD_CHANGE',
    resource: 'auth',
    description: 'Password changed successfully',
    ipAddress: req.ip,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Password changed successfully. Please login again.' });
});

/**
 * POST /api/auth/forgot-password
 * Send password reset email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide email address' });
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email address' });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET + user.password,
    { expiresIn: '1h' }
  );

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  // Send reset email
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset - HRMS',
    html: resetEmailTemplate(resetUrl)
  });

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.'
  });
});

/**
 * POST /api/auth/reset-password/:token
 * Reset password with token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const user = await User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() }
    }
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshToken = null;
  await user.save();

  await ActivityLog.create({
    userId: user.id,
    action: 'PASSWORD_RESET',
    resource: 'auth',
    description: 'Password reset successfully',
    ipAddress: req.ip,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Password reset successful. Please login with your new password.' });
});

module.exports = {
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword
};
