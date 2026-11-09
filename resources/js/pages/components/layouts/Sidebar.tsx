// src/components/layouts/Sidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "./SidebarContext";
import NstpLogo from "../../components/common/NstpLogo";

interface MenuItem {
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
  badge?: number | string;
  badgeType?: "default" | "danger" | "new";
  roles?: string[];
}

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  toggleSidebar,
  isMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isHovered, setIsHovered } = useSidebar();
  const userRole = user?.role || "admin";
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const path = location.pathname;
    return {
      students:
        path.startsWith("/admin/students") ||
        path.startsWith("/faculty/students") ||
        path.startsWith("/admin/classes") ||
        path.startsWith("/faculty/classes") ||
        path.startsWith("/admin/attendance/create") ||
        path.startsWith("/faculty/attendance/create"),
      activities:
        path.startsWith("/admin/activities") ||
        path.startsWith("/faculty/activities"),
      documents: path.startsWith("/admin/documents"),
      certificates: path.startsWith("/admin/certificates"),
      reports: path.startsWith("/admin/reports"),
      usermanagement: path.startsWith("/admin/superadmin"),
    };
  });

  useEffect(() => {
    const path = location.pathname;
    setOpenMenus((prev) => ({
      ...prev,
      students:
        path.startsWith("/admin/students") ||
        path.startsWith("/faculty/students") ||
        path.startsWith("/admin/classes") ||
        path.startsWith("/faculty/classes") ||
        path.startsWith("/admin/attendance/create") ||
        path.startsWith("/faculty/attendance/create"),
      activities:
        path.startsWith("/admin/activities") ||
        path.startsWith("/faculty/activities"),
      documents: path.startsWith("/admin/documents"),
      certificates: path.startsWith("/admin/certificates"),
      reports: path.startsWith("/admin/reports"),
      usermanagement: path.startsWith("/admin/superadmin"),
    }));
  }, [location.pathname]);

  // Handle hover expand/collapse
  useEffect(() => {
    if (isMobile || !collapsed) return;

    const handleMouseEnter = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      hideTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 200);
    };

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener("mouseenter", handleMouseEnter);
      sidebar.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener("mouseenter", handleMouseEnter);
        sidebar.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (hideTimeoutRef.current) {
        if (hideTimeoutRef.current !== null) {
          window.clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        hideTimeoutRef.current = null;
      }
    };
  }, [isMobile, collapsed, setIsHovered]);

  // Clean up hover state when collapsed changes
  useEffect(() => {
    if (!collapsed) {
      setIsHovered(false);
    }
  }, [collapsed, setIsHovered]);

  const toggleMenu = (key: string) => {
    if (collapsed && !isHovered && !isMobile) return;
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAccess = (item: MenuItem): boolean => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  };

  const isPathActive = (path: string) => {
    if (!path) return false;
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  // Determine if sidebar should be expanded (visible)
  const isExpanded = isMobile ? !collapsed : !collapsed || isHovered;

  // ============================================================
  // MENU ITEMS
  // ============================================================
  const menuItems: MenuItem[] = [
    // -------- Dashboard (everyone) --------
    {
      label: "Dashboard",
      icon: "fa-chart-pie",
      path: userRole === "faculty" ? "/faculty" : "/admin",
      roles: ["super_admin", "admin", "faculty"],
    },

    // -------- My Profile (everyone) --------
    {
      label: "My Profile",
      icon: "fa-user-circle",
      path: userRole === "faculty" ? "/faculty/profile" : "/admin/profile",
      roles: ["super_admin", "admin", "faculty"],
    },

    // -------- User Management (Super Admin only) --------
    {
      label: "User Management",
      icon: "fa-user-cog",
      path: "/admin/superadmin",
      roles: ["super_admin"],
    },

    // -------- System Backups (Super Admin only) --------
    {
      label: "System Backups",
      icon: "fa-database",
      roles: ["super_admin"],
      children: [
        {
          label: "Manual Backups",
          icon: "fa-database",
          path: "/admin/superadmin/backups",
          roles: ["super_admin"],
        },
        {
          label: "Scheduled Backups",
          icon: "fa-clock",
          path: "/admin/superadmin/backup-schedules",
          roles: ["super_admin"],
        },
      ],
    },

    // -------- Students --------
    {
      label: "Students",
      icon: "fa-users",
      roles: ["super_admin", "admin", "faculty"],
      children: [
        {
          label: "All Students",
          icon: "fa-user-graduate",
          path:
            userRole === "faculty"
              ? "/faculty/students"
              : "/admin/students",
          roles: ["super_admin", "admin", "faculty"],
        },
        {
          label: "Component Selection",
          icon: "fa-check-square",
          path: "/admin/students/component",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Change Requests",
          icon: "fa-sync-alt",
          path: "/admin/students/requests",
          badge: 3,
          badgeType: "danger",
          roles: ["super_admin"],
        },
        {
          label: "Classes",
          icon: "fa-chalkboard-teacher",
          path: "/admin/classes",
          roles: ["super_admin", "admin"],
        },
        {
          label: "My Classes",
          icon: "fa-chalkboard-teacher",
          path: "/faculty/classes",
          roles: ["faculty"],
        },
        // {
        //   label: "Learning Materials",
        //   icon: "fa-folder-open",
        //   path: "/faculty/materials",
        //   roles: ["faculty"],
        // },
        {
          label: "New Attendance Session",
          icon: "fa-plus-circle",
          path:
            userRole === "faculty"
              ? "/faculty/attendance/create"
              : "/admin/attendance/create",
          roles: ["faculty", "super_admin"],
        },
      ],
    },

    // -------- Activities & Schedules (everyone) --------
    {
      label: "Activities & Schedules",
      icon: "fa-calendar-plus",
      roles: ["super_admin", "admin", "faculty"],
      children: [
        {
          label: "Activities",
          icon: "fa-tasks",
          path:
            userRole === "faculty"
              ? "/faculty/activities"
              : "/admin/activities",
          roles: ["super_admin", "admin", "faculty"],
        },
        {
          label: "Location Monitor",
          icon: "fa-map-marked-alt",
          path:
            userRole === "faculty"
              ? "/faculty/activities/map"
              : "/admin/activities/map",
          roles: ["super_admin", "admin", "faculty"],
        },
        {
          label: "Schedules",
          icon: "fa-calendar-alt",
          path:
            userRole === "faculty"
              ? "/faculty/activities/schedules"
              : "/admin/activities/schedules",
          roles: ["super_admin", "admin", "faculty"],
        },
      ],
    },

    // -------- Documents (Super Admin & Admin) --------
    {
      label: "Documents",
      icon: "fa-file-alt",
      roles: ["super_admin", "admin"],
      children: [
        {
          label: "Student Submissions",
          icon: "fa-file-upload",
          path: "/admin/documents/submissions",
          badge: 12,
          badgeType: "danger",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Office Library",
          icon: "fa-folder-open",
          path: "/admin/documents/library",
          badge: "NEW",
          badgeType: "new",
          roles: ["super_admin", "admin"],
        },
      ],
    },

    // -------- Certificates (Super Admin & Admin) --------
    {
      label: "Certificates",
      icon: "fa-award",
      roles: ["super_admin", "admin"],
      children: [
        {
          label: "Generate",
          icon: "fa-file-pdf",
          path: "/admin/certificates/generate",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Certificate Designer",
          icon: "fa-palette",
          path: "/admin/certificates/designer",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Issued Certificates",
          icon: "fa-download",
          path: "/admin/certificates/issued",
          roles: ["super_admin", "admin"],
        },
      ],
    },

    // -------- Bulletin Board (everyone) --------
    {
      label: "Bulletin Board",
      icon: "fa-bullhorn",
      path:
        userRole === "faculty"
          ? "/faculty/bulletin"
          : "/admin/bulletin",
      roles: ["super_admin", "admin", "faculty"],
    },

    // -------- Reports (Super Admin & Admin) --------
    {
      label: "Reports",
      icon: "fa-chart-bar",
      roles: ["super_admin", "admin"],
      children: [
        {
          label: "Enrollment Summary",
          icon: "fa-chart-pie",
          path: "/admin/reports/enrollment",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Attendance Report",
          icon: "fa-chart-line",
          path: "/admin/reports/attendance",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Deficiency Report",
          icon: "fa-exclamation-triangle",
          path: "/admin/reports/deficiency",
          roles: ["super_admin", "admin"],
        },
        {
          label: "Accomplishment Report",
          icon: "fa-trophy",
          path: "/admin/reports/accomplishment",
          roles: ["super_admin", "admin"],
        },
      ],
    },
  ];

  const getFilteredMenuItems = (): MenuItem[] => {
    return menuItems.filter((item) => {
      if (!hasAccess(item)) return false;
      if (item.children) {
        const accessibleChildren = item.children.filter((child) => {
          if (!child.roles) return true;
          return child.roles.includes(userRole);
        });
        if (accessibleChildren.length === 0) return false;
        item.children = accessibleChildren;
      }
      return true;
    });
  };

  const filteredMenuItems = getFilteredMenuItems();

  const renderMenuItem = (item: MenuItem) => {
    if (item.children) {
      const key = item.label.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isOpen = openMenus[key] || false;
      const parentActive = item.children.some((child) =>
        isPathActive(child.path || ""),
      );

      const shouldBeOpen = item.children.some((child) =>
        isPathActive(child.path || ""),
      );
      if (shouldBeOpen && !isOpen) {
        setTimeout(() => {
          setOpenMenus((prev) => ({ ...prev, [key]: true }));
        }, 0);
      }

      return (
        <div key={item.label} className="mb-0.5">
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              parentActive
                ? "text-gold-500 bg-gold-500/10"
                : "text-slate-400 hover:text-white hover:bg-gold-500/5"
            } ${!isExpanded ? "justify-center px-2" : ""}`}
            onClick={() => toggleMenu(key)}
            title={!isExpanded ? item.label : undefined}
          >
            <span
              className={`${
                parentActive ? "text-gold-500" : "text-slate-500"
              } text-base min-w-[20px] text-center`}
            >
              <i className={`fas ${item.icon}`} />
            </span>
            {isExpanded && (
              <span className="flex-1 text-left">{item.label}</span>
            )}
            {isExpanded && (
              <span
                className={`text-xs transition-transform duration-300 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                <i className="fas fa-chevron-right" />
              </span>
            )}
            {!isExpanded && (
              <span className="w-5 h-5 rounded-full bg-gold-500 text-navy-900 text-[9px] font-bold flex items-center justify-center">
                {item.children.length}
              </span>
            )}
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pl-4 space-y-0.5">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path || "#"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive || isPathActive(child.path || "")
                        ? "text-gold-500 bg-gold-500/10 font-medium"
                        : "text-slate-400 hover:text-white hover:bg-gold-500/5"
                    }`
                  }
                  onClick={() => {
                    if (!isExpanded && isMobile) toggleSidebar();
                  }}
                  title={!isExpanded ? child.label : undefined}
                >
                  <span
                    className={`text-sm min-w-[18px] text-center ${
                      isPathActive(child.path || "")
                        ? "text-gold-500"
                        : "text-slate-500"
                    }`}
                  >
                    <i className={`fas ${child.icon}`} />
                  </span>
                  {isExpanded && <span>{child.label}</span>}
                  {isExpanded && child.badge && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
                        child.badgeType === "danger"
                          ? "bg-red-500/20 text-red-400"
                          : child.badgeType === "new"
                            ? "bg-gold-500 text-navy-900"
                            : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {child.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path || "#"}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive || isPathActive(item.path || "")
              ? "text-gold-500 bg-gold-500/10"
              : "text-slate-400 hover:text-white hover:bg-gold-500/5"
          } ${!isExpanded ? "justify-center px-2" : ""}`
        }
        title={!isExpanded ? item.label : undefined}
        onClick={() => {
          if (!isExpanded && isMobile) toggleSidebar();
        }}
      >
        <span className="text-base min-w-[20px] text-center">
          <i className={`fas ${item.icon}`} />
        </span>
        {isExpanded && <span>{item.label}</span>}
        {isExpanded && item.badge && (
          <span
            className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
              item.badgeType === "danger"
                ? "bg-red-500/20 text-red-400"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    if (user?.name) {
      return user.name.charAt(0);
    }
    return "A";
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.name || "Admin User";
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

  // Split menu items into sections
  const mainItems = filteredMenuItems.filter((item) =>
    ["Dashboard", "My Profile", "User Management", "System Backups"].includes(
      item.label,
    ),
  );
  const managementItems = filteredMenuItems.filter((item) =>
    [
      "Students",
      "Activities & Schedules",
      "Documents",
      "Certificates",
    ].includes(item.label),
  );
  const toolsItems = filteredMenuItems.filter((item) =>
    ["Bulletin Board", "Reports", "Settings"].includes(item.label),
  );

  const getSidebarWidth = () => {
    if (isMobile) {
      return isExpanded ? "w-[280px]" : "w-[72px]";
    }
    return isExpanded ? "w-[280px]" : "w-[72px]";
  };

  return (
    <aside
      ref={sidebarRef}
      className={`fixed top-0 left-0 h-full bg-gradient-to-b from-navy-700 via-navy-800 to-navy-900 border-r border-gold-500/10 shadow-2xl transition-all duration-300 z-50 flex flex-col ${getSidebarWidth()} ${
        isMobile && isExpanded ? "shadow-2xl" : ""
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gold-500/10 min-h-[72px] bg-black/20">
        <div
          className={`flex items-center gap-3 ${
            !isExpanded ? "justify-center w-full" : ""
          }`}
        >
          <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 p-0.5">
            <NstpLogo size={40} className="w-full h-full rounded-md" />
          </div>
          {isExpanded && (
            <div>
              <h1 className="text-lg font-bold text-gold-500 leading-tight">
                NSTP Office
              </h1>
              <p className="text-[9px] text-white/30 uppercase tracking-[2px] font-medium">
                Management System
              </p>
            </div>
          )}
        </div>
        {(isMobile || isExpanded) && (
          <button
            onClick={toggleSidebar}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <i
              className={`fas ${
                isExpanded ? "fa-chevron-left" : "fa-chevron-right"
              } text-sm`}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 scrollbar-none overflow-y-auto overflow-x-hidden px-2 py-4">
        {mainItems.length > 0 && (
          <div className="mb-5">
            <div
              className={`text-[9px] font-bold uppercase tracking-[1.8px] text-white/25 px-3 pb-2 ${
                !isExpanded ? "text-center" : ""
              }`}
            >
              {isExpanded ? "Main" : "•"}
            </div>
            {mainItems.map(renderMenuItem)}
          </div>
        )}

        {managementItems.length > 0 && (
          <div className="mb-5">
            <div
              className={`text-[9px] font-bold uppercase tracking-[1.8px] text-white/25 px-3 pb-2 ${
                !isExpanded ? "text-center" : ""
              }`}
            >
              {isExpanded ? "Management" : "•"}
            </div>
            {managementItems.map(renderMenuItem)}
          </div>
        )}

        {toolsItems.length > 0 && (
          <div className="mb-5">
            <div
              className={`text-[9px] font-bold uppercase tracking-[1.8px] text-white/25 px-3 pb-2 ${
                !isExpanded ? "text-center" : "•"
              }`}
            >
              {isExpanded ? "Tools" : "•"}
            </div>
            {toolsItems.map(renderMenuItem)}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gold-500/10 p-3 bg-black/20">
        <div
          className={`flex items-center gap-3 ${
            !isExpanded ? "flex-col" : ""
          }`}
        >
          <div className="relative flex-shrink-0">
            {user?.profile_photo_url ? (
              <img
                src={user.profile_photo_url}
                alt={getUserDisplayName()}
                className="w-9 h-9 rounded-lg object-cover border border-white/20 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className={`${getRoleColor(userRole)} w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg`}
              >
                {getUserInitials()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-navy-700 shadow-lg shadow-emerald-400/30" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {getUserDisplayName()}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/30 truncate">
                <span>{user?.email || "admin@nstp.com"}</span>
                <span
                  className={`${getRoleColor(userRole)} text-[8px] font-bold text-white px-1.5 py-0.5 rounded`}
                >
                  {getRoleLabel(userRole)}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`${
              !isExpanded ? "w-full" : ""
            } p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all`}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;