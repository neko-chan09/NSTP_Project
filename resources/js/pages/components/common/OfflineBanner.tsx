// resources/js/components/common/OfflineBanner.tsx
import React, { useState } from "react";
import { useOnline } from "../../hooks/useOnline";
import { useSyncQueue } from "../../hooks/useSyncQueue";
import SyncStatusPanel from "./SyncStatusPanel";

const OfflineBanner: React.FC = () => {
  const online = useOnline();
  const { count, syncing, flush } = useSyncQueue();
  const [showPanel, setShowPanel] = useState(false);

  if (online && count === 0) return null;

  const bg = !online
    ? "bg-amber-500"
    : syncing
      ? "bg-blue-500"
      : "bg-emerald-500";

  const icon = !online
    ? "fa-wifi"
    : syncing
      ? "fa-sync fa-spin"
      : "fa-check-circle";

  const text = !online
    ? `Offline — ${count} pending change${count !== 1 ? "s" : ""} queued`
    : syncing
      ? `Syncing ${count} change${count !== 1 ? "s" : ""}...`
      : `${count} change${count !== 1 ? "s" : ""} pending sync`;

  return (
    <>
      <div
        className={`${bg} text-white text-sm px-4 py-2 flex items-center justify-between gap-3 sticky top-0 z-[9999] shadow-md`}
      >
        <div className="flex items-center gap-2">
          <i className={`fas ${icon}`} />
          <span className="font-medium">{text}</span>
        </div>
        <div className="flex items-center gap-2">
          {online && count > 0 && !syncing && (
            <button
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold"
              onClick={() => flush()}
            >
              <i className="fas fa-sync mr-1" /> Sync Now
            </button>
          )}
          {count > 0 && (
            <button
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold"
              onClick={() => setShowPanel(true)}
            >
              <i className="fas fa-list mr-1" /> View ({count})
            </button>
          )}
        </div>
      </div>

      {showPanel && <SyncStatusPanel onClose={() => setShowPanel(false)} />}
    </>
  );
};

export default OfflineBanner;