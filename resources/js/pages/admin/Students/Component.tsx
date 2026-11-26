// src/pages/admin/Students/Component.tsx
import React, { useState, useRef } from 'react';
import { useUpdateStudent } from '../../hooks/useStudents';
import { secureRequest } from '../../../services/secureRequest';
import RefreshButton from '../../components/common/RefreshButton';
import toast from 'react-hot-toast';
import type { Student } from '../../../types/api';

const StudentComponent: React.FC = () => {
  const [lookupId, setLookupId] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [notFound, setNotFound] = useState(false);

  const updateMut = useUpdateStudent();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const latestRequest = useRef(0);

  const lookupStudent = async (id: string) => {
    const request = ++latestRequest.current;
    const exactId = id.trim();
    setCurrentStudent(null);
    setNotFound(false);
    setLookupError('');
    setSearchedId(exactId);
    if (!exactId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const response = await secureRequest(`/admin/students?student_id=${encodeURIComponent(exactId)}&per_page=1&page=1`);
      if (request !== latestRequest.current) return;
      if (!Array.isArray(response?.data)) throw new Error('The student lookup returned an unexpected response. Please retry.');
      const found = response.data.find((s: Student) => s.student_id.toLowerCase() === exactId.toLowerCase());
      setCurrentStudent(found || null);
      setNotFound(!found);
    } catch (error: any) {
      if (request === latestRequest.current) setLookupError(error.message || 'Could not load the student. Check your connection and retry.');
    } finally {
      if (request === latestRequest.current) setIsLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    void lookupStudent(lookupId);
  };

  const handleComponentChange = async (studentId: number, component: string) => {
    try {
      await updateMut.mutateAsync({ 
        id: studentId, 
        payload: { nstp_component_selected: (component || null) as any } 
      });
      
      setCurrentStudent((prev) => prev ? { ...prev, nstp_component_selected: component as any || undefined } : null);

      toast.success('Component updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update component');
    }
  };

  const getComponentColor = (comp: string | null | undefined) => {
    if (!comp) return 'bg-slate-200 text-slate-600';
    const colors: Record<string, string> = {
      cwts: 'bg-blue-500 text-white',
      rotc: 'bg-red-500 text-white',
      lts: 'bg-emerald-500 text-white',
    };
    return colors[comp] || 'bg-slate-200 text-slate-600';
  };


  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-navy-900">Component Selection Management</h2>
        <RefreshButton onRefresh={()=>void lookupStudent(lookupId)} isLoading={isLoading} />
      </div>

      {/* Lookup Form */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <label className="font-medium text-navy-700 self-center">Enter Student ID:</label>
          <input
            type="text"
            placeholder="e.g. 2025-00001"
            value={lookupId}
            onChange={(e) => { ++latestRequest.current; setLookupId(e.target.value); setCurrentStudent(null); setNotFound(false); setLookupError(''); setIsLoading(false); }}
            disabled={updateMut.isPending}
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading || updateMut.isPending || !lookupId.trim()}>
            <i className="fas fa-search" /> {isLoading ? "Looking up…" : "Look Up"}
          </button>
        </form>
      </div>

      {isLoading && <div role="status">Looking up the student ID…</div>}
      {lookupError && <div className="alert alert-danger" role="alert">Could not look up the student: {lookupError} <button type="button" className="btn" onClick={()=>void lookupStudent(lookupId)}>Retry</button></div>}
      {/* Not Found */}
      {notFound && (
        <div className="alert alert-danger">
          No student found with ID: <strong>{searchedId}</strong>
        </div>
      )}

      {/* Student Card */}
      {currentStudent && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 text-xl">
              <i className="fas fa-user" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-900">
                {currentStudent.user.first_name} {currentStudent.user.last_name}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span><strong>ID:</strong> {currentStudent.student_id}</span>
                <span><strong>Course:</strong> {currentStudent.course || '-'}</span>
                <span><strong>Year:</strong> {currentStudent.year_level || '-'}</span>
              </div>
              <div className="mt-2">
                <strong className="text-sm">Current Component: </strong>
                {currentStudent.nstp_component_selected ? (
                  <span className={`badge ${getComponentColor(currentStudent.nstp_component_selected)}`}>
                    {currentStudent.nstp_component_selected.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">Not assigned</span>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-navy-700 mb-1.5">
              Assign Component
            </label>
            <select
              value={currentStudent.nstp_component_selected || ''}
              onChange={(e) => handleComponentChange(currentStudent.id, e.target.value)}
              className="input"
              disabled={updateMut.isPending}
            >
              <option value="">None</option>
              <option value="cwts">CWTS</option>
              <option value="rotc">ROTC</option>
              <option value="lts">LTS</option>
            </select>
            {updateMut.isPending && <small className="text-slate-400 text-xs">Saving...</small>}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentStudent && !notFound && !lookupError && !isLoading && (
        <div className="empty-state">
          <i className="fas fa-id-card" />
          <p>Enter a Student OCC ID above to manage their NSTP component.</p>
        </div>
      )}
    </div>
  );
};

export default StudentComponent;