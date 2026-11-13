// src/components/layouts/AdminLayout.tsx
import React from "react";
import NotificationInbox from '../common/NotificationInbox';
import ProfileAvatar from '../common/ProfileAvatar';
import { Outlet, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { useAuth } from "../../hooks/useAuth";

const AdminLayoutInner: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { collapsed, toggle, isMobile, isHovered } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      faculty: "Faculty",
      student: "Student",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-600",
      admin: "bg-blue-600",
      faculty: "bg-amber-500",
      student: "bg-emerald-500",
    };
    return colors[role] || "bg-slate-500";
  };

  // Determine if sidebar is expanded (for main content margin)
  const isExpanded = isMobile ? !collapsed : !collapsed || isHovered;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed}
        toggleSidebar={toggle}
        isMobile={isMobile}
      />

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={toggle} />
      )}

      <main
        className={`flex-1 bg-slate-50 min-h-screen flex flex-col transition-all duration-300 ${
          isExpanded ? "ml-[280px]" : "ml-[72px]"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg bg-gold-50 text-navy-600 hover:bg-gold-100 transition-colors flex items-center justify-center"
              >
                <i className="fas fa-bars text-lg" />
              </button>
            )}
            <h2 className="text-lg font-bold text-navy-900">NSTP Dashboard</h2>
            {/* Show hover indicator when sidebar is collapsed and hovered */}
            {!isMobile && collapsed && isHovered && (
              <span className="text-xs text-gold-500 animate-pulse ml-2">
                <i className="fas fa-chevron-right mr-1" />
                Sidebar expanded
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <NotificationInbox />
            <Link
  to={
    user?.role === "faculty"
      ? "/faculty/profile"
      : "/admin/profile"
  }
  className="flex items-center gap-2 font-medium text-navy-700 hover:text-gold-600 transition-colors"
>
  <ProfileAvatar src={user?.profile_photo_url} firstName={user?.first_name || user?.name} lastName={user?.last_name} className="w-8 h-8 text-xs" />
  <span className="hidden md:inline">{user?.name || "User"}</span>
  <span
    className={`${getRoleColor(user?.role || "admin")} text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider`}
  >
    {getRoleLabel(user?.role || "admin")}
  </span>
</Link>
            <span className="hidden md:inline-block w-px h-6 bg-slate-200" />
            <span className="hidden md:inline-block text-slate-500 text-xs bg-slate-100 px-3 py-1 rounded">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="hidden md:inline-block text-slate-500 text-xs bg-slate-100 px-3 py-1 rounded font-mono">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-7 flex-1">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
};

const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
};

export default AdminLayout;