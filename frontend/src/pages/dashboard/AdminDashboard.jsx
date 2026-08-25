import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import {
  HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineCalendar,
  HiOutlinePaperAirplane, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlineClock, HiOutlineEye
} from 'react-icons/hi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardAPI.getAdmin();
        setData(res.data.data);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  if (!data) {
    return (
      <div>
        <div className="page-header"><div><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">Employee and department overview</p></div></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard icon={HiOutlineUsers} label="Active Employees" value="--" color="primary" />
          <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value="--" color="success" />
          <StatCard icon={HiOutlineCalendar} label="Today Present" value="--" color="info" />
          <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value="--" color="warning" />
        </div>
      </div>
    );
  }

  const attendanceRecords = data.attendanceRecords || [];
  const missingEmployees = data.missingEmployees || [];
  const presentCount = data.attendance?.present || 0;
  const absentCount = data.attendance?.absent || 0;
  const lateCount = data.attendance?.late || 0;

  const statusColors = {
    present: { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    late: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    absent: { bg: 'bg-rose-50', dot: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Employee and department overview</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard icon={HiOutlineUsers} label="Active Employees" value={data.overview?.totalEmployees} color="primary" />
        <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value={data.overview?.totalDepartments} color="success" />
        <StatCard icon={HiOutlineCheckCircle} label="Present Today" value={presentCount} color="info" />
        <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value={data.leave?.pending} color="warning" />
      </div>

      {/* Today's Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <HiOutlineCalendar className="w-4 h-4 text-primary-500" />
            Today's Attendance
          </h3>
          <p className="text-xs text-secondary-500 mb-4">{today}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-secondary-700">Present</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">{presentCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-secondary-700">Late</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{lateCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-sm text-secondary-700">Absent / No Record</span>
              </div>
              <span className="text-lg font-bold text-rose-600">{absentCount + missingEmployees.length}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium py-2 border-t border-gray-100"
          >
            View Full Attendance →
          </button>
        </div>

        {/* Employee Attendance List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900">Employee Attendance</h3>
              <p className="text-xs text-secondary-500 mt-0.5">{attendanceRecords.length + missingEmployees.length} employees</p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {/* Employees with attendance records */}
            {attendanceRecords.map((record) => {
              const sc = statusColors[record.status] || statusColors.present;
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/attendance?employeeId=${record.employeeId}`)}
                >
                  <div className="relative">
                    <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {record.firstName?.charAt(0)}{record.lastName?.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${sc.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {record.firstName} {record.lastName}
                    </p>
                    <p className="text-xs text-secondary-500 truncate">
                      {record.department} • {record.employeeCode || ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.badge}`}>
                      {record.status === 'late' ? 'Late' : record.status === 'present' ? 'Present' : record.status}
                    </span>
                    {record.checkIn && (
                      <p className="text-[10px] text-secondary-400 mt-0.5">
                        {new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        {record.checkOut ? ` – ${new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Employees with no attendance record today */}
            {missingEmployees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer opacity-60"
                onClick={() => navigate(`/attendance?employeeId=${emp.id}`)}
              >
                <div className="relative">
                  <div className="w-9 h-9 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs text-secondary-500 truncate">
                    {emp.department} • {emp.employeeCode || ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                    No Record
                  </span>
                </div>
              </div>
            ))}

            {attendanceRecords.length === 0 && missingEmployees.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-secondary-500">
                No attendance data for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
          <div className="flex items-center gap-6">
            <div className="text-center"><p className="text-3xl font-bold text-success-600">{presentCount}</p><p className="text-sm text-secondary-500">Present</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-danger-600">{absentCount + missingEmployees.length}</p><p className="text-sm text-secondary-500">Absent</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-warning-600">{lateCount}</p><p className="text-sm text-secondary-500">Late</p></div>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          {data.recentActivities?.length > 0 ? data.recentActivities.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-sm mb-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5" /><p className="text-secondary-600">{a.description}</p></div>
          )) : <p className="text-secondary-500 text-sm">No recent activities</p>}
        </div>
      </div>
    </div>
  );
}
