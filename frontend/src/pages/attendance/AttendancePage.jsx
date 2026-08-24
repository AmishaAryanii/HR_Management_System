import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineRefresh, HiOutlineLogin, HiOutlineLogout } from 'react-icons/hi';

export default function AttendancePage() {
  const { userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const isManager = userRole === 'manager';
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const params = { month, year };
      if (employeeId) params.employeeId = employeeId;
      const res = await attendanceAPI.getMonthly(params);
      setRecords(res.data.data.records || []);
      setSummary(res.data.data.summary || { present: 0, absent: 0, late: 0 });
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

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

  const columns = [
    { header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { header: 'Employee', render: (r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '-' },
    { header: 'Check In', render: (r) => r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-' },
    { header: 'Check Out', render: (r) => r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-' },
    { header: 'Status', render: (r) => <span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'late' ? 'badge-warning' : r.status === 'absent' ? 'badge-danger' : 'badge-info'}`}>{r.status}</span> },
    { header: 'Hours', render: (r) => r.workingHours ? `${r.workingHours}h` : '-' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Attendance</h1><p className="page-subtitle">Track attendance and check in/out</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {!isManager && (
            <>
              <button onClick={handleCheckIn} disabled={checkingIn} className="btn-success btn-sm sm:btn-md"><HiOutlineLogin className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />{checkingIn ? '...' : 'Check In'}</button>
              <button onClick={handleCheckOut} className="btn-secondary btn-sm sm:btn-md"><HiOutlineLogout className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-1.5" />Check Out</button>
            </>
          )}
          <button onClick={fetchData} className="btn-secondary btn-sm sm:btn-md"><HiOutlineRefresh className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard icon={HiOutlineCheckCircle} label="Present" value={summary.present} color="success" />
        <StatCard icon={HiOutlineXCircle} label="Absent" value={summary.absent} color="danger" />
        <StatCard icon={HiOutlineClock} label="Late" value={summary.late} color="warning" />
      </div>



      <DataTable columns={columns} data={records} loading={loading} />
    </div>
  );
}
