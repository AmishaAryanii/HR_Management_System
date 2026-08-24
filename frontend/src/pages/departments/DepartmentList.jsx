import { useState, useEffect } from 'react';
import { departmentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const res = await departmentAPI.getAll(); setDepartments(res.data.data || res.data); }
    catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (dept = null) => {
    setEditing(dept);
    setForm(dept ? { name: dept.name, code: dept.code, description: dept.description || '' } : { name: '', code: '', description: '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    try {
      if (editing) { await departmentAPI.update(editing.id, form); toast.success('Department updated'); }
      else { await departmentAPI.create(form); toast.success('Department created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this department?')) return;
    try { await departmentAPI.delete(id); toast.success('Department deactivated'); fetchData(); }
    catch { toast.error('Cannot delete department with active employees'); }
  };

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Name', accessor: 'name' },
    { header: 'Description', accessor: 'description', render: (r) => r.description || '-' },
    { header: 'Employees', render: (r) => r.employeeCount || 0 },
    { header: 'Status', render: (r) => <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{r.status}</span> },
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
        <div><h1 className="page-title">Departments</h1><p className="page-subtitle">Manage departments</p></div>
        <button onClick={() => openModal()} className="btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> Add Department</button>
      </div>
      <DataTable columns={columns} data={departments} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input-field" required placeholder="e.g. ENG" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={3} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
