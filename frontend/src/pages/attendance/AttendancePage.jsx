import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceAPI, employeeAPI, departmentAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineRefresh,
  HiOutlineLogin, HiOutlineLogout, HiOutlineSearch, HiOutlineFilter
} from 'react-icons/hi';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
];

const STATUS_BADGE = {
  present: 'bg-emerald-100 text-emerald-700',
  late: 'bg-amber-100 text-amber-700',
  absent: 'bg-rose-100 text-rose-700',
  half_day: 'bg-blue-100 text-blue-700',
  on_leave: 'bg-purple-100 text-purple-700',
};

export default function AttendancePage() {
  const { userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');
  const isManager = userRole === 'manager';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const canCheckInOut = userRole === 'employee';

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, totalWorkingHours: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH);
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [filterEmployee, setFilterEmployee] = useState(employeeIdParam || '');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Reference data for filters
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch reference data for admin filters
  useEffect(() => {
    if (isAdmin) {
      employeeAPI.getLite().then(res => setEmployees(res.data.data || [])).catch(() => {});
      departmentAPI.getAll().then(res => setDepartments(res.data.data || res.data || [])).catch(() => {});
    }
  }, [isAdmin]);

  // Fetch attendance data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { month: filterMonth, year: filterYear };
      if (filterEmployee) params.employeeId = filterEmployee;
      if (filterDepartment) params.departmentId = filterDepartment;
      const res = await attendanceAPI.getMonthly(params);
      setRecords(res.data.data.records || []);
      setSummary(res.data.data.summary || { present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, totalWorkingHours: 0 });
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterMonth, filterYear, filterEmployee, filterDepartment]);

  // Client-side filtering for status and search
  const filteredRecords = useMemo(() => {
    let result = records;
    if (filterStatus) {
      result = result.filter(r => r.status === filterStatus);
    }
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(r => {
        const name = r.employee ? `${r.employee.firstName} ${r.lastName}`.toLowerCase() : '';
        const empId = r.employee?.employeeId?.toLowerCase() || '';
        return name.includes(lower) || empId.includes(lower);
      });
    }
    return result;
  }, [records, filterStatus, searchText]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try { await attendanceAPI.checkIn(); toast.success('Checked in!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    try { await attendanceAPI.checkOut(); toast.success('Checked out!'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Check-out failed'); }
  };

  // Admin table columns
  const adminColumns = [
    {
      header: 'Employee',
      render: (r) => r.employee ? (
        <div>
          <p className="font-medium text-secondary-900">{r.employee.firstName} {r.employee.lastName}</p>
          <p className="text-xs text-secondary-500">{r.employee.employeeId || ''}</p>
        </div>
      ) : '-'
    },
    { header: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Check In', render: (r) => r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-secondary-400">—</span> },
    { header: 'Check Out', render: (r) => r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-secondary-400">—</span> },
    { header: 'Hours', render: (r) => r.workingHours ? <span className="font-medium">{r.workingHours}h</span> : <span className="text-secondary-400">—</span> },
    {
      header: 'Status',
      render: (r) => {
        const badge = STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
            {r.status === 'half_day' ? 'Half Day' : r.status === 'on_leave' ? 'On Leave' : r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—'}
          </span>
        );
      }
    },
  ];

  // Employee table columns (simpler)
  const employeeColumns = [
    { header: 'Date', render: (r) => new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Check In', render: (r) => r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-secondary-400">—</span> },
    { header: 'Check Out', render: (r) => r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-secondary-400">—</span> },
    { header: 'Hours', render: (r) => r.workingHours ? <span className="font-medium">{r.workingHours}h</span> : <span className="text-secondary-400">—</span> },
    {
      header: 'Status',
      render: (r) => {
        const badge = STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
            {r.status === 'half_day' ? 'Half Day' : r.status === 'on_leave' ? 'On Leave' : r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—'}
          </span>
        );
      }
    },
  ];

  const columns = isAdmin ? adminColumns : employeeColumns;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {isAdmin ? 'View all employee attendance records' : isManager ? 'View team attendance' : 'Track your attendance'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCheckInOut && (
            <>
              <button onClick={handleCheckIn} disabled={checkingIn} className="btn-success btn-sm sm:btn-md">
                <HiOutlineLogin className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />{checkingIn ? '...' : 'Check In'}
              </button>
              <button onClick={handleCheckOut} className="btn-secondary btn-sm sm:btn-md">
                <HiOutlineLogout className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />Check Out
              </button>
            </>
          )}
          <button onClick={fetchData} className="btn-secondary btn-sm sm:btn-md">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={HiOutlineCheckCircle} label="Present" value={summary.present || 0} color="success" />
        <StatCard icon={HiOutlineXCircle} label="Absent" value={summary.absent || 0} color="danger" />
        <StatCard icon={HiOutlineClock} label="Late" value={summary.late || 0} color="warning" />
        <StatCard icon={HiOutlineCheckCircle} label="Half Day" value={summary.halfDay || 0} color="info" />
        <StatCard icon={HiOutlineClock} label="Total Hours" value={`${parseFloat(summary.totalWorkingHours || 0).toFixed(1)}h`} color="primary" />
      </div>

      {/* Admin Filters */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm w-full">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/60"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showFilters ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'}`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              Filters
            </button>

            {/* Month/Year quick selectors */}
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={e => setFilterYear(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t border-gray-100 animate-fade-in-down">
              {/* Employee filter */}
              <div>
                <label className="text-xs font-medium text-secondary-500 mb-1 block">Employee</label>
                <select
                  value={filterEmployee}
                  onChange={e => setFilterEmployee(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>

              {/* Department filter */}
              <div>
                <label className="text-xs font-medium text-secondary-500 mb-1 block">Department</label>
                <select
                  value={filterDepartment}
                  onChange={e => setFilterDepartment(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <label className="text-xs font-medium text-secondary-500 mb-1 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear filters */}
              {(filterEmployee || filterDepartment || filterStatus || searchText) && (
                <button
                  onClick={() => { setFilterEmployee(''); setFilterDepartment(''); setFilterStatus(''); setSearchText(''); }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Employee simple month selector (non-admin) */}
      {!isAdmin && (
        <div className="flex items-center gap-3">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {/* Results count for admin */}
      {isAdmin && !loading && (
        <p className="text-sm text-secondary-500">
          Showing {filteredRecords.length} of {records.length} records
          {filterStatus && ` · Filtered by: ${filterStatus}`}
          {searchText && ` · Search: "${searchText}"`}
        </p>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        loading={loading}
        emptyMessage={isAdmin ? 'No attendance records found for this period.' : 'No attendance records found.'}
      />
    </div>
  );
}
