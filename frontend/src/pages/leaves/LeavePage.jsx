import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineX, HiOutlinePaperAirplane, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi';

export default function LeavePage() {
  const { hasPermission, userRole } = useAuth();
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin';
  // Admin cannot apply leave for themselves
  const canApplyLeave = !isAdmin;
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState({ casual: 0, sick: 0, earned: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [leaveAPI.getAll({ limit: 50 })];
      // Admin doesn't need leave balances (they can't apply)
      if (canApplyLeave) {
        promises.push(leaveAPI.getBalances());
      }
      const [leaveRes, balRes] = await Promise.all(promises);
      setLeaves(leaveRes.data.data || []);
      if (balRes) setBalances(balRes.data.data || { casual: 0, sick: 0, earned: 0 });
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) { toast.error('All fields required'); return; }
    try {
      await leaveAPI.apply(form);
      toast.success('Leave applied!');
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApproveByManager = async (id) => {
    try {
      await leaveAPI.approveByManager(id, '');
      toast.success('Leave approved by manager — pending admin approval');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApproveByAdmin = async (id) => {
    try {
      await leaveAPI.approveByAdmin(id, '');
      toast.success('Leave approved');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this leave request?')) return;
    try { await leaveAPI.reject(id, 'Rejected'); toast.success('Leave rejected'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Determine display status: pending stays pending until admin approves
  const getDisplayStatus = (r) => {
    if (r.status === 'approved') return 'approved';
    if (r.status === 'rejected') return 'rejected';
    if (r.status === 'cancelled') return 'cancelled';
    // pending OR approved_by_manager — both show as Pending
    if (r.approvedByManager) return 'pending_manager';
    return 'pending';
  };

  // Status display config — only 4 visible states
  const statusConfig = {
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-700 ring-amber-200/50', dot: 'bg-amber-500' },
    pending_manager: { label: 'Pending Admin', class: 'bg-blue-100 text-blue-700 ring-blue-200/50', dot: 'bg-blue-500' },
    approved: { label: 'Approved', class: 'bg-emerald-100 text-emerald-700 ring-emerald-200/50', dot: 'bg-emerald-500' },
    rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700 ring-rose-200/50', dot: 'bg-rose-500' },
    cancelled: { label: 'Cancelled', class: 'bg-gray-100 text-gray-600 ring-gray-200/50', dot: 'bg-gray-400' },
  };

  const columns = [
    { header: 'Employee', render: (r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-' },
    { header: 'Type', render: (r) => <span className="badge badge-info">{r.leaveType}</span> },
    { header: 'From', accessor: 'startDate' },
    { header: 'To', accessor: 'endDate' },
    { header: 'Days', accessor: 'totalDays' },
    { header: 'Status', render: (r) => {
      const display = getDisplayStatus(r);
      const sc = statusConfig[display] || statusConfig.pending;
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${sc.class}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      );
    }},
    { header: 'Actions', render: (r) => {
      const display = getDisplayStatus(r);
      const isPendingNoManager = r.status === 'pending' && !r.approvedByManager;
      const isPendingWithManager = r.status === 'pending' && r.approvedByManager;
      // Also handle legacy approved_by_manager status
      const isLegacyManagerApproved = r.status === 'approved_by_manager';
      const canManagerApprove = (isPendingNoManager) && isManager;
      const canAdminApprove = (isPendingNoManager || isPendingWithManager || isLegacyManagerApproved) && isAdmin;

      if (canManagerApprove) {
        return (
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleApproveByManager(r.id); }} className="p-1.5 hover:bg-green-50 rounded" title="Approve">
              <HiOutlineCheck className="w-4 h-4 text-success-600" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleReject(r.id); }} className="p-1.5 hover:bg-red-50 rounded" title="Reject">
              <HiOutlineX className="w-4 h-4 text-danger-600" />
            </button>
          </div>
        );
      }
      if (canAdminApprove) {
        return (
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); handleApproveByAdmin(r.id); }} className="p-1.5 hover:bg-green-50 rounded" title="Approve">
              <HiOutlineCheck className="w-4 h-4 text-success-600" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleReject(r.id); }} className="p-1.5 hover:bg-red-50 rounded" title="Reject">
              <HiOutlineX className="w-4 h-4 text-danger-600" />
            </button>
          </div>
        );
      }
      return null;
    }}
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Leaves</h1><p className="page-subtitle">
          {isAdmin ? 'Manage all leave requests' : 'Manage leave requests'}
        </p></div>
        {canApplyLeave && (
          <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm sm:btn-md"><HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" /> Apply Leave
          </button>
        )}
      </div>

      {/* Leave balance cards — hidden for admin */}
      {canApplyLeave && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard icon={HiOutlinePaperAirplane} label="Casual Leave" value={balances.casual} color="primary" subtitle="Remaining" />
          <StatCard icon={HiOutlineClock} label="Sick Leave" value={balances.sick} color="warning" subtitle="Remaining" />
          <StatCard icon={HiOutlineCheckCircle} label="Earned Leave" value={balances.earned} color="success" subtitle="Remaining" />
        </div>
      )}

      <DataTable columns={columns} data={leaves} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4">
          <div><label className="label">Leave Type</label><select value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})} className="input-field">
            <option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="earned">Earned Leave</option>
            <option value="maternity">Maternity Leave</option><option value="paternity">Paternity Leave</option>
          </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="input-field" required /></div>
            <div><label className="label">End Date</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="input-field" required /></div>
          </div>
          <div><label className="label">Reason</label><textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="input-field" rows={3} required /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
