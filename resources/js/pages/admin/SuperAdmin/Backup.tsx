// src/pages/admin/SuperAdmin/Backup.tsx

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminApi } from "../../../services/api";
import RefreshButton from "../../components/common/RefreshButton";
import toast from "react-hot-toast";

interface Backup {
  id: number;
  backup_name: string;
  file_size: number;
  human_file_size: string;
  tables_count: number;
  storage_files_count: number;
  type: "manual" | "auto";
  status: "pending" | "processing" | "completed" | "failed";
  status_color: string;
  notes: string | null;
  error_message: string | null;
  creator_name: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  download_url: string;
}

const BackupPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: backups = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Backup[]>({
    queryKey: ["superadmin", "backups"],
    queryFn: () => superAdminApi.getBackups(),
    staleTime: 15000,
  });

  const { data: stats } = useQuery({
    queryKey: ["superadmin", "backups", "stats"],
    queryFn: () => superAdminApi.getBackupStats(),
    staleTime: 30000,
  });

  const createMut = useMutation({
    mutationFn: (n?: string) => superAdminApi.createBackup(n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "backups"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "backups", "stats"] });
      setShowCreateModal(false);
      setNotes("");
      toast.success("Backup created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create backup");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => superAdminApi.deleteBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "backups"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "backups", "stats"] });
      toast.success("Backup deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete backup");
    },
  });

  const restoreMut = useMutation({
    mutationFn: (id: number) => superAdminApi.restoreBackup(id),
    onSuccess: () => {
      toast.success("Restore completed — refreshing data");
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast.error(error.message || "Restore failed");
    },
  });

  const handleDownload = async (id: number, name: string) => {
    try {
      const blob = await superAdminApi.downloadBackup(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err: any) {
      toast.error(err.message || "Failed to download");
    }
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this backup?")) return;
    deleteMut.mutate(id);
  };

  const handleRestore = (id: number) => {
    if (
      !window.confirm(
        "⚠️ WARNING: Restoring will OVERWRITE all current data (database + storage).\n\nDo you want to continue?",
      )
    )
      return;
    restoreMut.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "badge-success",
      processing: "badge-warning",
      pending: "badge-warning",
      failed: "badge-danger",
    };
    return map[status] || "badge-secondary";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-database text-gold-500 mr-2" />
            System Backups
          </h2>
          <p className="text-sm text-slate-500">
            Create, download, and restore full system backups (database +
            storage)
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isFetching}
            label=""
            className="btn-sm"
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus" /> New Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-navy-600">
          <span className="block text-xs text-slate-500">Total Backups</span>
          <span className="text-2xl font-bold text-navy-900">
            {stats?.total_backups || 0}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gold-500">
          <span className="block text-xs text-slate-500">Total Size</span>
          <span className="text-lg font-bold text-navy-900">
            {stats?.total_size
              ? `${(stats.total_size / 1024 / 1024).toFixed(2)} MB`
              : "0 MB"}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <span className="block text-xs text-slate-500">Last Backup</span>
          <span className="text-sm font-bold text-navy-900">
            {stats?.last_backup_at
              ? new Date(stats.last_backup_at).toLocaleString()
              : "Never"}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
          <span className="block text-xs text-slate-500">Latest Name</span>
          <span className="text-xs font-bold text-navy-900 truncate">
            {stats?.last_backup_name || "—"}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Backup</th>
                <th>Size</th>
                <th>Type</th>
                <th>Contents</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    <div className="spinner inline-block mr-2" />
                    Loading backups...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    <i className="fas fa-database text-3xl text-slate-300 block mb-3" />
                    No backups yet. Create your first one.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="font-medium text-navy-900">
                        {b.backup_name}.zip
                      </div>
                      {b.notes && (
                        <div className="text-xs text-slate-500 italic">
                          {b.notes}
                        </div>
                      )}
                    </td>
                    <td>{b.human_file_size}</td>
                    <td>
                      <span className="badge badge-secondary">
                        {b.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs text-slate-600">
                        <div>
                          <i className="fas fa-table mr-1" />
                          {b.tables_count ?? "—"} tables
                        </div>
                        <div>
                          <i className="fas fa-file mr-1" />
                          {b.storage_files_count ?? "—"} files
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(b.status)}`}>
                        {b.status.toUpperCase()}
                      </span>
                      {b.error_message && (
                        <div
                          className="text-xs text-red-500 truncate max-w-[180px]"
                          title={b.error_message}
                        >
                          {b.error_message}
                        </div>
                      )}
                    </td>
                    <td className="text-sm">{b.creator_name}</td>
                    <td className="text-sm text-slate-500">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "completed" && (
                          <>
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() =>
                                handleDownload(b.id, b.backup_name)
                              }
                              title="Download"
                            >
                              <i className="fas fa-download" />
                            </button>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleRestore(b.id)}
                              disabled={restoreMut.isPending}
                              title="Restore"
                            >
                              {restoreMut.isPending ? (
                                <i className="fas fa-spinner fa-spin" />
                              ) : (
                                <i className="fas fa-undo" />
                              )}
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(b.id)}
                          disabled={deleteMut.isPending}
                          title="Delete"
                        >
                          {deleteMut.isPending &&
                          deleteMut.variables === b.id ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            <i className="fas fa-trash" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => !createMut.isPending && setShowCreateModal(false)}
        >
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-database text-gold-500 mr-2" />
                Create New Backup
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                disabled={createMut.isPending}
              >
                ×
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2" />
                A backup includes the <strong>full database</strong> and the{" "}
                <strong>public storage files</strong> (documents, certificates,
                profile photos, learning materials). It may take a moment for
                large systems.
              </div>
              <div className="form-group">
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input min-h-[80px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Before migration, end-of-semester snapshot..."
                  maxLength={500}
                  disabled={createMut.isPending}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={createMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => createMut.mutate(notes || undefined)}
                disabled={createMut.isPending}
              >
                {createMut.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-1" /> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-1" /> Start Backup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupPage;