import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineCash, HiOutlineCalendar, HiOutlinePaperAirplane, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineClipboardList } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ModernTooltip, CHART_COLORS, defaultTooltipFormatter } from '../../utils/chartConfig';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardAPI.getSuperAdmin();
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  if (error || !data) {
    return (
      <div>
        <div className="page-header"><div><h1 className="page-title">Super Admin Dashboard</h1><p className="page-subtitle">Full system overview and analytics</p></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard icon={HiOutlineUsers} label="Total Employees" value="--" color="primary" />
          <StatCard icon={HiOutlineOfficeBuilding} label="Total Departments" value="--" color="success" />
          <StatCard icon={HiOutlineShieldCheck} label="Admins" value="--" color="info" />
          <StatCard icon={HiOutlineUserGroup} label="Managers" value="--" color="warning" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard icon={HiOutlineCalendar} label="Today Present" value="--" color="primary" />
          <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value="--" color="warning" />
          <StatCard icon={HiOutlineCash} label="Payroll This Month" value="--" color="success" />
          <StatCard icon={HiOutlineClipboardList} label="Active Employees" value="--" color="info" />
        </div>
        <div className="card p-8 mt-8 text-center text-secondary-500">
          Connect to the backend API to view live dashboard data and charts.
        </div>
      </div>
    );
  }

  const { overview, attendance, leave, payroll, charts } = data;
  const deptData = charts?.departmentDistribution?.map(d => ({ name: d.department?.name || 'Unknown', count: parseInt(d.count) })) || [];
  const monthlyData = charts?.monthlyHires?.slice(0, 6).reverse().map(h => ({ month: `${h.month}/${h.year}`, hires: parseInt(h.count) })) || [];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Super Admin Dashboard</h1><p className="page-subtitle">Full system overview and analytics</p></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard icon={HiOutlineUsers} label="Total Employees" value={overview?.totalEmployees} color="primary" />
        <StatCard icon={HiOutlineOfficeBuilding} label="Total Departments" value={charts?.departmentDistribution?.length || 0} color="success" />
        <StatCard icon={HiOutlineShieldCheck} label="Admins" value={overview?.totalAdmins} color="info" />
        <StatCard icon={HiOutlineUserGroup} label="Managers" value={overview?.totalManagers} color="warning" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard icon={HiOutlineCalendar} label="Today Present" value={attendance?.todayPresent} color="primary" />
        <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value={leave?.pending} color="warning" />
        <StatCard icon={HiOutlineCash} label={`Payroll $${parseFloat(payroll?.totalNetPay || 0).toLocaleString()}`} value="This Month" color="success" subtitle={`${payroll?.paid || 0} paid, ${payroll?.processed || 0} processed`} />
        <StatCard icon={HiOutlineClipboardList} label="Active Employees" value={overview?.activeEmployees} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Department Distribution */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1">Department Distribution</h3>
          <p className="text-xs text-secondary-500 mb-4">Employees by department</p>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="deptBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS['primary-light']} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="count" fill="url(#deptBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} animationBegin={100} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-secondary-500 text-center py-12">No department data</p>}
        </div>

        {/* Monthly Hires */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1">Monthly Hires</h3>
          <p className="text-xs text-secondary-500 mb-4">New hires over time</p>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barCategoryGap="25%">
                <defs>
                  <linearGradient id="hireBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS['success-light']} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="hires" fill="url(#hireBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-secondary-500 text-center py-12">No hire data yet</p>}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recent Activities</h3>
        {data.recentActivities?.length > 0 ? (
          <div className="space-y-3">
            {data.recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                <div>
                  <p className="text-secondary-700">{a.description}</p>
                  <p className="text-secondary-400 text-xs">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-secondary-500 text-center py-4">No recent activities</p>}
      </div>
    </div>
  );
}
