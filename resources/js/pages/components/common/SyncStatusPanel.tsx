// resources/js/components/common/SyncStatusPanel.tsx
import React from "react";
import { useSyncQueue } from "../../hooks/useSyncQueue";
import { useOnline } from "../../hooks/useOnline";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
}

const SyncStatusPanel: React.FC<Props> = ({ onClose }) => {
  const online = useOnline();
  const { items, count, syncing, flush, clear, remove, lastError } =
    useSyncQueue();

  const handleFlush = async () => {
    if (!online) {
      toast.error("You're offline. Try again when connected.");
      return;
    }
    const res = await flush();
    if (res.success > 0 && res.failed === 0) {
      toast.success(
        `Synced ${res.success} change${res.success !== 1 ? "s" : ""}`,
      );
    } else if (res.failed > 0) {
      toast.error(`${res.success} synced, ${res.failed} failed. See details.`);
    }
  };

  const handleClear = () => {
    if (
      !window.confirm(
        "Clear the entire offline queue? Pending changes will be LOST.",
      )
    )
      return;
    clear();
    toast.success("Queue cleared");
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "POST":
        return "bg-emerald-100 text-emerald-800";
      case "PUT":
      case "PATCH":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>
              <i className="fas fa-cloud-upload-alt text-gold-500 mr-2" />
              Offline Sync Queue
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {count} pending item{count !== 1 ? "s" : ""} •{" "}
              {online ? (
                <span className="text-emerald-600">Online</span>
              ) : (
                <span className="text-amber-600">Offline</span>
              )}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body max-h-[60vh] overflow-y-auto space-y-3">
          {lastError && (
            <div className="p-3 bg-red-50 rounded border border-red-200 text-sm text-red-700">
              <i className="fas fa-exclamation-circle mr-1" />
              {lastError}
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <i className="fas fa-check-circle text-4xl text-emerald-400 block mb-3" />
              <p className="font-medium">All synced!</p>
              <p className="text-sm mt-1">No pending changes in the queue.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-lg border border-slate-200 flex items-start gap-3"
              >
                <span
                  className={`badge ${getMethodColor(item.method)} text-xs font-bold`}
                >
                  {item.method}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-900 truncate">
                    {item.label || item.tag || item.url}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                    {item.url}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400">
                    <span>
                      <i className="fas fa-clock mr-1" />
                      {formatTime(item.createdAt)}
                    </span>
                    {item.attempts > 0 && (
                      <span className="text-amber-600">
                        <i className="fas fa-redo mr-1" />
                        {item.attempts} attempt
                        {item.attempts !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {item.lastError && (
                    <div className="text-xs text-red-600 mt-1 truncate">
                      <i className="fas fa-exclamation-triangle mr-1" />
                      {item.lastError}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => item.id && remove(item.id)}
                  title="Remove from queue"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer justify-between">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            disabled={count === 0}
          >
            <i className="fas fa-trash mr-1" /> Clear Queue
          </button>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={handleFlush}
              disabled={!online || syncing || count === 0}
            >
              {syncing ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1" /> Syncing...
                </>
              ) : (
                <>
                  <i className="fas fa-sync mr-1" /> Sync Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncStatusPanel;