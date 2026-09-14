import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI, attendanceAPI, leaveAPI, taskAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePencil, HiOutlineArrowLeft, HiOutlineMail, HiOutlinePhone, HiOutlineCalendar, HiOutlineOfficeBuilding, HiOutlineIdentification, HiOutlineCash, HiOutlineUser, HiOutlineLocationMarker, HiOutlineShieldCheck, HiOutlinePlus, HiOutlineLogin, HiOutlineLogout, HiOutlineCheckCircle } from 'react-icons/hi';

export default function EmployeeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole, employee: currentUserEmployee } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const isOwnProfile = currentUserEmployee?.id === parseInt(id);
  const [selectedRole, setSelectedRole] = useState('employee');
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Update selectedRole when employee data loads
  useEffect(() => {
    if (employee?.user?.role) {
      setSelectedRole(employee.user.role);
    }
  }, [employee?.user?.role]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await employeeAPI.getById(id);
        setEmployee(res.data.data);

        // Fetch attendance records
        try {
          const attRes = await attendanceAPI.getAll({ employeeId: id, limit: 10 });
          setAttendances(attRes.data.data || []);
        } catch { /* ignore */ }

        // Fetch leave records
        try {
          const leaveRes = await leaveAPI.getAll({ employeeId: id, limit: 10 });
          setLeaves(leaveRes.data.data || []);
        } catch { /* ignore */ }

        // Fetch tasks assigned to this employee
        try {
          const taskRes = await taskAPI.getAll({ assignedTo: id, limit: 10 });
          setTasks(taskRes.data.data || []);
        } catch { /* ignore */ }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyForm.startDate || !applyForm.endDate || !applyForm.reason) {
      toast.error('All fields required');
      return;
    }
    try {
      await leaveAPI.apply(applyForm);
      toast.success('Leave applied!');
      setApplyModalOpen(false);
      setApplyForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      // Refresh leaves
      const leaveRes = await leaveAPI.getAll({ employeeId: id, limit: 10 });
      setLeaves(leaveRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply leave');
    }
  };

  // Determine today's check-in status from fetched attendance records
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendances.find(r => r.date === today);
  const isCheckedIn = todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = todayRecord?.checkIn && todayRecord?.checkOut;

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceAPI.checkIn();
      toast.success('Checked in!');
      const attRes = await attendanceAPI.getAll({ employeeId: id, limit: 10 });
      setAttendances(attRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await attendanceAPI.checkOut();
      toast.success('Checked out!');
      const attRes = await attendanceAPI.getAll({ employeeId: id, limit: 10 });
      setAttendances(attRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="card p-8 animate-pulse space-y-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-8 bg-gray-100 rounded w-full" />)}</div>;
  if (!employee) return <div className="text-center py-12 text-secondary-500">Employee not found</div>;

  const currentRole = employee.user?.role || 'employee';

  const handleRoleChange = async (newRole) => {
    if (newRole === currentRole) return;
    if (!confirm(`Change ${employee.firstName}'s role from ${currentRole} to ${newRole}?`)) return;
    setRoleUpdating(true);
    try {
      await employeeAPI.updateRole(employee.id, newRole);
      toast.success(`Role updated to ${newRole}`);
      setSelectedRole(newRole);
      const res = await employeeAPI.getById(id);
      setEmployee(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleUpdating(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leaves', label: 'Leaves' },
    { id: 'tasks', label: 'Tasks' },
  ];

  const statusBadge = (status) => {
    const map = {
      present: 'badge-success', late: 'badge-warning', absent: 'badge-danger',
      on_leave: 'badge-info', half_day: 'badge-info',
      pending: 'badge-warning', approved: 'badge-success', approved_by_manager: 'badge-info',
      rejected: 'badge-danger', cancelled: 'badge-secondary',
      in_progress: 'badge-info', completed: 'badge-success', under_review: 'badge-warning'
    };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status?.replace(/_/g, ' ')}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/employees')} className="p-2 hover:bg-gray-100 rounded-lg"><HiOutlineArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="page-title">{isOwnProfile ? 'My Profile' : `${employee.firstName} ${employee.lastName}`}</h1>
            <p className="page-subtitle">{employee.employeeId} - {employee.designation?.title || 'No Designation'}</p>
          </div>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => navigate(`/employees/${id}/edit`)} className="btn-primary"><HiOutlinePencil className="w-5 h-5 mr-1.5" /> Edit</button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-premium mb-6 sm:mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-premium ${activeTab === tab.id ? 'tab-premium-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="card p-6 sm:p-8 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-4 sm:mb-5 overflow-hidden avatar-ring-primary">
                {employee.profilePhoto ? (
                  <img src={employee.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 flex items-center justify-center">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="section-title text-lg sm:text-xl">{employee.firstName} {employee.lastName}</h3>
              <p className="text-sm text-secondary-400">{employee.designation?.title}</p>
              <span className={`inline-block mt-3 badge ${employee.employmentStatus === 'active' ? 'badge-success' : 'badge-secondary'}`}>{employee.employmentStatus}</span>
            </div>
            <div className="card p-5 sm:p-6">
              <h4 className="section-title text-sm mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0"><HiOutlineMail className="w-4 h-4" /></span> {employee.email}</p>
                <p className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0"><HiOutlinePhone className="w-4 h-4" /></span> {employee.phone || '-'}</p>
                {employee.address && <p className="flex items-start gap-3"><span className="w-8 h-8 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5"><HiOutlineLocationMarker className="w-4 h-4" /></span> <span>{employee.address}</span></p>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in-up animate-delay-100">
            <div className="card p-5 sm:p-6">
              <h4 className="section-title mb-5">Employment Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Department</p><p className="font-medium text-secondary-900">{employee.department?.name || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Designation</p><p className="font-medium text-secondary-900">{employee.designation?.title || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Joining Date</p><p className="font-medium text-secondary-900">{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Employment Type</p><p className="font-medium text-secondary-900 capitalize">{employee.employmentType?.replace('_', ' ') || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Manager</p><p className="font-medium text-secondary-900">{employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Salary</p><p className="font-medium text-secondary-900">{employee.salary ? `₹${parseFloat(employee.salary).toLocaleString('en-IN')}` : '-'}</p></div>
                {userRole === 'admin' && (
                  <div className="col-span-full border-t border-gray-100 pt-4 mt-2">
                    <p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-3">
                      <HiOutlineShieldCheck className="w-4 h-4 inline mr-1.5" />
                      User Role
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="input-field !w-auto !py-1.5 text-sm"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRoleChange(selectedRole)}
                        disabled={roleUpdating || selectedRole === currentRole}
                        className="btn-primary btn-sm"
                      >
                        {roleUpdating ? '...' : 'Update Role'}
                      </button>
                    </div>
                    {selectedRole !== currentRole && (
                      <p className="text-xs text-warning-600 mt-2">
                        Role will change from <strong>{currentRole}</strong> to <strong>{selectedRole}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <h4 className="section-title mb-5">Bank Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Bank Name</p><p className="font-medium text-secondary-900">{employee.bankName || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Account Number</p><p className="font-medium text-secondary-900">{employee.bankAccountNo || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">IFSC Code</p><p className="font-medium text-secondary-900">{employee.ifscCode || '-'}</p></div>
              </div>
            </div>

            <div className="card p-5 sm:p-6">
              <h4 className="section-title mb-5">Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Name</p><p className="font-medium text-secondary-900">{employee.emergencyContactName || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Phone</p><p className="font-medium text-secondary-900">{employee.emergencyContactPhone || '-'}</p></div>
                <div className="p-3 sm:p-4 bg-gray-50/60 rounded-xl"><p className="text-secondary-400 text-xs font-medium uppercase tracking-wider mb-1">Relation</p><p className="font-medium text-secondary-900">{employee.emergencyContactRelation || '-'}</p></div>
              </div>
            </div>

            {employee.subordinates?.length > 0 && (
              <div className="card p-5 sm:p-6">
                <h4 className="section-title mb-4">Team ({employee.subordinates.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employee.subordinates.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 p-3.5 bg-gray-50/70 rounded-xl cursor-pointer hover:bg-primary-50/50 hover:shadow-soft transition-all duration-200" onClick={() => navigate(`/employees/${sub.id}`)}>
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 rounded-full flex items-center justify-center font-medium avatar-ring">{sub.firstName?.charAt(0)}{sub.lastName?.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-secondary-900">{sub.firstName} {sub.lastName}</p><p className="text-xs text-secondary-400">{sub.designation?.title}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              {isCheckedOut ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm text-secondary-500">
                  <HiOutlineCheckCircle className="w-5 h-5 text-success-500" />
                  Today's attendance completed
                </div>
              ) : isCheckedIn ? (
                <button onClick={handleCheckOut} disabled={checkingOut} className="btn-secondary">
                  <HiOutlineLogout className="w-5 h-5 mr-1.5" />{checkingOut ? '...' : 'Check Out'}
                </button>
              ) : (
                <button onClick={handleCheckIn} disabled={checkingIn} className="btn-success">
                  <HiOutlineLogin className="w-5 h-5 mr-1.5" />{checkingIn ? '...' : 'Check In'}
                </button>
              )}
            </div>
          )}
          {attendances.length === 0 ? (
            <div className="card p-8 text-center text-secondary-500">No attendance records found</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Check In</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Check Out</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((r, i) => (
                      <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100`}>
                        <td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-'}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3">{r.workingHours ? `${r.workingHours}h` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="text-right">
            <button onClick={() => navigate(`/attendance${isOwnProfile ? `?employeeId=${id}` : ''}`)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View Full Attendance &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tab: Leaves */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {isOwnProfile && (
            <div className="flex justify-end">
              <button onClick={() => setApplyModalOpen(true)} className="btn-primary">
                <HiOutlinePlus className="w-5 h-5 mr-1.5" /> Apply Leave
              </button>
            </div>
          )}
          {leaves.length === 0 ? (
            <div className="card p-8 text-center text-secondary-500">No leave records found</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">From</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">To</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Days</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((r, i) => (
                      <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100`}>
                        <td className="px-4 py-3 capitalize">{r.leaveType?.replace('_', ' ')}</td>
                        <td className="px-4 py-3">{new Date(r.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{new Date(r.endDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{r.totalDays}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{r.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="text-right">
            <button onClick={() => navigate('/leaves')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All Leaves &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="card p-8 text-center text-secondary-500">No tasks assigned</div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Priority</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Due Date</th>
                      <th className="text-left px-4 py-3 font-medium text-secondary-600">Assigned By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((r, i) => (
                      <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-100`}>
                        <td className="px-4 py-3 font-medium">{r.title}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${
                            r.priority === 'high' ? 'badge-danger' :
                            r.priority === 'medium' ? 'badge-warning' : 'badge-info'
                          }`}>{r.priority}</span>
                        </td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3">{r.assigner ? `${r.assigner.firstName} ${r.assigner.lastName}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="text-right">
            <button onClick={() => navigate('/tasks')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All Tasks &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="label">Leave Type</label>
            <select
              value={applyForm.leaveType}
              onChange={e => setApplyForm({...applyForm, leaveType: e.target.value})}
              className="input-field"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={applyForm.startDate}
                onChange={e => setApplyForm({...applyForm, startDate: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                value={applyForm.endDate}
                onChange={e => setApplyForm({...applyForm, endDate: e.target.value})}
                className="input-field"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea
              value={applyForm.reason}
              onChange={e => setApplyForm({...applyForm, reason: e.target.value})}
              className="input-field"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setApplyModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
