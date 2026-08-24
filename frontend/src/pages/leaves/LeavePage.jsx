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
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  // Admin and Super Admin cannot apply leave for themselves
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
      // Admin/Super Admin don't need leave balances (they can't apply)
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

  const handleApprove = async (id, role) => {
    try {
      if (role === 'manager') await leaveAPI.approveByManager(id, '');
      else await leaveAPI.approveByAdmin(id, '');
      toast.success('Leave approved');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this leave request?')) return;
    try { await leaveAPI.reject(id, 'Rejected'); toast.success('Leave rejected'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const columns = [
    { header: 'Employee', render: (r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-' },
    { header: 'Type', render: (r) => <span className="badge badge-info">{r.leaveType}</span> },
    { header: 'From', accessor: 'startDate' },
    { header: 'To', accessor: 'endDate' },
    { header: 'Days', accessor: 'totalDays' },
    { header: 'Status', render: (r) => {
      const map = { pending: 'badge-warning', approved_by_manager: 'badge-info', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-secondary' };
      return <span className={`badge ${map[r.status] || 'badge-secondary'}`}>{r.status.replace('_', ' ')}</span>;
    }},
    { header: 'Actions', render: (r) => r.status === 'pending' && hasPermission(['manager', 'admin', 'super_admin']) ? (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); handleApprove(r.id, 'manager'); }} className="p-1.5 hover:bg-green-50 rounded"><HiOutlineCheck className="w-4 h-4 text-success-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleReject(r.id); }} className="p-1.5 hover:bg-red-50 rounded"><HiOutlineX className="w-4 h-4 text-danger-600" /></button>
      </div>
    ) : null }
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

      {/* Leave balance cards — hidden for admin/super_admin */}
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
