import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { notificationAPI, companyAPI } from '../../services/api';
import NotificationBell from '../notifications/NotificationBell';
import { HiOutlineMenu, HiOutlineUser, HiOutlineLogout, HiOutlineCog, HiOutlineKey } from 'react-icons/hi';

export default function Navbar() {
  const { user, employee, logout } = useAuth();
  const { toggleSidebar, toggleMobileSidebar, unreadCount, setUnreadCount } = useApp();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await companyAPI.get();
        setCompany(res.data.data);
      } catch { /* ignore */ }
    };
    fetchCompany();
  }, []);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await notificationAPI.getAll({ limit: 1 });
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Toggle sidebar"
        >
          <HiOutlineMenu className="w-5 h-5 text-secondary-600" />
        </button>
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiOutlineMenu className="w-5 h-5 text-secondary-600" />
        </button>          <div className="hidden md:flex items-center gap-2 text-sm text-secondary-500">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            <span className="truncate max-w-[120px] lg:max-w-[200px]">{company?.companyName || 'HRMS'}</span>
          </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell onViewAll={() => navigate('/notifications')} />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm overflow-hidden">
              {employee?.profilePhoto ? (
                <img src={employee.profilePhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-100 text-primary-700 flex items-center justify-center">
                  {employee?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-secondary-900">
                {employee?.firstName} {employee?.lastName}
              </p>
              <p className="text-xs text-secondary-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 animate-slide-down">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-secondary-900">{user?.email}</p>
                <p className="text-xs text-secondary-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { if (employee?.id) navigate(`/employees/${employee.id}`); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-secondary-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <HiOutlineUser className="w-4 h-4" /> My Profile
                </button>
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-secondary-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <HiOutlineCog className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-sm text-secondary-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <HiOutlineKey className="w-4 h-4" /> Change Password
                </button>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-3"
                >
                  <HiOutlineLogout className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
