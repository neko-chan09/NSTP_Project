// src/pages/admin/Activities/index.tsx

import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth"; // <-- ADD THIS IMPORT

const ActivitiesLayout: React.FC = () => {
  const location = useLocation();
  const { isAdmin, isSuperAdmin } = useAuth(); // <-- ADD THIS
  const isFacultyRoute = location.pathname.includes("/faculty");

  const basePath = isFacultyRoute ? "/faculty" : "/admin";

  const canViewLocationMonitor = isAdmin && !isSuperAdmin;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-wrap">
        <NavLink
          to={`${basePath}/activities`}
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isActive
              ? "bg-navy-600 text-white shadow-md"
              : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
            }`
          }
        >
          <i className="fas fa-tasks" />
          Activities
        </NavLink>
        <NavLink
          to={`${basePath}/activities/schedules`}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isActive
              ? "bg-navy-600 text-white shadow-md"
              : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
            }`
          }
        >
          <i className="fas fa-calendar-alt" />
          Schedules
        </NavLink>

        <NavLink
          to={`${basePath}/activities/map`}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${isActive
              ? "bg-gold-600 text-white shadow-md"
              : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
            }`
          }
        >
          <i className="fas fa-map-marked-alt" />
          Location Monitor
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
};

export default ActivitiesLayout;