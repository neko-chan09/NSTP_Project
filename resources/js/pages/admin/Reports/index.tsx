// src/pages/admin/Reports/index.tsx
import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";

const ReportsLayout: React.FC = () => {
    const location = useLocation();
    const isFacultyRoute = location.pathname.includes("/faculty");

    const basePath = isFacultyRoute ? "/faculty" : "/admin";

    return (
        <div className="space-y-5">
            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-wrap">
                <NavLink
                    to={`${basePath}/reports/enrollment`}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isActive
                                ? "bg-navy-600 text-white shadow-md"
                                : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
                        }`
                    }
                >
                    <i className="fas fa-users" />
                    Enrollment
                </NavLink>
                <NavLink
                    to={`${basePath}/reports/attendance`}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isActive
                                ? "bg-navy-600 text-white shadow-md"
                                : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
                        }`
                    }
                >
                    <i className="fas fa-calendar-check" />
                    Attendance
                </NavLink>
                <NavLink
                    to={`${basePath}/reports/deficiency`}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isActive
                                ? "bg-navy-600 text-white shadow-md"
                                : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
                        }`
                    }
                >
                    <i className="fas fa-exclamation-triangle" />
                    Deficiency
                </NavLink>
                <NavLink
                    to={`${basePath}/reports/accomplishment`}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isActive
                                ? "bg-gold-600 text-white shadow-md"
                                : "text-slate-500 hover:text-navy-700 hover:bg-slate-50"
                        }`
                    }
                >
                    <i className="fas fa-trophy" />
                    Accomplishment
                </NavLink>
            </div>
            <Outlet />
        </div>
    );
};

export default ReportsLayout;