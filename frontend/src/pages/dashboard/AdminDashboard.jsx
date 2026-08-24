import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineCalendar, HiOutlinePaperAirplane } from 'react-icons/hi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try { const res = await dashboardAPI.getAdmin(); setData(res.data.data); }
      catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSkeleton count={4} />;

  if (!data) {
    return (
      <div>
        <div className="page-header"><div><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">Employee and department overview</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={HiOutlineUsers} label="Active Employees" value="--" color="primary" />
          <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value="--" color="success" />
          <StatCard icon={HiOutlineCalendar} label="Today Present" value="--" color="info" />
          <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value="--" color="warning" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">Employee and department overview</p></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard icon={HiOutlineUsers} label="Active Employees" value={data.overview?.totalEmployees} color="primary" />
        <StatCard icon={HiOutlineOfficeBuilding} label="Departments" value={data.overview?.totalDepartments} color="success" />
        <StatCard icon={HiOutlineCalendar} label="Today Present" value={data.attendance?.present} color="info" />
        <StatCard icon={HiOutlinePaperAirplane} label="Pending Leaves" value={data.leave?.pending} color="warning" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
          <div className="flex items-center gap-6">
            <div className="text-center"><p className="text-3xl font-bold text-success-600">{data.attendance?.present || 0}</p><p className="text-sm text-secondary-500">Present</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-danger-600">{data.attendance?.absent || 0}</p><p className="text-sm text-secondary-500">Absent</p></div>
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
