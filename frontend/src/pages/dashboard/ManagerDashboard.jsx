import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers, HiOutlineCalendar, HiOutlinePaperAirplane, HiOutlineClipboardList,
  HiOutlineBadgeCheck, HiOutlineXCircle, HiOutlineStar, HiOutlineGift,
  HiOutlineChartBar, HiOutlineTrendingUp, HiOutlineBriefcase, HiOutlineClock,
  HiOutlineEye, HiOutlineCheckCircle, HiOutlineX, HiOutlinePlus
} from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PIE_COLORS, ModernTooltip, defaultTooltipFormatter } from '../../utils/chartConfig';

const COLORS = {
  primary: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

function StatCard({ icon: Icon, label, value, color = 'primary', sublabel, onClick }) {
  const colorClasses = {
    primary: { bg: 'bg-primary-100', text: 'text-primary-600', ring: 'hover:ring-primary-200' },
    success: { bg: 'bg-success-100', text: 'text-success-600', ring: 'hover:ring-success-200' },
    warning: { bg: 'bg-warning-100', text: 'text-warning-600', ring: 'hover:ring-warning-200' },
    danger: { bg: 'bg-danger-100', text: 'text-danger-600', ring: 'hover:ring-danger-200' },
    info: { bg: 'bg-info-100', text: 'text-info-600', ring: 'hover:ring-info-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'hover:ring-purple-200' },
  };
  const c = colorClasses[color] || colorClasses.primary;
  return (
    <button onClick={onClick} className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all hover:ring-2 ${c.ring} text-left w-full`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-secondary-900">{value ?? '--'}</p>
          <p className="text-sm text-secondary-500 truncate">{label}</p>
          {sublabel && <p className="text-xs text-secondary-400 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </button>
  );
}

const QUICK_COLORS = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  warning: { bg: 'bg-warning-100', text: 'text-warning-600' },
  info: { bg: 'bg-info-100', text: 'text-info-600' },
  success: { bg: 'bg-success-100', text: 'text-success-600' },
  danger: { bg: 'bg-danger-100', text: 'text-danger-600' },
};

function QuickAction({ icon: Icon, label, subtitle, onClick, color = 'primary' }) {
  const c = QUICK_COLORS[color] || QUICK_COLORS.primary;
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:ring-1 hover:ring-primary-200 transition-all text-left w-full">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-secondary-900">{label}</p>
        {subtitle && <p className="text-xs text-secondary-500 truncate">{subtitle}</p>}
      </div>
    </button>
  );
}

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardAPI.getManager();
        setData(res.data.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="space-y-6"><LoadingSkeleton count={6} /></div>;

  const { overview, upcomingBirthdays, teamMembers } = data || {};
  const teamSize = overview?.teamSize || 0;

  const absentCount = overview?.teamAbsent || 0;
  const onLeaveCount = overview?.onLeave || 0;

  // Attendance pie data
  const attended = overview?.teamAttendance || 0;
  const attendancePie = [
    { name: 'Present', value: attended },
    { name: 'Absent', value: absentCount },
    { name: 'On Leave', value: onLeaveCount },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Manager Dashboard</h1>
          <p className="text-sm text-secondary-500 mt-1">Team overview and management</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineUsers} label="Total Team Members" value={teamSize} color="primary" onClick={() => navigate('/employees')} />
        <StatCard icon={HiOutlineBadgeCheck} label="Present Today" value={attended} color="success" sublabel={`out of ${teamSize + 1} total`} onClick={() => navigate('/attendance')} />
        <StatCard icon={HiOutlineXCircle} label="Absent Today" value={absentCount} color="danger" onClick={() => navigate('/attendance')} />
        <StatCard icon={HiOutlinePaperAirplane} label="Employees on Leave" value={onLeaveCount} color="warning" onClick={() => navigate('/leaves')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineStar} label="Pending Approvals" value={overview?.pendingLeaves || 0} color="warning" sublabel="Leave requests" onClick={() => navigate('/leaves')} />
        <StatCard icon={HiOutlineClipboardList} label="Open Tasks" value={overview?.pendingTasks || 0} color="info" onClick={() => navigate('/tasks')} />
        <StatCard icon={HiOutlineTrendingUp} label="Avg Performance" value={overview?.avgTeamRating || 'N/A'} color="purple" sublabel="out of 5.0" onClick={() => navigate('/performance')} />
        <StatCard icon={HiOutlineGift} label="Upcoming Birthdays" value={upcomingBirthdays?.length || 0} color="primary" sublabel="next 30 days" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Members */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Team Members</h3>
                <p className="text-xs text-secondary-500 mt-0.5">{teamSize + 1} total members</p>
              </div>
              <button onClick={() => navigate('/employees')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</button>
            </div>
            <div className="divide-y divide-gray-100">
              {teamMembers?.map(m => {
                const todayAtt = m.attendances?.[0];
                const statusColor = !todayAtt ? 'bg-gray-300' :
                  todayAtt.status === 'present' || todayAtt.status === 'late' ? 'bg-success-500' :
                  todayAtt.status === 'absent' ? 'bg-danger-500' : 'bg-warning-500';
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/employees/${m.id}`)}>
                    <div className="relative">
                      <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-secondary-500 truncate">{m.designation?.title || m.department?.name || '—'}</p>
                    </div>
                    <span className="text-xs text-secondary-400">{m.employeeId}</span>
                  </div>
                );
              })}
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-center text-sm text-secondary-500 py-8">No team members assigned yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <QuickAction icon={HiOutlinePlus} label="New Task" subtitle="Assign to team" onClick={() => navigate('/tasks')} color="primary" />
              <QuickAction icon={HiOutlineStar} label="Performance" subtitle="Conduct reviews" onClick={() => navigate('/performance')} color="purple" />
              <QuickAction icon={HiOutlinePaperAirplane} label="Leave Requests" subtitle="Approve/Reject" onClick={() => navigate('/leaves')} color="warning" />
              <QuickAction icon={HiOutlineCalendar} label="Attendance" subtitle="View records" onClick={() => navigate('/attendance')} color="info" />
              <QuickAction icon={HiOutlineChartBar} label="Team Reports" subtitle="View analytics" onClick={() => navigate('/reports')} color="success" />
              <QuickAction icon={HiOutlineClock} label="Timesheets" subtitle="Approve hours" onClick={() => navigate('/timesheets')} color="danger" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Attendance Pie */}
          {attendancePie.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-secondary-900 mb-1">Today's Attendance</h3>
              <p className="text-xs text-secondary-500 mb-4">Team presence overview</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePie}
                      cx="50%" cy="50%"
                      innerRadius={48} outerRadius={76}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={800}
                      animationBegin={100}
                    >
                      {attendancePie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-2">
                {attendancePie.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full ring-1 ring-white" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Birthdays */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                <HiOutlineGift className="w-4 h-4 text-pink-500" />
                Upcoming Birthdays
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingBirthdays?.length > 0 ? upcomingBirthdays.slice(0, 5).map(b => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {b.firstName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">{b.firstName} {b.lastName}</p>
                    <p className="text-xs text-secondary-500">{new Date(b.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span className="text-pink-500 text-xs">🎂</span>
                </div>
              )) : (
                <p className="text-center text-sm text-secondary-500 py-6">No upcoming birthdays</p>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
              <HiOutlineStar className="w-4 h-4 text-purple-500" />
              Performance Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Completed Reviews</span>
                <span className="text-sm font-semibold text-secondary-900">{overview?.completedReviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Average Rating</span>
                <span className="text-sm font-semibold text-purple-600">{overview?.avgTeamRating || 'N/A'} / 5.0</span>
              </div>
              <button onClick={() => navigate('/performance')} className="w-full mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium py-2 border-t border-gray-100">
                View Performance Reports →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
