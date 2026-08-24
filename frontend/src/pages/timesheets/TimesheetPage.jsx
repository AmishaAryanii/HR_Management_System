import { useState, useEffect, useCallback } from 'react';
import { timesheetAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineClock, HiOutlinePlus, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineFilter, HiOutlineRefresh, HiOutlineCalendar
} from 'react-icons/hi';

const STATUS_COLORS = {
  pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Pending' },
  approved: { bg: 'bg-success-100', text: 'text-success-700', label: 'Approved' },
  rejected: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Rejected' },
};

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  const colors = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
    success: { bg: 'bg-success-100', text: 'text-success-600' },
    warning: { bg: 'bg-warning-100', text: 'text-warning-600' },
    danger: { bg: 'bg-danger-100', text: 'text-danger-600' },
    info: { bg: 'bg-info-100', text: 'text-info-600' },
  };
  const c = colors[color] || colors.primary;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-secondary-900">{value}</p>
          <p className="text-sm text-secondary-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TimesheetModal({ open, onClose, onSubmit }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('');
  const [task, setTask] = useState('');
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date || !task || !hours) { setError('Date, task, and hours are required'); return; }
    if (parseFloat(hours) <= 0 || parseFloat(hours) > 24) { setError('Hours must be between 0 and 24'); return; }
    setSaving(true);
    try {
      await onSubmit({ date, project, task, hours: parseFloat(hours) });
      toast.success('Timesheet entry added');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="text-lg font-semibold text-secondary-900">Log Hours</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            {error && <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}
            <div>
              <label className="label">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">Project</label>
              <input type="text" value={project} onChange={e => setProject(e.target.value)} className="input-field" placeholder="Project name (optional)" />
            </div>
            <div>
              <label className="label">Task Description *</label>
              <textarea value={task} onChange={e => setTask(e.target.value)} className="input-field" rows={3} placeholder="Describe the work done" required />
            </div>
            <div>
              <label className="label">Hours *</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} className="input-field" placeholder="0.0" step="0.5" min="0.5" max="24" required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">{saving ? 'Saving...' : 'Save Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TimesheetPage() {
  const { isManager, isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [meta, setMeta] = useState({ weeklyHours: 0, pendingCount: 0, total: 0 });
  const [filter, setFilter] = useState('');
  const canReview = isManager || isAdmin;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await timesheetAPI.getAll(params);
      setEntries(res.data.data || []);
      setMeta(res.data.meta || { weeklyHours: 0, pendingCount: 0, total: 0 });
    } catch {
      toast.error('Failed to load timesheet entries');
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleCreate = async (data) => {
    await timesheetAPI.create(data);
    fetchEntries();
  };

  const handleReview = async (id, status, comment = '') => {
    try {
      await timesheetAPI.updateStatus(id, status, comment);
      toast.success(`Entry ${status}`);
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this timesheet entry?')) return;
    try {
      await timesheetAPI.delete(id);
      toast.success('Entry deleted');
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Timesheets</h1>
          <p className="text-sm text-secondary-500 mt-1">Log and manage work hours</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm">
          <HiOutlinePlus className="w-4 h-4 mr-1.5" /> Log Hours
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={HiOutlineClock} label="This Week" value={`${meta.weeklyHours}h`} color="primary" />
        <StatCard icon={HiOutlineCalendar} label="Total Entries" value={meta.total} color="info" />
        {canReview && <StatCard icon={HiOutlineCheckCircle} label="Pending Review" value={meta.pendingCount} color="warning" />}
      </div>

      <div className="flex items-center gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
        <button onClick={fetchEntries} className="ml-auto p-2 rounded-lg hover:bg-gray-100"><HiOutlineRefresh className="w-4 h-4" /></button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-secondary-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-secondary-600">Employee</th>
                <th className="text-left px-5 py-3 font-medium text-secondary-600">Project</th>
                <th className="text-left px-5 py-3 font-medium text-secondary-600">Task</th>
                <th className="text-center px-5 py-3 font-medium text-secondary-600">Hours</th>
                <th className="text-center px-5 py-3 font-medium text-secondary-600">Status</th>
                {canReview && <th className="text-right px-5 py-3 font-medium text-secondary-600">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={canReview ? 7 : 6} className="px-5 py-8 text-center text-secondary-500">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={canReview ? 7 : 6} className="px-5 py-8 text-center text-secondary-500">No timesheet entries</td></tr>
              ) : entries.map(e => {
                const sc = STATUS_COLORS[e.status] || STATUS_COLORS.pending;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-secondary-700">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><span className="font-medium text-secondary-900">{e.employee?.firstName} {e.employee?.lastName}</span></td>
                    <td className="px-5 py-3 text-secondary-600">{e.project || '—'}</td>
                    <td className="px-5 py-3 text-secondary-600 max-w-[200px] truncate">{e.task}</td>
                    <td className="px-5 py-3 text-center font-medium text-secondary-900">{e.hours}h</td>
                    <td className="px-5 py-3 text-center"><span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span></td>
                    {canReview && (
                      <td className="px-5 py-3 text-right">
                        {e.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleReview(e.id, 'approved')} className="p-1.5 rounded hover:bg-success-50 text-success-600" title="Approve">
                              <HiOutlineCheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReview(e.id, 'rejected')} className="p-1.5 rounded hover:bg-danger-50 text-danger-600" title="Reject">
                              <HiOutlineXCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : <span className="text-xs text-secondary-400">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TimesheetModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}
