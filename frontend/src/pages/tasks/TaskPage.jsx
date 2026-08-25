import { useState, useEffect } from 'react';
import { taskAPI, employeeAPI, authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi';

export default function TaskPage() {
  const { user, userRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '', category: '' });

  // Roles allowed to create/assign tasks
  const CAN_CREATE_TASK_ROLES = ['super_admin', 'admin', 'manager'];
  const canCreateTask = CAN_CREATE_TASK_ROLES.includes(userRole);
  // Admin/Super Admin cannot assign tasks to themselves
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try { const res = await taskAPI.getAll({}); setTasks(res.data.data || []); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeeAPI.getLite();
      let list = res.data.data || [];
      // Admin/Super Admin: remove self from dropdown
      if (isAdmin && user?.employee?.id) {
        list = list.filter(e => e.id !== user.employee.id);
      }
      setEmployees(list);
    } catch { toast.error('Failed to load employees'); }
  };

  useEffect(() => { fetchData(); fetchEmployees(); }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo) { toast.error('Title and assignee required'); return; }
    try { await taskAPI.create(form); toast.success('Task created'); setModalOpen(false); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await taskAPI.updateStatus(id, { status }); toast.success('Status updated'); fetchData(); }
    catch { toast.error('Failed to update'); }
  };

  // Task model statuses: assigned, in_progress, completed, verified, closed, cancelled
  const inProgress = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'verified' || t.status === 'closed').length;

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Assignee', render: (r) => r.assignee ? `${r.assignee.firstName} ${r.assignee.lastName}` : '-' },
    { header: 'Priority', render: (r) => <span className={`badge ${r.priority === 'urgent' ? 'badge-danger' : r.priority === 'high' ? 'badge-warning' : r.priority === 'medium' ? 'badge-info' : 'badge-secondary'}`}>{r.priority}</span> },
    { header: 'Status', render: (r) => (
      <select value={r.status} onChange={(e) => { e.stopPropagation(); handleStatusChange(r.id, e.target.value); }} className="text-xs border rounded px-1 py-0.5" onClick={e => e.stopPropagation()}>
        <option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
        <option value="verified">Verified</option><option value="closed">Closed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    )},
    { header: 'Due Date', render: (r) => r.dueDate || '-' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Tasks</h1><p className="page-subtitle">Task management</p></div>
        {canCreateTask && (
          <button onClick={() => setModalOpen(true)} className="btn-primary"><HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" /> <span className="hidden xs:inline">New Task</span><span className="xs:hidden">Add</span></button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard icon={HiOutlineClipboardList} label="Total Tasks" value={tasks.length} color="primary" />
        <StatCard icon={HiOutlineClock} label="Active Tasks" value={inProgress} color="warning" />
        <StatCard icon={HiOutlineCheckCircle} label="Completed" value={completedCount} color="success" />
      </div>

      <DataTable columns={columns} data={tasks} loading={loading} />

      {canCreateTask && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Task">
          <form onSubmit={handleCreate} className="space-y-4">
            <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Assigned To *</label>
                <select
                  value={form.assignedTo}
                  onChange={e => setForm({...form, assignedTo: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">
                    {employees.length === 0 ? 'No employees available' : 'Select Employee'}
                  </option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId}){emp.department ? ` — ${emp.department.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div><label className="label">Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
              <div><label className="label">Due Date</label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="input-field" /></div>
              <div><label className="label">Category</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field" placeholder="e.g. Development" /></div>
            </div>
            <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}