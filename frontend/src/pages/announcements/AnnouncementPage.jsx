import { useState, useEffect } from 'react';
import { announcementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineInformationCircle,
} from 'react-icons/hi';

const STATUS_OPTIONS = ['draft', 'published', 'archived'];

const STATUS_BADGE = {
  draft: 'badge-secondary',
  published: 'badge-success',
  archived: 'badge-danger',
};

const PRIORITY_BADGE = {
  urgent: 'badge-danger',
  high: 'badge-warning',
  normal: 'badge-info',
  low: 'badge-secondary',
};

export default function AnnouncementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'company',
    priority: 'normal',
    status: 'published',
  });

  /* ─── Data fetching ─── */
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await announcementAPI.getAll({});
      setAnnouncements(res.data.data || []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ─── Create / Update handler ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    try {
      if (editMode && selectedAnnouncement) {
        await announcementAPI.update(selectedAnnouncement.id, form);
        toast.success('Announcement updated');
      } else {
        await announcementAPI.create(form);
        toast.success('Announcement created');
      }
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  /* ─── Delete handler ─── */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to archive this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      toast.success('Announcement archived');
      fetchData();
    } catch {
      toast.error('Failed to archive announcement');
    }
  };

  /* ─── Publish / Unpublish handler ─── */
  const handlePublishToggle = async (announcement) => {
    try {
      if (announcement.status === 'published') {
        await announcementAPI.unpublish(announcement.id);
        toast.success('Announcement unpublished');
      } else {
        await announcementAPI.publish(announcement.id);
        toast.success('Announcement published');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  /* ─── View announcement details ─── */
  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewModalOpen(true);
  };

  /* ─── Open edit modal ─── */
  const handleEdit = (announcement) => {
    setEditMode(true);
    setSelectedAnnouncement(announcement);
    setForm({
      title: announcement.title || '',
      content: announcement.content || '',
      type: announcement.type || 'company',
      priority: announcement.priority || 'normal',
      status: announcement.status || 'published',
    });
    setModalOpen(true);
  };

  /* ─── Open create modal ─── */
  const handleNew = () => {
    resetForm();
    setEditMode(false);
    setSelectedAnnouncement(null);
    setModalOpen(true);
  };

  const resetForm = () => {
    setForm({ title: '', content: '', type: 'company', priority: 'normal', status: 'published' });
  };

  /* ─── Table columns ─── */
  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (r) => (
        <span className="font-medium text-secondary-900">{r.title}</span>
      ),
    },
    {
      header: 'Type',
      render: (r) => <span className="badge badge-info">{r.type}</span>,
    },
    {
      header: 'Priority',
      render: (r) => (
        <span className={`badge ${PRIORITY_BADGE[r.priority] || 'badge-secondary'}`}>
          {r.priority}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (r) => (
        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-secondary'}`}>
          {r.status}
        </span>
      ),
    },
    {
      header: 'Created By',
      render: (r) =>
        r.creator
          ? `${r.creator.firstName} ${r.creator.lastName}`
          : '-',
    },
    {
      header: 'Date',
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-',
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          {/* View – available to all */}
          <button
            onClick={(e) => { e.stopPropagation(); handleView(r); }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="View details"
          >
            <HiOutlineEye className="w-4 h-4 text-secondary-500" />
          </button>

          {/* Admin-only actions */}
          {isAdmin && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                className="p-1.5 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <HiOutlinePencilAlt className="w-4 h-4 text-primary-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handlePublishToggle(r); }}
                className="p-1.5 hover:bg-green-50 rounded"
                title={r.status === 'published' ? 'Unpublish' : 'Publish'}
              >
                {r.status === 'published' ? (
                  <HiOutlineXCircle className="w-4 h-4 text-warning-600" />
                ) : (
                  <HiOutlineCheckCircle className="w-4 h-4 text-success-600" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                className="p-1.5 hover:bg-red-50 rounded"
                title="Archive"
              >
                <HiOutlineTrash className="w-4 h-4 text-danger-600" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Company-wide and department announcements</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleNew}
            className="btn-primary btn-sm sm:btn-md"
          >
            <HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />
            New Announcement
          </button>
        )}
      </div>

      {/* Announcements table */}
      <DataTable columns={columns} data={announcements} loading={loading} />

      {/* ───────────── Create / Edit Modal ───────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editMode ? 'Edit Announcement' : 'New Announcement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input-field"
              >
                <option value="company">Company</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input-field"
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editMode ? 'Save Changes' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ───────────── View Details Modal ───────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedAnnouncement(null); }}
        title="Announcement Details"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">
                {selectedAnnouncement.title}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-secondary-500">
                <span className={`badge ${PRIORITY_BADGE[selectedAnnouncement.priority] || 'badge-secondary'}`}>
                  {selectedAnnouncement.priority}
                </span>
                <span className={`badge ${STATUS_BADGE[selectedAnnouncement.status] || 'badge-secondary'}`}>
                  {selectedAnnouncement.status}
                </span>
                <span className="badge badge-info">{selectedAnnouncement.type}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-secondary-700 whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
            </div>

            <div className="border-t pt-4 text-sm text-secondary-500 space-y-1">
              <p>
                <span className="font-medium">Created by:</span>{' '}
                {selectedAnnouncement.creator
                  ? `${selectedAnnouncement.creator.firstName} ${selectedAnnouncement.creator.lastName}`
                  : 'Unknown'}
              </p>
              {selectedAnnouncement.department && (
                <p>
                  <span className="font-medium">Department:</span>{' '}
                  {selectedAnnouncement.department.name}
                </p>
              )}
              {selectedAnnouncement.publishedAt && (
                <p>
                  <span className="font-medium">Published:</span>{' '}
                  {new Date(selectedAnnouncement.publishedAt).toLocaleString()}
                </p>
              )}
              <p>
                <span className="font-medium">Created:</span>{' '}
                {new Date(selectedAnnouncement.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => { setViewModalOpen(false); setSelectedAnnouncement(null); }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
