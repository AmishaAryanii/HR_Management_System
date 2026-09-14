import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/common/DataTable';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function EmployeeList() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, pageSize: 10 });
  const [roleFilter, setRoleFilter] = useState('');

  const canSeeRole = userRole === 'admin';

  const fetchEmployees = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: size };
      if (roleFilter) params.role = roleFilter;
      const res = await employeeAPI.getAll(params);
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [roleFilter]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      await employeeAPI.delete(id);
      toast.success('Employee deactivated');
      fetchEmployees(pagination.page);
    } catch { toast.error('Failed to deactivate employee'); }
  };

  const isManager = userRole === 'manager';

  // Role badge component
  const RoleBadge = ({ role }) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-700 ring-blue-300',
      manager: 'bg-amber-100 text-amber-700 ring-amber-300',
      employee: 'bg-green-100 text-green-700 ring-green-300',
    };
    const labels = {
      admin: 'Admin',
      manager: 'Manager',
      employee: 'Employee',
    };
    const c = colors[role] || colors.employee;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${c}`}>
        {labels[role] || role}
      </span>
    );
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { header: 'Email', accessor: 'email' },
    ...(canSeeRole ? [{ header: 'Role', render: (row) => row.user ? <RoleBadge role={row.user.role} /> : '-' }] : []),
    { header: 'Department', render: (row) => row.department?.name || '-' },
    { header: 'Designation', render: (row) => row.designation?.title || '-' },
    { header: 'Status', render: (row) => <span className={`badge ${row.employmentStatus === 'active' ? 'badge-success' : 'badge-secondary'}`}>{row.employmentStatus}</span> },
    { header: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row.id}`); }} className="p-1.5 hover:bg-gray-100 rounded" title="View"><HiOutlineEye className="w-4 h-4" /></button>
        {!isManager && (
          <>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row.id}/edit`); }} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><HiOutlinePencil className="w-4 h-4 text-primary-600" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="p-1.5 hover:bg-gray-100 rounded" title="Delete"><HiOutlineTrash className="w-4 h-4 text-danger-600" /></button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Employees</h1><p className="page-subtitle">{isManager ? 'My team members' : 'Manage all employees'}</p></div>
        {!isManager && (
          <button onClick={() => navigate('/employees/new')} className="btn-primary btn-sm sm:btn-md"><HiOutlinePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" /> <span className="hidden xs:inline">Add Employee</span><span className="xs:hidden">Add</span></button>
        )}
      </div>

      {/* Role filter for admins */}
      {canSeeRole && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-secondary-500 mr-1">Role:</span>
          <div className="flex gap-1.5 flex-wrap">
            {['', 'admin', 'manager', 'employee'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
                }`}
              >
                {r ? r.replace('_', ' ').replace(/^\w/, c => c.toUpperCase()) : 'All'}
              </button>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        serverPagination
        pagination={pagination}
        onPageChange={(page, size) => fetchEmployees(page, size)}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
      />
    </div>
  );
}
