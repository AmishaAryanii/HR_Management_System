import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { performanceAPI, employeeAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { HiOutlineStar, HiOutlinePlus, HiOutlineChartBar } from 'react-icons/hi';

export default function PerformancePage() {
  const { userRole } = useAuth();
  const isEmployee = userRole === 'employee';
  const canCreateReview = ['super_admin', 'admin', 'manager'].includes(userRole);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', reviewPeriod: '', reviewType: 'quarterly',
    overallRating: '', feedback: '', goals: '', areasOfImprovement: ''
  });

  // ── Fetch reviews + stats ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [performanceAPI.getAll({})];
      if (!isEmployee) promises.push(performanceAPI.getStats());
      const results = await Promise.all(promises);
      setReviews(results[0].data.data || []);
      if (!isEmployee && results[1]) setStats(results[1].data.data || null);
    } catch (err) {
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch employees separately — same as PayrollPage ──
  const fetchEmployees = () => {
    if (!canCreateReview) return;
    if (userRole === 'manager') {
      employeeAPI.getMyTeam()
        .then(res => {
          const teamData = res.data.data;
          const allMembers = [...(teamData.team || []), teamData.myself].filter(Boolean);
          setEmployees(allMembers);
        })
        .catch(err => console.error('Team fetch error:', err));
    } else {
      employeeAPI.getLite()
        .then(res => {
          setEmployees(res.data.data || []);
        })
        .catch(err => console.error('Employees fetch error:', err));
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees(); // alag se call — Payroll page jaisa
  }, []);

  useEffect(() => {
    if (modalOpen) {
      setForm({
        employeeId: '', reviewPeriod: '', reviewType: 'quarterly',
        overallRating: '', feedback: '', goals: '', areasOfImprovement: ''
      });
      // Modal open hone par employees dobara fetch karo agar empty hain
      if (employees.length === 0) fetchEmployees();
    }
  }, [modalOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.reviewPeriod) {
      toast.error('Employee and review period required');
      return;
    }
    try {
      await performanceAPI.create(form);
      toast.success('Review created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const columns = [
    { header: 'Employee', render: (r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-' },
    { header: 'Period', accessor: 'reviewPeriod' },
    { header: 'Type', render: (r) => <span className="badge badge-info">{r.reviewType}</span> },
    { header: 'Rating', render: (r) => r.overallRating ? <span className="text-warning-600 font-medium">{'★'.repeat(r.overallRating)}{'☆'.repeat(5 - r.overallRating)}</span> : '-' },
    { header: 'Status', render: (r) => <span className={`badge ${r.status === 'completed' ? 'badge-success' : r.status === 'in_progress' ? 'badge-warning' : 'badge-secondary'}`}>{r.status}</span> },
    { header: 'Date', render: (r) => r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '-' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Reviews</h1>
          <p className="page-subtitle">Employee evaluations and ratings</p>
        </div>
        {canCreateReview && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <HiOutlinePlus className="w-5 h-5 mr-1.5" /> New Review
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="animate-fade-in-up">
            <StatCard icon={HiOutlineStar} label="Average Rating" value={stats.stats?.[0]?.avgRating ? parseFloat(stats.stats[0].avgRating).toFixed(1) : '-'} color="warning" />
          </div>
          <div className="animate-fade-in-up animate-delay-100">
            <StatCard icon={HiOutlineChartBar} label="Total Reviews" value={stats.stats?.reduce((s, r) => s + parseInt(r.count), 0) || 0} color="primary" />
          </div>
          <div className="animate-fade-in-up animate-delay-200">
            <StatCard icon={HiOutlineStar} label="Reviews This Period" value={reviews.length} color="success" />
          </div>
        </div>
      )}

      <DataTable columns={columns} data={reviews} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Performance Review" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Employee Select */}
            <div>
              <label className="label">Employee *</label>
              <select
                value={form.employeeId}
                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                className="input-field"
                required
              >
                <option value="">
                  {employees.length === 0 ? 'Loading employees...' : 'Select employee...'}
                </option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Review Period</label>
              <input
                value={form.reviewPeriod}
                onChange={e => setForm({ ...form, reviewPeriod: e.target.value })}
                className="input-field"
                placeholder="e.g. Q1 2024"
                required
              />
            </div>

            <div>
              <label className="label">Review Type</label>
              <select
                value={form.reviewType}
                onChange={e => setForm({ ...form, reviewType: e.target.value })}
                className="input-field"
              >
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="label">Rating (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.overallRating}
                onChange={e => setForm({ ...form, overallRating: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Goals</label>
            <textarea
              value={form.goals}
              onChange={e => setForm({ ...form, goals: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Key goals and objectives"
            />
          </div>

          <div>
            <label className="label">Areas of Improvement</label>
            <textarea
              value={form.areasOfImprovement}
              onChange={e => setForm({ ...form, areasOfImprovement: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Feedback</label>
            <textarea
              value={form.feedback}
              onChange={e => setForm({ ...form, feedback: e.target.value })}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Review
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}