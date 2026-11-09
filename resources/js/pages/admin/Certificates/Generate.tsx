// src/pages/admin/Certificates/Generate.tsx
import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { designerApi } from './designerApi';
import type { CertificateType } from './designerModel';
import { useStudents } from '../../hooks/useStudents';
import { useBatchGenerateCertificates } from '../../hooks/useCertificates';
import RefreshButton from '../../components/common/RefreshButton';
import toast from 'react-hot-toast';

const GenerateCertificate: React.FC = () => {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [params] = useSearchParams();
  const requestedType = params.get('design');
  const fromDesigner = ['completion', 'participation', 'training'].includes(requestedType ?? '');
  const [certType, setCertType] = useState<CertificateType>(fromDesigner ? requestedType as CertificateType : 'completion');
  const [templateMode, setTemplateMode] = useState<'default' | 'saved'>(fromDesigner ? 'saved' : 'default');
  const designQuery = useQuery({ queryKey: ['certificate-design', certType], queryFn: () => designerApi.load(certType), staleTime: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterComponent, setFilterComponent] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSection, setFilterSection] = useState('');

  // Fetch students with filters
  const { data, isLoading, isFetching, refresh, isRefreshing } = useStudents({
    search: search || undefined,
    component: filterComponent || undefined,
    course: filterCourse || undefined,
    section: filterSection || undefined,
    page,
    per_page: 20,
  });

  const students = data?.data ?? [];
  const meta = data?.meta;

  // Get unique courses and sections from ALL students (not just current page)
  // We need to fetch all students for filter options or use a separate API call
  const { data: allStudentsData } = useStudents({
    per_page: 1000, // Fetch all for filter options
  });
  
  const allStudents = allStudentsData?.data ?? [];
  
  // Get unique courses and sections from all students
  const courses = useMemo(() => {
    const courseSet = new Set(allStudents.map((s: any) => s.course).filter(Boolean));
    return Array.from(courseSet).sort();
  }, [allStudents]);

  const sections = useMemo(() => {
    const sectionSet = new Set(allStudents.map((s: any) => s.section).filter(Boolean));
    return Array.from(sectionSet).sort();
  }, [allStudents]);

  const generateMut = useBatchGenerateCertificates();

  const handleSelect = (id: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectable = students.filter((s: any) => certType !== 'completion' || s.is_eligible_for_completion);
  const allSelected = selectable.length > 0 && selectable.every((s: any) => selectedStudents.includes(s.id));
  const handleSelectAll = () => {
    const ids = selectable.map((s: any) => s.id);
    setSelectedStudents((previous) => allSelected
      ? previous.filter((id) => !ids.includes(id))
      : [...new Set([...previous, ...ids])]);
  };

  const handleGenerate = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    try {
      const result = await generateMut.mutateAsync({
        student_ids: selectedStudents,
        certificate_type: certType,
        template_mode: templateMode,
      });
      toast.success(`Generated ${result?.length || 0} certificates successfully!`);
      setSelectedStudents([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate certificates');
    }
  };

  const goToPage = (p: number) => {
    if (meta && p >= 1 && p <= meta.last_page) setPage(p);
  };

  const handleFilterChange = (type: string, value: string) => {
    setPage(1);
    if (type === 'component') setFilterComponent(value);
    if (type === 'course') setFilterCourse(value);
    if (type === 'section') setFilterSection(value);
  };

  const clearFilters = () => {
    setFilterComponent('');
    setFilterCourse('');
    setFilterSection('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = filterComponent || filterCourse || filterSection || search;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Generate Certificates</h2>
          <p className="text-sm text-slate-500">
            Select students to generate certificates
            {selectedStudents.length > 0 && (
              <span className="ml-2 font-semibold text-gold-600">
                ({selectedStudents.length} selected)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={refresh} isLoading={isRefreshing} label="" className="btn-sm" />
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generateMut.isPending || selectedStudents.length === 0 || (templateMode === 'saved' && (!designQuery.data || designQuery.isFetching || designQuery.isError))}
          >
            {generateMut.isPending ? (
              <><i className="fas fa-spinner fa-spin" /> Generating...</>
            ) : (
              <>Generate ({selectedStudents.length})</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="certificate-template" className="text-sm font-semibold text-navy-900">Certificate design</label>
          <select id="certificate-template" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" value={templateMode} onChange={(e) => setTemplateMode(e.target.value as 'default' | 'saved')}>
            <option value="default">Standard NSTP template</option>
            <option value="saved" disabled={!designQuery.data}>Saved design{designQuery.data ? `: ${designQuery.data.design.name}` : ' (not saved yet)'}</option>
          </select>
          {designQuery.isLoading && <span className="text-xs text-slate-500">Checking saved design…</span>}
          {designQuery.isError && <span role="alert" className="text-xs text-red-600">Could not load saved design. <button className="underline" onClick={() => designQuery.refetch()}>Retry</button></span>}
          {templateMode === 'saved' && !designQuery.isLoading && !designQuery.data && <span role="alert" className="text-xs text-red-600">Save a design for this certificate type first.</span>}
        </div>
        <Link className="text-sm font-semibold text-gold-600" to="/admin/certificates/designer"><i className="fas fa-palette mr-2" />Open Certificate Designer</Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterComponent}
            onChange={(e) => handleFilterChange('component', e.target.value)}
          >
            <option value="">All Components</option>
            <option value="cwts">CWTS</option>
            <option value="rotc">ROTC</option>
            <option value="lts">LTS</option>
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterCourse}
            onChange={(e) => handleFilterChange('course', e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <select
            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            value={filterSection}
            onChange={(e) => handleFilterChange('section', e.target.value)}
          >
            <option value="">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex gap-3 flex-wrap">
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              value={certType}
              onChange={(e) => { setCertType(e.target.value as CertificateType); setSelectedStudents([]); setTemplateMode('default'); }}
            >
              <option value="completion">Completion</option>
              <option value="participation">Participation</option>
              <option value="training">Training</option>
            </select>
            <button className="btn btn-secondary btn-sm" onClick={handleSelectAll}>
              {allSelected
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500">
              {students.length} students shown
              {meta?.total && meta.total > students.length && (
                <span className="ml-1">(of {meta.total})</span>
              )}
            </span>
            {hasActiveFilters && (
              <button className="text-sm text-gold-600 hover:text-gold-700" onClick={clearFilters}>
                <i className="fas fa-times mr-1" /> Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-gold-500"
                    disabled={selectable.length === 0}
                  />
                </th>
                <th>OCC ID</th>
                <th>Name</th>
                <th>Course</th>
                <th>Section</th>
                <th>Component</th>
                <th>Eligible</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <i className="fas fa-users text-3xl text-slate-300 block mb-3" />
                    No students found
                    {hasActiveFilters && (
                      <p className="text-sm mt-2">
                        Try adjusting your filters
                        <button className="text-gold-600 hover:text-gold-700 ml-2" onClick={clearFilters}>
                          Clear filters
                        </button>
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelect(student.id)}
                        className="w-4 h-4 accent-gold-500"
                        disabled={certType === 'completion' && !student.is_eligible_for_completion}
                      />
                    </td>
                    <td className="font-bold text-navy-900">{student.student_id}</td>
                    <td>{student.user.first_name} {student.user.last_name}</td>
                    <td>{student.course || '-'}</td>
                    <td>{student.section || '-'}</td>
                    <td>{student.nstp_component_selected?.toUpperCase() || '-'}</td>
                    <td>
                      {student.is_eligible_for_completion ? (
                        <span className="badge badge-success">✓ Eligible</span>
                      ) : (
                        <span className="badge badge-danger">✗ Not Eligible</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Showing {meta.from} – {meta.to} of {meta.total} students
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => goToPage(meta.current_page - 1)}
              disabled={meta.current_page <= 1 || isFetching}
            >
              Previous
            </button>
            <span className="text-sm font-medium text-navy-900 px-3">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => goToPage(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page || isFetching}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateCertificate;