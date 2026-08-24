import { useState, useEffect } from 'react';
import { recruitmentAPI, departmentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineBriefcase, HiOutlineUsers } from 'react-icons/hi';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [modalOpen, setModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ jobTitle: '', departmentId: '', vacancies: 1, description: '', status: 'draft' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobRes, candRes, deptRes] = await Promise.all([
        recruitmentAPI.getJobs({}), recruitmentAPI.getCandidates({}), departmentAPI.getAll()
      ]);
      setJobs(jobRes.data.data || []);
      setCandidates(candRes.data.data || []);
      setDepartments(deptRes.data.data || deptRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!form.jobTitle || !form.departmentId) { toast.error('Title and department required'); return; }
    try { await recruitmentAPI.createJob(form); toast.success('Job created'); setModalOpen(false); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const jobColumns = [
    { header: 'Job Code', accessor: 'jobCode' },
    { header: 'Title', accessor: 'jobTitle' },
    { header: 'Department', render: (r) => r.department?.name || '-' },
    { header: 'Vacancies', accessor: 'vacancies' },
    { header: 'Candidates', render: (r) => r.candidateCount || 0 },
    { header: 'Status', render: (r) => <span className={`badge ${r.status === 'published' ? 'badge-success' : r.status === 'draft' ? 'badge-warning' : 'badge-secondary'}`}>{r.status}</span> },
  ];

  const candidateColumns = [
    { header: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Position', render: (r) => r.recruitment?.jobTitle || '-' },
    { header: 'Experience', render: (r) => r.experienceYears ? `${r.experienceYears}yrs` : '-' },
    { header: 'Status', render: (r) => <span className={`badge ${['selected','hired'].includes(r.status) ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>{r.status.replace('_', ' ')}</span> },
    { header: 'Applied', render: (r) => r.appliedAt ? new Date(r.appliedAt).toLocaleDateString() : '-' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Recruitment</h1><p className="page-subtitle">Job postings and candidate management</p></div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><HiOutlinePlus className="w-5 h-5 mr-1.5" /> New Job Post</button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'jobs' ? 'bg-white shadow-sm' : 'text-secondary-600'}`}><HiOutlineBriefcase className="w-4 h-4 inline mr-1" />Jobs</button>
        <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'candidates' ? 'bg-white shadow-sm' : 'text-secondary-600'}`}><HiOutlineUsers className="w-4 h-4 inline mr-1" />Candidates</button>
      </div>

      {activeTab === 'jobs' && <DataTable columns={jobColumns} data={jobs} loading={loading} />}
      {activeTab === 'candidates' && <DataTable columns={candidateColumns} data={candidates} loading={loading} />}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Job Post">
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div><label className="label">Job Title *</label><input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field" required /></div>
          <div><label className="label">Department *</label><select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} className="input-field" required><option value="">Select</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Vacancies</label><input type="number" value={form.vacancies} onChange={e => setForm({...form, vacancies: e.target.value})} className="input-field" min={1} /></div>
            <div><label className="label">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input-field"><option value="draft">Draft</option><option value="published">Published</option></select></div>
          </div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={4} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

