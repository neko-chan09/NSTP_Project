import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { communityRequest, type InboxItem } from '../../../services/communityApi';
import toast from 'react-hot-toast';

export default function NotificationInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inbox = useQuery({ queryKey: ['community-inbox', user?.id, page], enabled: !!user,
    queryFn: ({ signal }) => communityRequest<{ data: InboxItem[]; unread_count: number; meta: { last_page: number } }>(`/notifications?page=${page}`, 'GET', undefined, signal),
    refetchInterval: 30000, refetchIntervalInBackground: false });
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('click', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', key); };
  }, [open]);
  async function mark(item?: InboxItem) {
    if (busy) return; setBusy(true);
    try {
      await communityRequest(item ? `/notifications/${item.id}/read` : '/notifications/read-all', 'POST');
      await client.invalidateQueries({ queryKey: ['community-inbox', user?.id] });
      if (item?.data?.type === 'bulletin' && item.data.bulletin_id) {
        const prefix = user?.role === 'faculty' ? '/faculty' : '/admin';
        navigate(`${prefix}/bulletin?post=${item.data.bulletin_id}${item.data.comment_id ? `&comment=${item.data.comment_id}` : ''}`);
        setOpen(false);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Notification could not be updated.'); }
    finally { setBusy(false); }
  }
  return <div ref={ref} className="relative">
    <button type="button" className="btn btn-secondary btn-sm" aria-label={`Notifications, ${inbox.data?.unread_count ?? 0} unread`} aria-expanded={open} onClick={() => setOpen(!open)}><i className="fas fa-bell" /><span>{inbox.data?.unread_count ?? 0}</span></button>
    {open && <section aria-label="Notification inbox" className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-xl rounded-xl w-[340px] max-w-[85vw] max-h-[70vh] overflow-y-auto z-50">
      <div className="p-4 border-b border-slate-100 flex justify-between gap-2"><h3 className="font-semibold">Notifications</h3><button type="button" className="text-xs text-blue-700" disabled={busy} onClick={() => mark()}>Mark all read</button></div>
      {inbox.isLoading && <p className="p-4 text-sm" role="status">Loading notifications…</p>}
      {inbox.error && <p className="p-4 text-sm text-red-700" role="alert">{(inbox.error as Error).message} <button type="button" className="underline" onClick={() => inbox.refetch()}>Retry</button></p>}
      {inbox.data?.data.map(item => <div key={item.id} className={`p-4 border-b border-slate-100 ${item.is_read ? '' : 'bg-blue-50'}`}><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-slate-600 break-words mt-1">{item.message}</p><p className="text-xs text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p><button type="button" className="text-xs text-blue-700 mt-2" disabled={busy} onClick={() => mark(item)}>{item.data?.type === 'bulletin' ? 'View post or reply' : item.is_read ? 'Read' : 'Mark read'}</button></div>)}
      {inbox.data && !inbox.data.data.length && <p className="p-4 text-sm text-slate-500">No notifications.</p>}
      <div className="p-3 flex justify-between"><button type="button" className="text-xs text-blue-700" disabled={page <= 1} onClick={() => setPage(page - 1)}>Newer</button><button type="button" className="text-xs text-blue-700" disabled={!inbox.data || page >= inbox.data.meta.last_page} onClick={() => setPage(page + 1)}>Older</button></div>
    </section>}
  </div>;
}
