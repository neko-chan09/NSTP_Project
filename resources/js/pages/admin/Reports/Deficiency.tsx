// src/pages/admin/Reports/Deficiency.tsx
import React, { useState } from 'react';
import { useDeficiencyReport } from '../../hooks/useReports';
import RefreshButton from '../../components/common/RefreshButton';
import toast from 'react-hot-toast';

interface DeficiencyStudent {
  id: number;
  student_id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  nstp_component_selected?: 'cwts' | 'rotc' | 'lts' | null;
  completed_training_hours: number;
  is_eligible_for_completion: boolean;
  completion_status: string;
  missing_documents?: string[];
  missing_hours?: number;
}

const DeficiencyReport: React.FC = () => {
  const { data: reportData, isLoading, error, refresh, isRefreshing } = useDeficiencyReport();
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Process data
  let allStudents: DeficiencyStudent[] = [];
  if (reportData) {
    if (Array.isArray(reportData)) {
      allStudents = reportData;
    } else if (reportData.students && Array.isArray(reportData.students)) {
      allStudents = reportData.students;
    } else if (reportData.data && Array.isArray(reportData.data)) {
      allStudents = reportData.data;
    }
  }

  // Apply filters
  const getFilteredStudents = () => {
    let filtered = allStudents;

    // Filter by component
    if (filter) {
      filtered = filtered.filter((s) => {
        const comp = s.nstp_component_selected || '';
        return comp.toLowerCase() === filter.toLowerCase();
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const name = `${s.user?.first_name || ''} ${s.user?.last_name || ''}`.toLowerCase();
        const id = s.student_id?.toLowerCase() || '';
        const email = s.user?.email?.toLowerCase() || '';
        return name.includes(search) || id.includes(search) || email.includes(search);
      });
    }

    return filtered;
  };

  const filteredStudents = getFilteredStudents();

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const getMissingHours = (student: DeficiencyStudent) => {
    const required = 90;
    const completed = student.completed_training_hours || 0;
    return Math.max(0, required - completed);
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'badge-warning',
      in_progress: 'badge-info',
      deficient: 'badge-danger',
      completed: 'badge-success',
    };
    return classes[status] || 'badge-secondary';
  };

  const exportCSV = () => {
    const headers = ['OCC ID', 'Name', 'Email', 'Component', 'Completed Hours', 'Required Hours', 'Missing Hours', 'Missing Documents', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.student_id,
      `${s.user?.first_name || ''} ${s.user?.last_name || ''}`,
      s.user?.email || '',
      s.nstp_component_selected?.toUpperCase() || 'Not assigned',
      s.completed_training_hours || 0,
      90,
      getMissingHours(s),
      s.missing_documents?.join(', ') || 'None',
      s.completion_status || 'Pending'
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deficiency_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading deficiency report...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Error: {(error as Error).message}</div>;
  }

  const totalDeficient = allStudents.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Deficiency Report</h2>
          <p className="text-sm text-slate-500">
            Total deficient students: <span className="font-semibold text-navy-900">{totalDeficient}</span>
            {filter && ` • Component: ${filter.toUpperCase()}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton onRefresh={refresh} isLoading={isRefreshing} label="" className="btn-sm" />
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <i className="fas fa-print" /> Print
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Deficient', value: totalDeficient, color: 'border-red-500' },
          { label: 'Missing Hours Only', value: allStudents.filter(s => getMissingHours(s) > 0 && !s.missing_documents?.length).length, color: 'border-amber-500' },
          { label: 'Missing Documents Only', value: allStudents.filter(s => s.missing_documents?.length && getMissingHours(s) === 0).length, color: 'border-blue-500' },
          { label: 'Both Missing', value: allStudents.filter(s => getMissingHours(s) > 0 && s.missing_documents?.length).length, color: 'border-red-500' },
        ].map((stat, index) => (
          <div key={index} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}>
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-2xl font-bold text-navy-900">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="search-box flex-1 min-w-[200px]">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button className="text-slate-400 hover:text-slate-600 px-2" onClick={() => setSearchTerm('')}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Components</option>
          <option value="cwts">CWTS</option>
          <option value="rotc">ROTC</option>
          <option value="lts">LTS</option>
        </select>
        <select
          className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <span className="text-sm text-slate-500 self-center">
          {filteredStudents.length} students found
        </span>
        {filteredStudents.length > 0 && (
          <button className="btn btn-primary btn-sm ml-auto" onClick={exportCSV}>
            <i className="fas fa-download" /> Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>OCC ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Component</th>
                <th>Completed Hours</th>
                <th>Required Hours</th>
                <th>Missing Hours</th>
                <th>Missing Documents</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10">
                    <i className="fas fa-check-circle text-gold-500 text-3xl block mb-3" />
                    <p className="text-slate-500">
                      {filter || searchTerm 
                        ? `No deficient students found matching your criteria` 
                        : 'All students are compliant! 🎉'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, index) => {
                  const missingHours = getMissingHours(student);
                  const globalIndex = startIndex + index + 1;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="text-xs text-slate-400 font-mono">{globalIndex}</td>
                      <td className="font-bold text-navy-900">{student.student_id}</td>
                      <td>{student.user?.first_name} {student.user?.last_name}</td>
                      <td className="text-sm text-slate-600">{student.user?.email || '-'}</td>
                      <td>
                        {student.nstp_component_selected ? (
                          <span className="badge badge-info">{student.nstp_component_selected.toUpperCase()}</span>
                        ) : (
                          <span className="text-sm text-slate-400">Not assigned</span>
                        )}
                      </td>
                      <td>{student.completed_training_hours || 0}</td>
                      <td>90</td>
                      <td>
                        {missingHours > 0 ? (
                          <span className="badge badge-danger">{missingHours} hrs</span>
                        ) : (
                          <span className="badge badge-success">✓ Complete</span>
                        )}
                      </td>
                      <td>
                        {student.missing_documents?.length ? (
                          <span className="badge badge-danger" title={student.missing_documents.join(', ')}>
                            {student.missing_documents.length} missing
                          </span>
                        ) : (
                          <span className="badge badge-success">✓ All submitted</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(student.completion_status)}`}>
                          {student.completion_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Showing {startIndex + 1} – {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </span>
          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <i className="fas fa-chevron-left" />
            </button>

            {/* First page */}
            {currentPage > 3 && (
              <>
                <button
                  className="px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  onClick={() => goToPage(1)}
                >
                  1
                </button>
                {currentPage > 4 && (
                  <span className="px-2 text-slate-400">...</span>
                )}
              </>
            )}

            {/* Page numbers */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  page === currentPage
                    ? 'bg-navy-600 text-white'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-2 text-slate-400">...</span>
                )}
                <button
                  className="px-3 py-1.5 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next button */}
            <button
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        </div>
      )}

      {/* Export all button */}
      {filteredStudents.length > 0 && (
        <div className="flex justify-end">
          <button className="btn btn-primary btn-sm" onClick={exportCSV}>
            <i className="fas fa-download" /> Export All ({filteredStudents.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default DeficiencyReport;