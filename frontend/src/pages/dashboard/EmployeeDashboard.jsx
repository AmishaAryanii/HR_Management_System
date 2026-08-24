import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, notificationAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { HiOutlineCalendar, HiOutlinePaperAirplane, HiOutlineClipboardList, HiOutlineCash, HiOutlineBell, HiOutlineChevronRight } from 'react-icons/hi';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, notifRes] = await Promise.all([
          dashboardAPI.getEmployee(),
          notificationAPI.getAll({ limit: 5 })
        ]);
        setData(dashRes.data.data);
        setNotifications(notifRes.data?.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  if (!data) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">My Dashboard</h1><p className="page-subtitle">Your personal overview</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={HiOutlineCalendar} label="Today's Attendance" value="--" color="primary" />
          <StatCard icon={HiOutlinePaperAirplane} label="Leave Balance" value="--" color="success" />
          <StatCard icon={HiOutlineClipboardList} label="Pending Tasks" value="--" color="warning" />
          <StatCard icon={HiOutlineCash} label="Salary Info" value="--" color="info" />
        </div>
      </div>
    );
  }

  const attendanceStatus = data.attendance?.status || 'absent';
  const statusColor = attendanceStatus === 'present' || attendanceStatus === 'late' ? 'success' : 'warning';
  const leaveBal = data.leaveBalance;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Welcome, {data.employee?.firstName || 'User'}!</h1><p className="page-subtitle">Your personal overview</p></div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Profile Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><p className="text-xs text-secondary-500">Department</p><p className="font-medium">{data.employee?.department?.name || '-'}</p></div>
          <div><p className="text-xs text-secondary-500">Designation</p><p className="font-medium">{data.employee?.designation?.title || '-'}</p></div>
          <div><p className="text-xs text-secondary-500">Manager</p><p className="font-medium">{data.employee?.manager ? `${data.employee.manager.firstName} ${data.employee.manager.lastName}` : '-'}</p></div>
          <div><p className="text-xs text-secondary-500">Employee ID</p><p className="font-medium">{data.employee?.employeeId || '-'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={HiOutlineCalendar} label="Today's Status" value={attendanceStatus === 'absent' ? 'Not Checked In' : attendanceStatus} color={statusColor} />
        <StatCard icon={HiOutlinePaperAirplane} label="Leave Balance" value={`${parseFloat(leaveBal?.casual || 0) + parseFloat(leaveBal?.sick || 0)} days`} color="success" subtitle={`${leaveBal?.casual || 0} casual, ${leaveBal?.sick || 0} sick`} />
        <StatCard icon={HiOutlineClipboardList} label="Pending Tasks" value={data.tasks?.pending || 0} color="warning" />
        {data.latestPayslip ? (
          <StatCard
            icon={HiOutlineCash}
            label="Latest Salary"
            value={`₹${parseFloat(data.latestPayslip.netPay).toLocaleString('en-IN')}`}
            color="success"
            subtitle={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][data.latestPayslip.month - 1]} ${data.latestPayslip.year}`}
          />
        ) : (
          <StatCard icon={HiOutlineCash} label="On Leave Today" value={data.onLeave ? 'Yes' : 'No'} color={data.onLeave ? 'danger' : 'info'} />
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <HiOutlineBell className="w-5 h-5 text-primary-500" />
              Recent Notifications
            </h3>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  onClick={() => navigate('/notifications')}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isUnread ? 'bg-primary-50 border border-primary-100' : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-primary-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-secondary-900' : 'font-medium text-secondary-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-secondary-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-secondary-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
