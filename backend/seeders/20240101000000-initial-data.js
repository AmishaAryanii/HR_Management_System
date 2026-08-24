'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('users', [{
      username: 'superadmin',
      email: 'admin@hrms.com',
      password: hashedPassword,
      role: 'super_admin',
      is_active: true,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create departments
    await queryInterface.bulkInsert('departments', [
      { name: 'Engineering', code: 'ENG', description: 'Software Engineering Department', status: 'active', created_at: new Date(), updated_at: new Date() },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Department', status: 'active', created_at: new Date(), updated_at: new Date() },
      { name: 'Finance', code: 'FIN', description: 'Finance and Accounting', status: 'active', created_at: new Date(), updated_at: new Date() },
      { name: 'Marketing', code: 'MKT', description: 'Marketing Department', status: 'active', created_at: new Date(), updated_at: new Date() },
      { name: 'Sales', code: 'SAL', description: 'Sales Department', status: 'active', created_at: new Date(), updated_at: new Date() },
      { name: 'Operations', code: 'OPS', description: 'Operations Department', status: 'active', created_at: new Date(), updated_at: new Date() }
    ]);

    // Create designations
    await queryInterface.bulkInsert('designations', [
      { title: 'Chief Executive Officer', code: 'CEO', grade: 'EX', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'Chief Technology Officer', code: 'CTO', grade: 'EX', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'HR Manager', code: 'HRM', grade: 'M', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'Senior Developer', code: 'SD', grade: 'L2', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'Junior Developer', code: 'JD', grade: 'L1', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'Finance Officer', code: 'FO', grade: 'M', status: 'active', created_at: new Date(), updated_at: new Date() },
      { title: 'Marketing Executive', code: 'ME', grade: 'L2', status: 'active', created_at: new Date(), updated_at: new Date() }
    ]);

    // Create initial leave balances for the current year
    const currentYear = new Date().getFullYear();
    
    // Create sample employees
    const employees = [
      { employee_id: 'EMP0001', first_name: 'Super', last_name: 'Admin', email: 'admin@hrms.com', joining_date: '2024-01-01', employment_status: 'active', user_id: 1, created_at: new Date(), updated_at: new Date() }
    ];
    await queryInterface.bulkInsert('employees', employees);
    const insertedEmployeeId = 1; // First employee in empty table gets ID 1

    // Leave balances for employees (use integer id, not string employee_id)
    const leaveBalances = [{
      employee_id: insertedEmployeeId,
      year: currentYear,
      casual: 12, sick: 12, earned: 18, maternity: 180, paternity: 15, unpaid: 0,
      total_casual: 12, total_sick: 12, total_earned: 18, total_maternity: 180, total_paternity: 15,
      created_at: new Date(), updated_at: new Date()
    }];
    await queryInterface.bulkInsert('leave_balances', leaveBalances);

    // Create roles
    await queryInterface.bulkInsert('roles', [
      { name: 'Super Admin', slug: 'super_admin', description: 'Full system access', level: 100, is_system: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Admin', slug: 'admin', description: 'Administrative access', level: 80, is_system: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Manager', slug: 'manager', description: 'Team management access', level: 50, is_system: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Employee', slug: 'employee', description: 'Basic employee access', level: 10, is_system: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('leave_balances', null, {});
    await queryInterface.bulkDelete('employees', null, {});
    await queryInterface.bulkDelete('designations', null, {});
    await queryInterface.bulkDelete('departments', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
