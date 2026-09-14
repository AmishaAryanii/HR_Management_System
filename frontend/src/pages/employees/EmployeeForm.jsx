import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { employeeAPI, departmentAPI, designationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck } from 'react-icons/hi';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', gender: '',
    dateOfBirth: '', joiningDate: '', employmentType: 'full_time', salary: '',
    departmentId: '', designationId: '', reportingManagerId: '',
    bankName: '', bankAccountNo: '', ifscCode: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    password: '', role: 'employee'
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deptRes, desigRes, allEmpRes] = await Promise.all([
          departmentAPI.getAll(),
          designationAPI.getAll(),
          employeeAPI.getAll({ limit: 100 })
        ]);
        setDepartments(deptRes.data.data || deptRes.data);
        setDesignations(desigRes.data.data || desigRes.data);

        const allEmployees = allEmpRes.data.data || [];
        const managerList = allEmployees.filter(
          (e) => e.user?.role === 'manager' || e.user?.role === 'admin'
        );
        setManagers(managerList);

        if (isEdit) {
          const empRes = await employeeAPI.getById(id);
          const emp = empRes.data.data;
          setForm({
            firstName: emp.firstName || '', lastName: emp.lastName || '', email: emp.email || '',
            phone: emp.phone || '', address: emp.address || '', gender: emp.gender || '',
            dateOfBirth: emp.dateOfBirth || '', joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
            employmentType: emp.employmentType || 'full_time', salary: emp.salary || '',
            departmentId: emp.departmentId || '', designationId: emp.designationId || '',
            reportingManagerId: emp.reportingManagerId || '',
            bankName: emp.bankName || '', bankAccountNo: emp.bankAccountNo || '', ifscCode: emp.ifscCode || '',
            emergencyContactName: emp.emergencyContactName || '', emergencyContactPhone: emp.emergencyContactPhone || '',
            emergencyContactRelation: emp.emergencyContactRelation || '',
            password: '', role: emp.user?.role || 'employee'
          });
        }
      } catch { toast.error('Failed to load form data'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('Please fill in required fields (First Name, Last Name, Email)');
      return;
    }

    if (!isEdit && form.password && form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      // Remove password if empty (use backend default)
      if (!payload.password) delete payload.password;

      // Convert empty strings to null for optional FK/number fields
      ['departmentId', 'designationId', 'reportingManagerId', 'salary'].forEach((key) => {
        if (payload[key] === '') payload[key] = null;
      });

      const originalRole = isEdit
        ? (await employeeAPI.getById(id)).data.data?.user?.role
        : null;

      if (isEdit) {
        await employeeAPI.update(id, payload);
        // If role changed, call the dedicated role endpoint (User model)
        if (payload.role && payload.role !== originalRole) {
          await employeeAPI.updateRole(id, payload.role);
        }
        toast.success('Employee updated');
      } else {
        // For new employees, role is passed directly in the create payload
        await employeeAPI.create(payload);
        toast.success('Employee created');
      }
      navigate('/employees');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally { setSaving(false); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (loading) return <div className="card p-6"><div className="animate-pulse space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1><p className="page-subtitle">{isEdit ? 'Update employee information' : 'Create a new employee record'}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-primary-500 rounded-full" /> Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className="label">First Name *</label><input name="firstName" value={form.firstName} onChange={handleChange} className="input-field" required /></div>
          <div><label className="label">Last Name *</label><input name="lastName" value={form.lastName} onChange={handleChange} className="input-field" required /></div>
          <div><label className="label">Email *</label><input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required /></div>
          <div><label className="label">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">Gender</label><select name="gender" value={form.gender} onChange={handleChange} className="input-field"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div><label className="label">Date of Birth</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="input-field" /></div>
          <div className="md:col-span-3"><label className="label">Address</label><textarea name="address" value={form.address} onChange={handleChange} className="input-field" rows={2} /></div>
        </div>

        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-success-500 rounded-full" /> Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className="label">Joining Date *</label><input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} className="input-field" required /></div>
          <div><label className="label">Employment Type</label><select name="employmentType" value={form.employmentType} onChange={handleChange} className="input-field"><option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="intern">Intern</option></select></div>
          <div><label className="label">Salary</label><input name="salary" type="number" value={form.salary} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">Department</label><select name="departmentId" value={form.departmentId} onChange={handleChange} className="input-field"><option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="label">Designation</label><select name="designationId" value={form.designationId} onChange={handleChange} className="input-field"><option value="">Select</option>{designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
          <div><label className="label">Reporting Manager</label><select name="reportingManagerId" value={form.reportingManagerId} onChange={handleChange} className="input-field"><option value="">None</option>{managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.user?.role})</option>)}</select></div>
        </div>

        {!isEdit && (
          <>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-warning-500 rounded-full" /> Account Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Password <span className="text-secondary-400 font-normal">(optional - defaults to 'changeme123')</span></label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Set a password for the employee"
                    className="input-field pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">
                  <HiOutlineShieldCheck className="w-4 h-4 inline mr-1" />
                  Role
                </label>
                <select name="role" value={form.role} onChange={handleChange} className="input-field">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-secondary-400 mt-1">Assign the user's role and permissions</p>
              </div>
            </div>
          </>
        )}

        {isEdit && (
          <>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-warning-500 rounded-full" /> Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">
                  <HiOutlineShieldCheck className="w-4 h-4 inline mr-1" />
                  Role
                </label>
                <select name="role" value={form.role} onChange={handleChange} className="input-field">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-secondary-400 mt-1">Changing the role will update the user's permissions immediately</p>
              </div>
            </div>
          </>
        )}

        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-blue-500 rounded-full" /> Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className="label">Bank Name</label><input name="bankName" value={form.bankName} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">Account Number</label><input name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">IFSC Code</label><input name="ifscCode" value={form.ifscCode} onChange={handleChange} className="input-field" /></div>
        </div>

        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-1 h-6 bg-danger-500 rounded-full" /> Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div><label className="label">Contact Name</label><input name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">Phone</label><input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} className="input-field" /></div>
          <div><label className="label">Relation</label><input name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} className="input-field" /></div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}</button>
          <button type="button" onClick={() => navigate('/employees')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
