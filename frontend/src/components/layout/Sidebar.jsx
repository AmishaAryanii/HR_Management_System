import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { companyAPI } from "../../services/api";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineIdentification,
  HiOutlineCalendar,
  HiOutlinePaperAirplane,
  HiOutlineCash,
  HiOutlineClipboardList,
  HiOutlineBriefcase,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineSpeakerphone,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineChevronLeft,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineStar,
  HiOutlineClock,
} from "react-icons/hi";

const adminMenu = [
  { label: "Dashboard", path: "/dashboard", icon: HiOutlineHome },
  { label: "Employees", path: "/employees", icon: HiOutlineUsers },
  { label: "Departments", path: "/departments", icon: HiOutlineOfficeBuilding },
  {
    label: "Designations",
    path: "/designations",
    icon: HiOutlineIdentification,
  },
  { label: "Attendance", path: "/attendance", icon: HiOutlineCalendar },
  { label: "Leaves", path: "/leaves", icon: HiOutlinePaperAirplane },
  { label: "Payroll", path: "/payroll", icon: HiOutlineCash },
  { label: "Recruitment", path: "/recruitment", icon: HiOutlineBriefcase },
  { label: "Performance", path: "/performance", icon: HiOutlineStar },
  { label: "Tasks", path: "/tasks", icon: HiOutlineClipboardList },
  {
    label: "Announcements",
    path: "/announcements",
    icon: HiOutlineSpeakerphone,
  },
  { label: "Documents", path: "/documents", icon: HiOutlineDocumentText },
  { label: "Reports", path: "/reports", icon: HiOutlineChartBar },
  { label: "Settings", path: "/settings", icon: HiOutlineCog },
];

const managerMenu = [
  { label: "Dashboard", path: "/dashboard", icon: HiOutlineHome },
  { label: "Employees", path: "/employees", icon: HiOutlineUsers },
  { label: "Team Attendance", path: "/attendance", icon: HiOutlineCalendar },
  { label: "Team Leaves", path: "/leaves", icon: HiOutlinePaperAirplane },
  { label: "Team Performance", path: "/performance", icon: HiOutlineStar },
  { label: "Team Tasks", path: "/tasks", icon: HiOutlineClipboardList },
  {
    label: "Announcements",
    path: "/announcements",
    icon: HiOutlineSpeakerphone,
  },
  { label: "Timesheets", path: "/timesheets", icon: HiOutlineClock },
  { label: "Team Reports", path: "/reports", icon: HiOutlineChartBar },
];

const employeeMenu = [
  { label: "Dashboard", path: "/dashboard", icon: HiOutlineHome },
  { label: "Attendance", path: "/attendance", icon: HiOutlineCalendar },
  { label: "Leaves", path: "/leaves", icon: HiOutlinePaperAirplane },
  { label: "Payroll", path: "/payroll", icon: HiOutlineCash },
  { label: "Performance", path: "/performance", icon: HiOutlineStar },
  { label: "Tasks", path: "/tasks", icon: HiOutlineClipboardList },
  { label: "Timesheets", path: "/timesheets", icon: HiOutlineClock },
  {
    label: "Announcements",
    path: "/announcements",
    icon: HiOutlineSpeakerphone,
  },
  { label: "Documents", path: "/documents", icon: HiOutlineDocumentText },
];

export default function Sidebar() {
  const { user, userRole } = useAuth();
  const { sidebarOpen, mobileSidebarOpen, closeMobileSidebar } = useApp();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await companyAPI.get();
        setCompany(res.data.data);
      } catch {
        /* ignore */
      }
    };
    fetchCompany();
  }, []);

  const getMenuItems = () => {
    switch (userRole) {
      case "admin":
        return adminMenu;
      case "manager":
        return managerMenu;
      case "employee":
        return employeeMenu;
      default:
        return employeeMenu;
    }
  };

  const menuItems = getMenuItems();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-soft">
            <img
              src="/logo.svg"
              alt="Debox Technology Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {sidebarOpen && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-sm font-semibold text-secondary-900 truncate">
                {company?.companyName || "Debox Technology"}
              </p>

              <p className="text-xs text-secondary-400 truncate">
                {company?.email || ""}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={closeMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100/80 flex-shrink-0 transition-colors"
        >
          <HiOutlineX className="w-4 h-4 text-secondary-400" />
        </button>
      </div>

      {/* User info */}
      {sidebarOpen && (
        <div className="px-4 py-3.5 border-b border-gray-50">
          <p className="text-sm font-medium text-secondary-900 truncate">
            {user?.username || "User"}
          </p>
          <p className="text-xs text-secondary-400 capitalize">
            {userRole?.replace("_", " ")}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeMobileSidebar}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""} ${!sidebarOpen ? "justify-center px-2" : ""}`
            }
            title={!sidebarOpen ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-secondary-300">v1.0.0</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobileSidebar}
          />
          <aside className="relative w-64 h-full bg-white shadow-xl animate-slide-in-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
