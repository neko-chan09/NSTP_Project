// src/pages/admin/Reports/Enrollment.tsx
import React from 'react';
import { useEnrollmentReport } from '../../hooks/useReports';
import RefreshButton from '../../components/common/RefreshButton';

const EnrollmentReport: React.FC = () => {
  const { data, isLoading, error, refresh, isRefreshing } = useEnrollmentReport();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Failed to load report: {(error as Error).message}</div>;
  }

  const d = data;

  const getBarHeight = (count: number) => {
    const maxCount = Math.max(
      d?.cwts_male || 0, d?.cwts_female || 0,
      d?.rotc_male || 0, d?.rotc_female || 0,
      d?.lts_male || 0, d?.lts_female || 0, 1
    );
    return `${Math.max((count / maxCount) * 200, 20)}px`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-navy-900">Enrollment Summary Report</h2>
        <div className="flex gap-2">
          <RefreshButton onRefresh={refresh} isLoading={isRefreshing} label="" className="btn-sm" />
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <i className="fas fa-print" /> Print
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: d?.total || 0, color: 'border-navy-600' },
          { label: 'Male', value: d?.total_male || 0, color: 'border-blue-500' },
          { label: 'Female', value: d?.total_female || 0, color: 'border-pink-500' },
          { label: 'Unspecified', value: d?.total_unspecified || 0, color: 'border-slate-500' },
        ].map((stat, index) => (
          <div key={index} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}>
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-2xl font-bold text-navy-900">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Component Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'CWTS', value: d?.cwts || 0, color: 'border-blue-500' },
          { label: 'ROTC', value: d?.rotc || 0, color: 'border-red-500' },
          { label: 'LTS', value: d?.lts || 0, color: 'border-emerald-500' },
        ].map((stat, index) => (
          <div key={index} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}>
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-2xl font-bold text-navy-900">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <h4 className="text-lg font-semibold text-navy-900 mb-4">Distribution by Component & Gender</h4>
        <div className="flex justify-center items-end gap-12 h-[300px] pt-4">
          {['CWTS', 'ROTC', 'LTS'].map((label, idx) => {
            const maleKey = `${label.toLowerCase()}_male`;
            const femaleKey = `${label.toLowerCase()}_female`;
            const male = d?.[maleKey] || 0;
            const female = d?.[femaleKey] || 0;
            return (
              <div key={label} className="text-center">
                <div className="flex gap-2 items-end justify-center">
                  <div className="w-10 bg-blue-500 rounded-t transition-all duration-500 flex items-center justify-center text-white text-xs font-bold" style={{ height: getBarHeight(male) }}>
                    {male}
                  </div>
                  <div className="w-10 bg-pink-500 rounded-t transition-all duration-500 flex items-center justify-center text-white text-xs font-bold" style={{ height: getBarHeight(female) }}>
                    {female}
                  </div>
                </div>
                <p className="mt-3 font-semibold text-navy-900">{label}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            Male
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 bg-pink-500 rounded" />
            Female
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentReport;