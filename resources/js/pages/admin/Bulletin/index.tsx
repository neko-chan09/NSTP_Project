// src/pages/admin/Bulletin/index.tsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import BulletinDiscussion from '../../components/common/BulletinDiscussion';
import { communityRequest } from '../../../services/communityApi';
import type { BulletinPost } from '../../../types/api';
import { useBulletin, useCreateBulletin, useUpdateBulletin, useDeleteBulletin } from '../../hooks/useBulletin';
import RefreshButton from '../../components/common/RefreshButton';
import toast from 'react-hot-toast';

const getCategoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    general: 'bg-slate-500',
    academic: 'bg-blue-500',
    event: 'bg-amber-500',
    announcement: 'bg-red-500',
    policy: 'bg-purple-500',
    memo: 'bg-navy-600',
  };
  return colors[cat?.toLowerCase()] || 'bg-slate-500';
};

const getAudienceLabel = (value: string) => {
  const labels: Record<string, string> = {
    all: 'All Users',
    students: 'Students',
    faculty: 'Faculty',
    cwts: 'CWTS',
    rotc: 'ROTC',
    lts: 'LTS',
  };
  return labels[value] || value;
};

const BulletinBoard: React.FC = () => {
  const { data: bulletins = [], isLoading, error, refresh, isRefreshing } = useBulletin();
  const { user } = useAuth();
  const [search] = useSearchParams();
  const focusId = Number(search.get('post')) || undefined;
  const focusComment = Number(search.get('comment')) || undefined;
  const canCreate = ['admin', 'super_admin', 'faculty'].includes(user?.role);
  const focused = useQuery({ queryKey: ['bulletin-focus', user?.id, focusId],
    enabled: !!focusId && !bulletins.some(post => post.id === focusId),
    queryFn: ({signal}) => communityRequest<{data: BulletinPost}>(`/bulletin/${focusId}`, 'GET', undefined, signal), retry: false });
  const displayed = focusId && focused.data && !bulletins.some(post => post.id === focusId) ? [focused.data.data, ...bulletins] : bulletins;
  const createMut = useCreateBulletin();
  const updateMut = useUpdateBulletin();
  const deleteMut = useDeleteBulletin();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
    target_audience: 'all',
    display_from: '',
    display_until: '',
    is_featured: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        display_from: form.display_from || new Date().toISOString(),
        display_until: form.display_until || null,
        is_featured: Boolean(form.is_featured),
      };
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: payload });
        toast.success('Bulletin updated successfully');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Bulletin created successfully');
      }
      refresh();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save bulletin');
    }
  };

  const handleEdit = (bulletin: any) => {
    setEditingId(bulletin.id);
    setForm({
      title: bulletin.title,
      content: bulletin.content,
      category: bulletin.category,
      target_audience: bulletin.target_audience || 'all',
      display_from: bulletin.display_from?.split('T')[0] || '',
      display_until: bulletin.display_until ? bulletin.display_until.split('T')[0] : '',
      is_featured: Boolean(bulletin.is_featured),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bulletin?')) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Bulletin deleted successfully');
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      category: 'general',
      target_audience: 'all',
      display_from: '',
      display_until: '',
      is_featured: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading bulletins...</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Failed to load bulletins: {(error as Error).message}</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Bulletin Board</h2>
          <p className="text-sm text-slate-500">{bulletins.length} total</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={refresh} isLoading={isRefreshing} label="" className="btn-sm" />
          {canCreate && <button
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'} btn-sm`}
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
          >
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`} />
            {showForm ? 'Cancel' : 'New Bulletin'}
          </button>}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">
            <i className="fas fa-edit text-gold-500 mr-2" />
            {editingId ? 'Edit Bulletin' : 'Create New Bulletin'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="title"
                className="input"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter bulletin title"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Content <span className="text-red-500">*</span></label>
              <textarea
                name="content"
                className="input min-h-[120px]"
                rows={5}
                value={form.content}
                onChange={handleChange}
                placeholder="Write the bulletin content here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Category</label>
                <input
                  type="text"
                  name="category"
                  className="input"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g., general, academic, event"
                />
              </div>
              <div className="form-group">
                <label className="label">Target Audience <span className="text-red-500">*</span></label>
                <select
                  name="target_audience"
                  className="input"
                  value={form.target_audience}
                  onChange={handleChange}
                  required
                >
                  <option value="all">All Users</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="cwts">CWTS</option>
                  <option value="rotc">ROTC</option>
                  <option value="lts">LTS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Display From</label>
                <input
                  type="datetime-local"
                  name="display_from"
                  className="input"
                  value={form.display_from}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="label">Display Until (optional)</label>
                <input
                  type="datetime-local"
                  name="display_until"
                  className="input"
                  value={form.display_until}
                  onChange={handleChange}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="w-4 h-4 accent-gold-500"
              />
              <span className="font-medium text-navy-700">Featured Bulletin</span>
              <span className="text-sm text-slate-400">(shows at top)</span>
            </label>

            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMut.isPending || updateMut.isPending}
              >
                {createMut.isPending || updateMut.isPending ? (
                  <><i className="fas fa-spinner fa-spin" /> Saving...</>
                ) : (
                  <><i className="fas fa-check" /> {editingId ? 'Update' : 'Publish'}</>
                )}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {focused.error && <p role="alert" className="alert alert-danger">This notification’s post is unavailable or no longer visible to your account.</p>}
      {/* List */}
      {displayed.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-bullhorn" />
          <p>No bulletins created yet.</p>
          <p className="text-sm text-slate-400 mt-1">Click "New Bulletin" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((bulletin) => (
            <div
              key={bulletin.id}
              className={`bg-white rounded-xl shadow-sm border ${bulletin.is_featured ? 'border-amber-300 shadow-md' : 'border-slate-200'} overflow-hidden transition-shadow hover:shadow-md`}
            >
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-navy-900">{bulletin.title}</h3>
                      {bulletin.is_featured && (
                        <span className="badge bg-amber-100 text-amber-800">
                          <i className="fas fa-star text-amber-500 mr-1" /> FEATURED
                        </span>
                      )}
                      <span className={`badge ${getCategoryColor(bulletin.category)} text-white`}>
                        {bulletin.category?.toUpperCase() || 'GENERAL'}
                      </span>
                      <span className="badge badge-secondary">
                        <i className="fas fa-users mr-1" />
                        {getAudienceLabel(bulletin.target_audience)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">{bulletin.content}</p>
                  </div>
                  {(['admin', 'super_admin'].includes(user?.role) || bulletin.created_by === user?.id) && <div className="flex gap-1.5">
                    <button className="btn btn-info btn-sm" onClick={() => handleEdit(bulletin)} disabled={deleteMut.isPending}>
                      <i className="fas fa-pen" />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(bulletin.id)}
                      disabled={deleteMut.isPending}
                    >
                      {deleteMut.isPending && deleteMut.variables === bulletin.id ? (
                        <i className="fas fa-spinner fa-spin" />
                      ) : (
                        <i className="fas fa-trash" />
                      )}
                    </button>
                  </div>}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span><i className="fas fa-calendar mr-1" /> {new Date(bulletin.display_from).toLocaleDateString()}</span>
                  {bulletin.display_until && (
                    <span><i className="fas fa-clock mr-1" /> Until {new Date(bulletin.display_until).toLocaleDateString()}</span>
                  )}
                  <span><i className="fas fa-eye mr-1" /> {bulletin.views || 0} views</span>
                </div>
                <BulletinDiscussion id={bulletin.id} summary={bulletin} focus={focusId === bulletin.id} focusCommentId={focusId === bulletin.id ? focusComment : undefined} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletinBoard;