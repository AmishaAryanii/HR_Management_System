import { useState, useEffect } from 'react';
import { designationAPI, departmentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DesignationList() {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', code: '', description: '', grade: '', departmentId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [desigRes, deptRes] = await Promise.all([designationAPI.getAll(), departmentAPI.getAll()]);
      setDesignations(desigRes.data.data || desigRes.data);
      setDepartments(deptRes.data.data || deptRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (desig = null) => {
    setEditing(desig);
    setForm(desig ? { title: desig.title, code: desig.code, description: desig.description || '', grade: desig.grade || '', departmentId: desig.departmentId || '' } : { title: '', code: '', description: '', grade: '', departmentId: '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.code) { toast.error('Title and code are required'); return; }
    try {
      if (editing) { await designationAPI.update(editing.id, form); toast.success('Updated'); }
      else { await designationAPI.create(form); toast.success('Created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this designation?')) return;
    try { await designationAPI.delete(id); toast.success('Deactivated'); fetchData(); }
    catch { toast.error('Cannot delete designation with active employees'); }
  };

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Title', accessor: 'title' },
    { header: 'Grade', render: (r) => r.grade || '-' },
    { header: 'Department', render: (r) => r.department?.name || '-' },
    { header: 'Employees', render: (r) => r.employeeCount || 0 },
    { header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); openModal(r); }} className="p-1.5 hover:bg-gray-100 rounded"><HiOutlinePencil className="w-4 h-4 text-primary-600" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 hover:bg-gray-100 rounded"><HiOutlineTrash className="w-4 h-4 text-danger-600" /></button>
      </div>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Designations</h1><p className="page-subtitle">Manage job designations</p></div>
        <button onClick={() => openModal()} className="btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add Designation</button>
      </div>
      <DataTable columns={columns} data={designations} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Designation' : 'Add Designation'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input-field" required placeholder="e.g. SR" /></div>
          <div><label className="label">Grade</label><input value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} className="input-field" placeholder="e.g. L2" /></div>
          <div><label className="label">Department</label><select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="input-field"><option value="">None</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

