// resources/js/pages/admin/SuperAdmin/BackupSchedules.tsx
import React, { useState } from "react";
import RefreshButton from "../../components/common/RefreshButton";
import {
  useBackupSchedules,
  useCreateBackupSchedule,
  useUpdateBackupSchedule,
  useToggleBackupSchedule,
  useRunBackupScheduleNow,
  useDeleteBackupSchedule,
  usePurgeOldBackups,
} from "../../hooks/useBackupSchedules";
import type { BackupSchedule } from "../../../types/api";
import toast from "react-hot-toast";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const EMPTY_FORM = {
  name: "",
  notes: "",
  frequency: "daily" as "daily" | "weekly" | "monthly" | "custom",
  time: "02:00",
  day_of_week: 0,
  day_of_month: 1,
  cron_expression: "",
  retention_days: 30,
  is_active: true,
};

const BackupSchedules: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const {
    data: schedules = [],
    isLoading,
    refetch,
    isRefreshing,
  } = useBackupSchedules();

  const createMut = useCreateBackupSchedule();
  const updateMut = useUpdateBackupSchedule();
  const toggleMut = useToggleBackupSchedule();
  const runMut = useRunBackupScheduleNow();
  const deleteMut = useDeleteBackupSchedule();
  const purgeMut = usePurgeOldBackups();

  // ============================================================
  // Handlers
  // ============================================================
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (s: BackupSchedule) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      notes: s.notes || "",
      frequency: s.frequency,
      time: s.time,
      day_of_week: s.day_of_week ?? 0,
      day_of_month: s.day_of_month ?? 1,
      cron_expression: s.cron_expression || "",
      retention_days: s.retention_days ?? 30,
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name: form.name,
      notes: form.notes || null,
      frequency: form.frequency,
      time: form.time,
      retention_days: form.retention_days || null,
      is_active: form.is_active,
    };

    if (form.frequency === "weekly") payload.day_of_week = form.day_of_week;
    if (form.frequency === "monthly") payload.day_of_month = form.day_of_month;
    if (form.frequency === "custom") payload.cron_expression = form.cron_expression;

    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, data: payload });
        toast.success("Schedule updated");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Schedule created");
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save schedule");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleMut.mutateAsync(id);
      toast.success("Status updated");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Toggle failed");
    }
  };

  const handleRunNow = async (s: BackupSchedule) => {
    if (!window.confirm(`Run "${s.name}" right now? This will create a backup immediately.`)) return;
    try {
      await runMut.mutateAsync(s.id);
      toast.success("Backup started");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to run schedule");
    }
  };

  const handleDelete = async (s: BackupSchedule) => {
    if (!window.confirm(`Delete schedule "${s.name}"? Existing backups will NOT be deleted.`)) return;
    try {
      await deleteMut.mutateAsync(s.id);
      toast.success("Schedule deleted");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handlePurge = async () => {
    if (!window.confirm("Purge backups older than their schedule's retention policy?")) return;
    try {
      const result = await purgeMut.mutateAsync();
      toast.success(result.message || "Purge complete");
    } catch (err: any) {
      toast.error(err.message || "Purge failed");
    }
  };

  // ============================================================
  // Render
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading schedules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            <i className="fas fa-clock text-gold-500 mr-2" />
            Backup Schedules
          </h2>
          <p className="text-sm text-slate-500">
            Automate system backups with retention policy
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onRefresh={refetch}
            isLoading={isRefreshing}
            label=""
            className="btn-sm"
          />
          <button
            className="btn btn-warning btn-sm"
            onClick={handlePurge}
            disabled={purgeMut.isPending}
          >
            {purgeMut.isPending ? (
              <><i className="fas fa-spinner fa-spin mr-1" /> Purging...</>
            ) : (
              <><i className="fas fa-broom mr-1" /> Purge Old</>
            )}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="fas fa-plus" /> New Schedule
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {schedules.length === 0 ? (
        <div className="empty-state bg-white rounded-xl border border-slate-200 p-10 text-center">
          <i className="fas fa-clock text-4xl text-slate-300 mb-3 block" />
          <p className="text-slate-500">No backup schedules yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Create one to automatically back up your system
          </p>
          <button className="btn btn-primary mt-4" onClick={openCreate}>
            <i className="fas fa-plus mr-1" /> Create Your First Schedule
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Frequency</th>
                  <th>Retention</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Backups</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td>
                      <div className="font-semibold text-navy-900">{s.name}</div>
                      {s.notes && (
                        <div className="text-xs text-slate-500 truncate max-w-[240px]">
                          {s.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">
                        <i className="fas fa-clock mr-1" />
                        {s.frequency_label || s.frequency}
                      </span>
                    </td>
                    <td>
                      {s.retention_days ? (
                        <span className="text-sm">{s.retention_days} days</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Forever</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.is_active ? "badge-success" : "badge-secondary"}`}>
                        {s.is_active ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600">
                      {s.last_run_at
                        ? new Date(s.last_run_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="text-sm text-slate-600">
                      {s.is_active && s.next_run_at
                        ? new Date(s.next_run_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {s.backups_count ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleRunNow(s)}
                          disabled={runMut.isPending}
                          title="Run now"
                        >
                          {runMut.isPending && runMut.variables === s.id ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            <i className="fas fa-play" />
                          )}
                        </button>
                        <button
                          className={`btn btn-sm ${s.is_active ? "btn-warning" : "btn-info"}`}
                          onClick={() => handleToggle(s.id)}
                          disabled={toggleMut.isPending}
                          title={s.is_active ? "Pause" : "Activate"}
                        >
                          <i className={`fas ${s.is_active ? "fa-pause" : "fa-play"}`} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(s)}
                          title="Edit"
                        >
                          <i className="fas fa-edit" />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(s)}
                          disabled={deleteMut.isPending}
                          title="Delete"
                        >
                          {deleteMut.isPending && deleteMut.variables === s.id ? (
                            <i className="fas fa-spinner fa-spin" />
                          ) : (
                            <i className="fas fa-trash" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? "Edit Schedule" : "Create Backup Schedule"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="label">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Nightly Full Backup"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    className="input min-h-[60px]"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Frequency <span className="text-red-500">*</span></label>
                  <select
                    className="input"
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: e.target.value as any })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom (cron)</option>
                  </select>
                </div>

                {form.frequency !== "custom" && (
                  <div className="form-group">
                    <label className="label">Time (24h) <span className="text-red-500">*</span></label>
                    <input
                      type="time"
                      className="input"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                    />
                  </div>
                )}

                {form.frequency === "weekly" && (
                  <div className="form-group">
                    <label className="label">Day of Week</label>
                    <select
                      className="input"
                      value={form.day_of_week}
                      onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                    >
                      {DAYS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.frequency === "monthly" && (
                  <div className="form-group">
                    <label className="label">Day of Month (1–28)</label>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      max={28}
                      value={form.day_of_month}
                      onChange={(e) =>
                        setForm({ ...form, day_of_month: Number(e.target.value) })
                      }
                    />
                  </div>
                )}

                {form.frequency === "custom" && (
                  <div className="form-group">
                    <label className="label">Cron Expression</label>
                    <input
                      type="text"
                      className="input font-mono"
                      value={form.cron_expression}
                      onChange={(e) =>
                        setForm({ ...form, cron_expression: e.target.value })
                      }
                      placeholder="0 2 * * *"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Format: minute hour day-of-month month day-of-week
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="label">
                    Retention (days)
                    <span className="text-xs text-slate-400 ml-2">
                      Leave empty to keep forever
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    min={1}
                    max={3650}
                    value={form.retention_days}
                    onChange={(e) =>
                      setForm({ ...form, retention_days: Number(e.target.value) || 0 })
                    }
                    placeholder="30"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 accent-gold-500"
                  />
                  <span className="text-sm font-medium">Activate immediately</span>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  {createMut.isPending || updateMut.isPending ? (
                    <><i className="fas fa-spinner fa-spin mr-1" /> Saving...</>
                  ) : editingId ? (
                    "Update Schedule"
                  ) : (
                    "Create Schedule"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupSchedules;