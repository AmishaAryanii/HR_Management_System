import { useState, useEffect } from 'react';
import { documentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineDocumentText,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
} from 'react-icons/hi';

export default function DocumentPage() {
  const { hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [file, setFile] = useState(null);
  const [docForm, setDocForm] = useState({ title: '', type: 'other', description: '' });
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  const canManage = hasPermission(['super_admin', 'admin']);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { verificationStatus: filter } : {};
      const res = await documentAPI.getAll(params);
      setDocuments(res.data.data || []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !docForm.title) {
      toast.error('Title and file are required');
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', docForm.title);
      formData.append('type', docForm.type);
      formData.append('description', docForm.description);

      await documentAPI.upload(formData);
      toast.success('Document uploaded successfully');
      setUploadModalOpen(false);
      setFile(null);
      setDocForm({ title: '', type: 'other', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await documentAPI.download(doc.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || `${doc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleVerify = async (id, status) => {
    if (status === 'rejected' && !confirm('Are you sure you want to reject this document?')) return;
    try {
      await documentAPI.verify(id, status);
      toast.success(`Document ${status === 'verified' ? 'verified' : 'rejected'}`);
      fetchData();
    } catch {
      toast.error('Verification failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentAPI.delete(id);
      toast.success('Document deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handlePreview = (doc) => {
    setSelectedDoc(doc);
    setPreviewModalOpen(true);
  };

  const docTypes = [
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'contract', label: 'Contract' },
    { value: 'id_proof', label: 'ID Proof' },
    { value: 'address_proof', label: 'Address Proof' },
    { value: 'education', label: 'Education Certificate' },
    { value: 'payslip', label: 'Payslip' },
    { value: 'tax_form', label: 'Tax Form' },
    { value: 'nda', label: 'NDA' },
    { value: 'hr_policy', label: 'HR Policy' },
    { value: 'other', label: 'Other' },
  ];

  const columns = [
    { header: 'Title', accessor: 'title' },
    {
      header: 'Type',
      render: (r) => (
        <span className="badge badge-info">
          {docTypes.find((t) => t.value === r.type)?.label || r.type}
        </span>
      ),
    },
    {
      header: 'Employee',
      render: (r) => (r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-'),
    },
    { header: 'File', render: (r) => r.fileName || '-' },
    {
      header: 'Status',
      render: (r) => {
        const map = {
          pending: 'badge-warning',
          verified: 'badge-success',
          rejected: 'badge-danger',
        };
        return (
          <span className={`badge ${map[r.verificationStatus] || 'badge-secondary'}`}>
            {r.verificationStatus?.replace('_', ' ') || 'pending'}
          </span>
        );
      },
    },
    {
      header: 'Uploaded',
      render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'),
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handlePreview(r); }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Preview"
          >
            <HiOutlineEye className="w-4 h-4 text-primary-600" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(r); }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Download"
          >
            <HiOutlineDownload className="w-4 h-4 text-success-600" />
          </button>
          {canManage && r.verificationStatus === 'pending' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleVerify(r.id, 'verified'); }}
                className="p-1.5 hover:bg-green-50 rounded"
                title="Verify"
              >
                <HiOutlineCheckCircle className="w-4 h-4 text-success-600" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleVerify(r.id, 'rejected'); }}
                className="p-1.5 hover:bg-red-50 rounded"
                title="Reject"
              >
                <HiOutlineXCircle className="w-4 h-4 text-danger-600" />
              </button>
            </>
          )}
          {canManage && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
              className="p-1.5 hover:bg-red-50 rounded"
              title="Delete"
            >
              <HiOutlineTrash className="w-4 h-4 text-danger-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = documents.filter((d) => d.verificationStatus === 'pending').length;
  const verifiedCount = documents.filter((d) => d.verificationStatus === 'verified').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Upload, manage, and verify employee documents</p>
        </div>
        <button onClick={() => setUploadModalOpen(true)} className="btn-primary">
          <HiOutlineUpload className="w-5 h-5 mr-1.5" /> Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={HiOutlineDocumentText}
          label="Total Documents"
          value={documents.length}
          color="primary"
        />
        <StatCard
          icon={HiOutlineCheckCircle}
          label="Verified"
          value={verifiedCount}
          color="success"
        />
        <StatCard
          icon={HiOutlineXCircle}
          label="Pending Review"
          value={pendingCount}
          color="warning"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'verified', label: 'Verified' },
          { value: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.value
                ? 'bg-white shadow-sm text-secondary-900'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        emptyMessage="No documents found. Upload your first document!"
      />

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document"
        size="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                className="input-field"
                placeholder="e.g. Offer Letter - John Doe"
                required
              />
            </div>
            <div>
              <label className="label">Document Type</label>
              <select
                value={docForm.type}
                onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                className="input-field"
              >
                {docTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">File *</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="input-field file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                required
              />
              <p className="text-xs text-secondary-400 mt-1">
                Any file type supported
              </p>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                value={docForm.description}
                onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Optional description or notes about this document"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc?.title || 'Document Preview'}
        size="lg"
      >
        {selectedDoc && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-secondary-500">Type</p>
                <p className="font-medium">
                  {docTypes.find((t) => t.value === selectedDoc.type)?.label || selectedDoc.type}
                </p>
              </div>
              <div>
                <p className="text-secondary-500">Status</p>
                <span
                  className={`badge ${
                    selectedDoc.verificationStatus === 'verified'
                      ? 'badge-success'
                      : selectedDoc.verificationStatus === 'rejected'
                      ? 'badge-danger'
                      : 'badge-warning'
                  }`}
                >
                  {selectedDoc.verificationStatus || 'pending'}
                </span>
              </div>
              <div>
                <p className="text-secondary-500">File Name</p>
                <p className="font-medium">{selectedDoc.fileName || '-'}</p>
              </div>
              <div>
                <p className="text-secondary-500">Uploaded</p>
                <p className="font-medium">
                  {selectedDoc.createdAt
                    ? new Date(selectedDoc.createdAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              {selectedDoc.employee && (
                <div>
                  <p className="text-secondary-500">Employee</p>
                  <p className="font-medium">
                    {selectedDoc.employee.firstName} {selectedDoc.employee.lastName}
                  </p>
                </div>
              )}
              {selectedDoc.verifiedBy && (
                <div>
                  <p className="text-secondary-500">Verified By</p>
                  <p className="font-medium">
                    {selectedDoc.verifiedBy.firstName} {selectedDoc.verifiedBy.lastName}
                  </p>
                </div>
              )}
            </div>

            {selectedDoc.description && (
              <div>
                <p className="text-sm text-secondary-500">Description</p>
                <p className="text-sm mt-1">{selectedDoc.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="btn-primary"
              >
                <HiOutlineDownload className="w-4 h-4 mr-1.5" /> Download
              </button>
              {canManage && selectedDoc.verificationStatus === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleVerify(selectedDoc.id, 'verified');
                      setPreviewModalOpen(false);
                    }}
                    className="btn-success"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4 mr-1.5" /> Verify
                  </button>
                  <button
                    onClick={() => {
                      handleVerify(selectedDoc.id, 'rejected');
                      setPreviewModalOpen(false);
                    }}
                    className="btn-danger"
                  >
                    <HiOutlineXCircle className="w-4 h-4 mr-1.5" /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
