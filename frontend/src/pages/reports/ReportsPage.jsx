import { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineBadgeCheck,
  HiOutlineCalendar, HiOutlineClipboardList, HiOutlineCash,
  HiOutlineTrendingUp, HiOutlineUserGroup, HiOutlineChartBar,
  HiOutlineRefresh, HiOutlineDownload
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  CHART_COLORS, PIE_COLORS,
  ModernTooltip, defaultTooltipFormatter
} from '../../utils/chartConfig';

const STAT_COLORS = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-600' },
  success: { bg: 'bg-success-100', text: 'text-success-600' },
  warning: { bg: 'bg-warning-100', text: 'text-warning-600' },
  danger: { bg: 'bg-danger-100', text: 'text-danger-600' },
  info: { bg: 'bg-info-100', text: 'text-info-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

function StatCard({ icon: Icon, label, value, color = 'primary', sublabel }) {
  const c = STAT_COLORS[color] || STAT_COLORS.primary;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.text}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-lg sm:text-2xl font-bold ${c.text}`}>{value}</p>
          <p className="text-xs sm:text-sm text-secondary-500 truncate">{label}</p>
          {sublabel && <p className="text-[10px] sm:text-xs text-secondary-400 mt-0.5 truncate">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-secondary-900">{title}</h3>
          {subtitle && <p className="text-xs text-secondary-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
        active ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-100 rounded-xl" />
        <div className="h-72 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// No longer needed — using ModernTooltip from chartConfig

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    employees: null,
    attendance: null,
    leaves: null,
    payroll: null,
    recruitment: null,
    performance: null,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiOutlineTrendingUp },
    { id: 'employees', label: 'Employees', icon: HiOutlineUsers },
    { id: 'attendance', label: 'Attendance', icon: HiOutlineCalendar },
    { id: 'leaves', label: 'Leaves', icon: HiOutlineClipboardList },
    { id: 'payroll', label: 'Payroll', icon: HiOutlineCash },
    { id: 'recruitment', label: 'Recruitment', icon: HiOutlineUserGroup },
    { id: 'performance', label: 'Performance', icon: HiOutlineChartBar },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, empRes, attRes, leaveRes, payrollRes, recruitRes, perfRes] = await Promise.allSettled([
        reportAPI.getOverview(),
        reportAPI.getEmployees(),
        reportAPI.getAttendance(),
        reportAPI.getLeaves(),
        reportAPI.getPayroll(),
        reportAPI.getRecruitment(),
        reportAPI.getPerformance(),
      ]);

      setData({
        overview: overviewRes.status === 'fulfilled' ? overviewRes.value.data.data : null,
        employees: empRes.status === 'fulfilled' ? empRes.value.data.data : null,
        attendance: attRes.status === 'fulfilled' ? attRes.value.data.data : null,
        leaves: leaveRes.status === 'fulfilled' ? leaveRes.value.data.data : null,
        payroll: payrollRes.status === 'fulfilled' ? payrollRes.value.data.data : null,
        recruitment: recruitRes.status === 'fulfilled' ? recruitRes.value.data.data : null,
        performance: perfRes.status === 'fulfilled' ? perfRes.value.data.data : null,
      });
    } catch {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = () => {
    try {
      const rows = [['Section', 'Metric', 'Value']];
      if (data.overview) {
        rows.push(['Overview', 'Total Employees', data.overview.employees?.total || 0]);
        rows.push(['Overview', 'Active Employees', data.overview.employees?.active || 0]);
        rows.push(['Overview', 'Departments', data.overview.departments?.total || 0]);
        rows.push(['Overview', 'Today Present', data.overview.attendance?.present || 0]);
        rows.push(['Overview', 'Pending Leaves', data.overview.leave?.pending || 0]);
      }
      if (data.employees?.byDepartment) {
        data.employees.byDepartment.forEach(d => {
          rows.push(['Employees by Department', d.department?.name || 'Unknown', parseInt(d.count)]);
        });
      }
      if (data.attendance?.summary) {
        rows.push(['Attendance', 'Present', data.attendance.summary.present]);
        rows.push(['Attendance', 'Absent', data.attendance.summary.absent]);
        rows.push(['Attendance', 'Late', data.attendance.summary.late]);
        rows.push(['Attendance', 'Total Hours', data.attendance.summary.totalWorkingHours]);
      }
      if (data.leaves?.totals) {
        rows.push(['Leaves', 'Approved', data.leaves.totals.approved]);
        rows.push(['Leaves', 'Pending', data.leaves.totals.pending]);
        rows.push(['Leaves', 'Rejected', data.leaves.totals.rejected]);
      }
      if (data.payroll?.totals) {
        rows.push(['Payroll', 'Gross Pay', data.payroll.totals.gross]);
        rows.push(['Payroll', 'Net Pay', data.payroll.totals.net]);
        rows.push(['Payroll', 'Deductions', data.payroll.totals.deductions]);
      }
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hrms-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported as CSV');
    } catch {
      toast.error('Failed to export report');
    }
  };

  if (loading) return <ReportsSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">Reports & Analytics</h1>
          <p className="text-sm text-secondary-500 mt-1">Comprehensive insights across your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="btn-secondary btn-sm">
            <HiOutlineRefresh className="w-4 h-4 mr-1.5" />
            Refresh
          </button>
          <button onClick={handleExport} className="btn-primary btn-sm">
            <HiOutlineDownload className="w-4 h-4 mr-1.5" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1.5 sm:gap-2 bg-white rounded-xl border border-gray-200 p-1.5 sm:p-2 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab data={data} />}
      {activeTab === 'employees' && <EmployeeTab data={data.employees} />}
      {activeTab === 'attendance' && <AttendanceTab data={data.attendance} />}
      {activeTab === 'leaves' && <LeavesTab data={data.leaves} />}
      {activeTab === 'payroll' && <PayrollTab data={data.payroll} />}
      {activeTab === 'recruitment' && <RecruitmentTab data={data.recruitment} />}
      {activeTab === 'performance' && <PerformanceTab data={data.performance} />}
    </div>
  );
}

function OverviewTab({ data }) {
  const { overview, employees, attendance, leaves, payroll, recruitment, performance } = data;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineUsers} label="Total Employees" value={overview?.employees?.total || 0} color="primary"
          sublabel={`${overview?.employees?.active || 0} active · ${overview?.employees?.terminated || 0} terminated`} />
        <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value={overview?.departments?.total || 0} color="success" />
        <StatCard icon={HiOutlineBadgeCheck} label="Today Present" value={overview?.attendance?.present || 0} color="info"
          sublabel={`${overview?.attendance?.absent || 0} absent · ${overview?.attendance?.onLeave || 0} on leave`} />
        <StatCard icon={HiOutlineCalendar} label="Pending Leaves" value={overview?.leave?.pending || 0} color="warning" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        {employees?.byDepartment && employees.byDepartment.length > 0 && (
          <ChartCard title="Employees by Department" subtitle="Distribution across departments">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employees.byDepartment.map(d => ({ name: d.department?.name || 'Unknown', count: parseInt(d.count) }))} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="reportsDeptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['primary-light']} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="url(#reportsDeptGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} animationBegin={100} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Monthly Hires */}
        {employees?.monthlyHires && employees.monthlyHires.length > 0 && (
          <ChartCard title="Monthly Hiring Trend" subtitle="New hires over time">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={employees.monthlyHires.map(h => ({ month: `${h.month}/${h.year}`, hires: parseInt(h.count) })).reverse()}>
                  <defs>
                    <linearGradient id="reportsHireGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Area type="monotone" dataKey="hires" stroke={CHART_COLORS.success} fill="url(#reportsHireGrad)" strokeWidth={2.5} dot={{ fill: CHART_COLORS.success, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} name="New Hires" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Leave Status */}
        {leaves?.byStatus && leaves.byStatus.length > 0 && (
          <ChartCard title="Leave Requests by Status" subtitle="Current year overview">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaves.byStatus.map(s => ({ name: s.status, value: parseInt(s.count) }))}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={88}
                    paddingAngle={4} dataKey="value"
                    animationDuration={800}
                  >
                    {leaves.byStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Payroll Summary */}
        {payroll && (
          <ChartCard title="Payroll Summary" subtitle={`Month ${payroll.month}/${payroll.year}`}>
            <div className="h-64 flex flex-col justify-center">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">₹{(payroll.totals?.gross || 0).toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Gross Pay</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-danger-600">₹{(payroll.totals?.deductions || 0).toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Deductions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">₹{(payroll.totals?.net || 0).toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Net Pay</p>
                </div>
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success-500" /> {payroll.status?.paid || 0} Paid
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-info-500" /> {payroll.status?.processed || 0} Processed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning-500" /> {payroll.status?.pending || 0} Pending
                </span>
              </div>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function EmployeeTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No employee data available</p>;

  const deptData = data.byDepartment?.map(d => ({ name: d.department?.name || 'Unknown', count: parseInt(d.count) })) || [];
  const desigData = data.byDesignation?.map(d => ({ name: d.designation?.title || 'Unknown', count: parseInt(d.count) })) || [];
  const statusData = data.byStatus?.map(s => ({ name: s.employmentStatus, value: parseInt(s.count) })) || [];
  const genderData = data.byGender?.map(g => ({ name: g.gender || 'Not Specified', value: parseInt(g.count) })) || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineUsers} label="Total" value={deptData.reduce((s, d) => s + d.count, 0)} color="primary" />
        <StatCard icon={HiOutlineBadgeCheck} label="Active" value={statusData.find(s => s.name === 'active')?.value || 0} color="success" />
        <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value={deptData.length} color="info" />
        <StatCard icon={HiOutlineChartBar} label="Designations" value={desigData.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Department */}
        {deptData.length > 0 && (
          <ChartCard title="Employees by Department" subtitle="Active employees grouped by department">
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <linearGradient id="empDeptGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['primary-light']} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="url(#empDeptGrad)" radius={[0, 6, 6, 0]} maxBarSize={32} animationDuration={800} animationBegin={100} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* By Designation */}
        {desigData.length > 0 && (
          <ChartCard title="Employees by Designation" subtitle="Active employees grouped by designation">
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={desigData} layout="vertical" barCategoryGap="20%">
                  <defs>
                    <linearGradient id="empDesigGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['info-light']} stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="url(#empDesigGrad)" radius={[0, 6, 6, 0]} maxBarSize={32} animationDuration={800} animationBegin={200} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* By Status */}
        {statusData.length > 0 && (
          <ChartCard title="Employment Status Breakdown" subtitle="All employees by status">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%" outerRadius={82}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    animationDuration={800}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* By Gender */}
        {genderData.length > 0 && (
          <ChartCard title="Gender Distribution" subtitle="Employee gender demographics">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                    paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    animationDuration={800}
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function AttendanceTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No attendance data available. Try selecting a different month.</p>;

  const { summary, dailyTrend } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineBadgeCheck} label="Present" value={summary?.present || 0} color="success" sublabel={`out of ${summary?.total || 0} total records`} />
        <StatCard icon={HiOutlineCalendar} label="Late" value={summary?.late || 0} color="warning" />
        <StatCard icon={HiOutlineUsers} label="Absent" value={summary?.absent || 0} color="danger" />
        <StatCard icon={HiOutlineTrendingUp} label="Working Hours" value={`${summary?.totalWorkingHours || 0}h`} color="info" sublabel={`${summary?.totalOvertime || 0} min overtime`} />
      </div>

      {dailyTrend && dailyTrend.length > 0 && (
        <ChartCard title="Daily Attendance Trend" subtitle={`Month ${data.month}/${data.year}`}>
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrend}>
                <defs>
                  <linearGradient id="attPresentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS['success-light']} stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="attAbsentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.danger} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS['danger-light']} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(val) => val.split('-')[2]} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} labelFormatter={(val) => `Date: ${val}`} cursor={{ fill: '#f9fafb' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" fill="url(#attPresentGrad)" radius={[4, 4, 0, 0]} maxBarSize={24} name="Present" stackId="a" animationDuration={800} />
                <Bar dataKey="absent" fill="url(#attAbsentGrad)" radius={[4, 4, 0, 0]} maxBarSize={24} name="Absent" stackId="a" animationDuration={800} animationBegin={150} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Summary Table */}
      {summary && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-secondary-900">Attendance Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-secondary-600">Metric</th>
                  <th className="text-center px-5 py-3 font-medium text-secondary-600">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-secondary-700">Present</td>
                  <td className="px-5 py-3 text-center font-medium text-success-600">{summary.present}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-secondary-700">Late</td>
                  <td className="px-5 py-3 text-center font-medium text-warning-600">{summary.late}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-secondary-700">Absent</td>
                  <td className="px-5 py-3 text-center font-medium text-danger-600">{summary.absent}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-secondary-700">On Leave</td>
                  <td className="px-5 py-3 text-center font-medium text-info-600">{summary.onLeave}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-secondary-700">Half Day</td>
                  <td className="px-5 py-3 text-center font-medium text-purple-600">{summary.halfDay}</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-secondary-700">Total Working Hours</td>
                  <td className="px-5 py-3 text-center font-bold text-primary-600">{summary.totalWorkingHours}h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LeavesTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No leave data available</p>;

  const { byStatus, byType, monthlyTrend, totals } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineBadgeCheck} label="Approved" value={totals?.approved || 0} color="success" />
        <StatCard icon={HiOutlineCalendar} label="Pending" value={totals?.pending || 0} color="warning" />
        <StatCard icon={HiOutlineUsers} label="Rejected" value={totals?.rejected || 0} color="danger" />
        <StatCard icon={HiOutlineChartBar} label="Total Requests" value={(totals?.approved || 0) + (totals?.pending || 0) + (totals?.rejected || 0)} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        {byStatus && byStatus.length > 0 && (
          <ChartCard title="Leave Requests by Status" subtitle="Current year">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus.map(s => ({ name: s.status, value: parseInt(s.count) }))}
                    cx="50%" cy="50%" outerRadius={82}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    animationDuration={800}
                  >
                    {byStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* By Type */}
        {byType && byType.length > 0 && (
          <ChartCard title="Leaves by Type" subtitle="Approved leaves by category">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType.map(t => ({ name: t.leaveType, count: parseInt(t.count) }))} barCategoryGap="25%">
                  <defs>
                    <linearGradient id="leaveTypeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['purple-light']} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="url(#leaveTypeGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} animationBegin={100} name="Leaves" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Monthly Trend */}
        {monthlyTrend && monthlyTrend.length > 0 && (
          <ChartCard title="Monthly Leave Trend" subtitle="Approved leaves per month">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend.map(m => ({ month: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month], leaves: parseInt(m.count) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Line type="monotone" dataKey="leaves" stroke={CHART_COLORS.warning} strokeWidth={2.5} dot={{ fill: CHART_COLORS.warning, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Leaves" animationDuration={1000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function PayrollTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No payroll data available</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={HiOutlineCash} label="Gross Pay" value={`₹${(data.totals?.gross || 0).toLocaleString()}`} color="primary" />
        <StatCard icon={HiOutlineTrendingUp} label="Deductions" value={`₹${(data.totals?.deductions || 0).toLocaleString()}`} color="danger" />
        <StatCard icon={HiOutlineBadgeCheck} label="Net Pay" value={`₹${(data.totals?.net || 0).toLocaleString()}`} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Payroll Status" subtitle={`Month ${data.month}/${data.year}`}>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: data.status?.paid || 0 },
                    { name: 'Processed', value: data.status?.processed || 0 },
                    { name: 'Pending', value: data.status?.pending || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={88}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  animationDuration={800}
                >
                  <Cell fill={CHART_COLORS.success} stroke="white" strokeWidth={2} />
                  <Cell fill={CHART_COLORS.info} stroke="white" strokeWidth={2} />
                  <Cell fill={CHART_COLORS.warning} stroke="white" strokeWidth={2} />
                </Pie>
                <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Payroll Breakdown" subtitle="Total vs Net comparison">
          <div className="h-52 sm:h-64 flex items-center justify-center">
            <div className="space-y-6 w-full max-w-xs">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">Gross Pay</span>
                  <span className="font-semibold text-primary-600">₹{(data.totals?.gross || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">Deductions</span>
                  <span className="font-semibold text-danger-600">₹{(data.totals?.deductions || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-danger-500 h-2.5 rounded-full" style={{ width: `${data.totals?.gross ? ((data.totals.deductions / data.totals.gross) * 100).toFixed(1) : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">Net Pay</span>
                  <span className="font-semibold text-success-600">₹{(data.totals?.net || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-success-500 h-2.5 rounded-full" style={{ width: `${data.totals?.gross ? ((data.totals.net / data.totals.gross) * 100).toFixed(1) : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-secondary-900">Payroll Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-secondary-600">Metric</th>
                <th className="text-right px-5 py-3 font-medium text-secondary-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-5 py-3 text-secondary-700">Total Gross Pay</td>
                <td className="px-5 py-3 text-right font-medium text-primary-600">₹{(data.totals?.gross || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-5 py-3 text-secondary-700">Total Deductions</td>
                <td className="px-5 py-3 text-right font-medium text-danger-600">₹{(data.totals?.deductions || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-5 py-3 text-secondary-700">Total Net Pay</td>
                <td className="px-5 py-3 text-right font-medium text-success-600">₹{(data.totals?.net || 0).toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-50 bg-gray-50/50">
                <td className="px-5 py-3 font-medium text-secondary-700">Employees Paid</td>
                <td className="px-5 py-3 text-right font-bold text-success-600">{data.status?.paid || 0} / {data.status?.total || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RecruitmentTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No recruitment data available</p>;

  const { jobs, candidates } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineUserGroup} label="Total Jobs" value={jobs?.total || 0} color="primary" />
        <StatCard icon={HiOutlineBadgeCheck} label="Open Positions" value={jobs?.open || 0} color="success" />
        <StatCard icon={HiOutlineUsers} label="Candidates" value={candidates?.total || 0} color="info" />
        <StatCard icon={HiOutlineCalendar} label="Draft Jobs" value={jobs?.draft || 0} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs */}
        {jobs && (
          <ChartCard title="Jobs Overview" subtitle="Current job openings status">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Open', value: jobs.open || 0 },
                      { name: 'Draft', value: jobs.draft || 0 },
                      { name: 'Closed', value: jobs.closed || 0 },
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                    paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    animationDuration={800}
                  >
                    <Cell fill={CHART_COLORS.success} stroke="white" strokeWidth={2} />
                    <Cell fill={CHART_COLORS.warning} stroke="white" strokeWidth={2} />
                    <Cell fill={CHART_COLORS.danger} stroke="white" strokeWidth={2} />
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Candidates by Status */}
        {candidates?.byStatus && candidates.byStatus.length > 0 && (
          <ChartCard title="Candidates by Status" subtitle="Applicant pipeline">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={candidates.byStatus.map(c => ({ name: c.status, count: parseInt(c.count) }))} barCategoryGap="25%">
                  <defs>
                    <linearGradient id="recruitCandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['primary-light']} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="url(#recruitCandGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={800} animationBegin={100} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ data }) {
  if (!data) return <p className="text-center text-secondary-500 py-12">No performance data available</p>;

  const { totals, averageRating, byRating, byType } = data;

  // Ensure byRating has values 1-5 even if some are missing
  const ratingData = [1, 2, 3, 4, 5].map(r => ({
    rating: `${r} Star${r > 1 ? 's' : ''}`,
    count: parseInt(byRating?.find(br => parseInt(br.overallRating) === r)?.count || 0)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineChartBar} label="Total Reviews" value={totals?.total || 0} color="primary" />
        <StatCard icon={HiOutlineBadgeCheck} label="Completed" value={totals?.completed || 0} color="success" />
        <StatCard icon={HiOutlineCalendar} label="Pending" value={totals?.pending || 0} color="warning" />
        <StatCard icon={HiOutlineTrendingUp} label="Avg Rating" value={averageRating || '0.0'} color="purple" sublabel="out of 5.0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        {ratingData.some(r => r.count > 0) && (
          <ChartCard title="Rating Distribution" subtitle="Performance review ratings">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData} barCategoryGap="25%">
                  <defs>
                    <linearGradient id="perfRatingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={CHART_COLORS['purple-light']} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={800} animationBegin={100} name="Reviews">
                    {ratingData.map((entry, i) => (
                      <Cell key={i} fill={entry.count > 3 ? CHART_COLORS.success : entry.count > 0 ? CHART_COLORS.warning : CHART_COLORS.danger} stroke="white" strokeWidth={1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* By Review Type */}
        {byType && byType.length > 0 && (
          <ChartCard title="Reviews by Type" subtitle="Performance review types">
            <div className="h-52 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byType.map(t => ({ name: t.reviewType, value: parseInt(t.count) }))}
                    cx="50%" cy="50%" outerRadius={82}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    animationDuration={800}
                  >
                    {byType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<ModernTooltip formatter={defaultTooltipFormatter} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
