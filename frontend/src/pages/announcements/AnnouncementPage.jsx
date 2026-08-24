import { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSpeakerphone, HiOutlineTrash } from 'react-icons/hi';

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'company', priority: 'normal' });

  const fetchData = async () => {
    setLoading(true);
    try { const res = await announcementAPI.getAll({}); setAnnouncements(res.data.data || []); }
    catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    try { await announcementAPI.create(form); toast.success('Announcement created'); setModalOpen(false); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await announcementAPI.delete(id); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Type', render: (r) => <span className="badge badge-info">{r.type}</span> },
    { header: 'Priority', render: (r) => <span className={`badge ${r.priority === 'urgent' ? 'badge-danger' : r.priority === 'high' ? 'badge-warning' : 'badge-secondary'}`}>{r.priority}</span> },
    { header: 'Created By', render: (r) => r.creator ? `${r.creator.firstName} ${r.creator.lastName}` : '-' },
    { header: 'Date', render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-' },
    { header: 'Actions', render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 hover:bg-red-50 rounded"><HiOutlineTrash className="w-4 h-4 text-danger-600" /></button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Announcements</h1><p className="page-subtitle">Company and team announcements</p></div>
        <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm sm:btn-md"><HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" /> New Announcement</button>
      </div>
      <DataTable columns={columns} data={announcements} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field"><option value="company">Company</option><option value="department">Department</option><option value="team">Team</option><option value="urgent">Urgent</option></select></div>
            <div><label className="label">Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="input-field"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          </div>
          <div><label className="label">Content *</label><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="input-field" rows={5} required /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Publish</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
