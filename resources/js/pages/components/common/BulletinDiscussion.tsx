import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { communityRequest, commentSubmissionId, type Discussion, type BulletinSummary } from '../../../services/communityApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function BulletinDiscussion({ id, summary, focus = false, focusCommentId }: {
  id: number; summary?: Partial<BulletinSummary>; focus?: boolean; focusCommentId?: number;
}) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(focus);
  const [page, setPage] = useState(0);
  const [body, setBody] = useState('');
  const [reply, setReply] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const submission = useRef<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const discussion = useQuery({ queryKey: ['bulletin-discussion', user?.id, id, page, focusCommentId],
    queryFn: ({ signal }) => communityRequest<Discussion>(`/bulletin/${id}/discussion?page=${page || 1}${!page && focusCommentId ? `&comment_id=${focusCommentId}` : ''}`, 'GET', undefined, signal),
    enabled: open, refetchInterval: open ? 30000 : false, refetchIntervalInBackground: false });
  const counts = discussion.data?.summary ?? summary;
  useEffect(() => { if (focus) { setOpen(true); setPage(0); ref.current?.scrollIntoView({ block: 'center' }); } }, [focus, focusCommentId]);
  const refresh = async () => { await Promise.all([
    client.invalidateQueries({ queryKey: ['bulletin-discussion', user?.id, id] }),
    client.invalidateQueries({ queryKey: ['bulletin'] }),
    client.invalidateQueries({ queryKey: ['community-inbox'] }),
  ]); };
  async function change(kind: 'like' | 'follow') {
    if (busy) return;
    setBusy(true);
    try {
      const response = await communityRequest<{data: BulletinSummary}>(`/bulletin/${id}/${kind}`, 'PUT', kind === 'like' ? { liked: !counts?.liked } : { following: !counts?.following });
      client.setQueriesData<Discussion>({queryKey: ['bulletin-discussion', user?.id, id]}, old => old ? {...old, summary: response.data} : old);
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update this post.'); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!body.trim() || busy) return;
    setBusy(true);
    const clientId = submission.current ?? (submission.current = commentSubmissionId());
    try {
      await communityRequest(`/bulletin/${id}/comments`, 'POST', { body: body.trim(), parent_id: reply, client_id: clientId });
      setBody(''); setReply(null); submission.current = null;
      setPage(Math.max(1, Math.ceil(((counts?.comments_count ?? 0) + 1) / 30)));
      toast.success('Comment posted'); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not post comment.'); }
    finally { setBusy(false); }
  }
  return <div ref={ref} className="border-t border-slate-100 mt-4 pt-3">
    <div className="flex flex-wrap gap-2 items-center text-sm">
      <button type="button" className={`btn btn-sm ${counts?.liked ? 'btn-info' : 'btn-secondary'}`} disabled={busy} aria-pressed={!!counts?.liked} onClick={() => change('like')}><i className="fas fa-thumbs-up" /> {counts?.liked ? 'Liked' : 'Like'} · {counts?.likes_count ?? 0}</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(!open)} aria-expanded={open}><i className="fas fa-comment" /> Comments · {counts?.comments_count ?? 0}</button>
      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} aria-pressed={!!counts?.following} onClick={() => change('follow')}><i className="fas fa-bell" /> {counts?.following ? 'Following updates' : 'Follow updates'}</button>
    </div>
    {open && <section className="mt-4 space-y-3" aria-label="Post comments">
      {discussion.isLoading && <p role="status" className="text-sm text-slate-500">Loading comments…</p>}
      {discussion.error && <div role="alert" className="text-sm text-red-700">{(discussion.error as Error).message} <button type="button" className="underline" onClick={() => discussion.refetch()}>Retry</button></div>}
      {discussion.data?.data.map(comment => <div key={comment.id} className={`rounded-lg p-3 ${comment.id === focusCommentId ? 'bg-gold-50 ring-2 ring-gold-400' : 'bg-slate-50'} ${comment.parent_id ? 'ml-4 border-l-2 border-slate-200' : ''}`}>
        <div className="flex flex-wrap gap-2 items-center"><span className="text-sm font-semibold text-navy-900">{comment.first_name} {comment.last_name}</span><span className="text-xs text-slate-500">{comment.role} · {new Date(comment.created_at).toLocaleString()}</span></div>
        {comment.parent_id && <p className="text-xs text-slate-500">Reply to comment #{comment.parent_id}</p>}
        <p className="text-sm whitespace-pre-wrap break-words mt-1">{comment.body}</p>
        {!comment.parent_id && <button type="button" className="text-xs text-blue-700 mt-2" disabled={busy} onClick={() => { setReply(comment.id); submission.current = null; }}>Reply</button>}
      </div>)}
      {discussion.data && !discussion.data.data.length && <p className="text-sm text-slate-500">Be the first to comment.</p>}
      {discussion.data && discussion.data.meta.last_page > 1 && <div className="flex gap-3 items-center text-sm">
        <button type="button" className="btn btn-secondary btn-sm" disabled={discussion.data.meta.current_page <= 1} onClick={() => { setPage(discussion.data!.meta.current_page - 1); setReply(null); submission.current = null; }}>Previous</button>
        <span>Page {discussion.data.meta.current_page} of {discussion.data.meta.last_page}</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={discussion.data.meta.current_page >= discussion.data.meta.last_page} onClick={() => { setPage(discussion.data!.meta.current_page + 1); setReply(null); submission.current = null; }}>Next</button>
      </div>}
      <form onSubmit={submit} className="space-y-2">
        {reply && <p className="text-xs text-blue-700">Replying to comment #{reply} <button type="button" className="underline ml-2" disabled={busy} onClick={() => { setReply(null); submission.current = null; }}>Cancel</button></p>}
        <label className="block text-sm" htmlFor={`bulletin-comment-${id}`}>{reply ? 'Your reply' : 'Your comment'}</label>
        <textarea id={`bulletin-comment-${id}`} className="form-control w-full" maxLength={2000} rows={3} value={body} disabled={busy} onChange={event => { setBody(event.target.value); submission.current = null; }} placeholder="Write a comment or ask a question…" />
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !body.trim() || !!discussion.error}>{busy ? 'Please wait…' : reply ? 'Post reply' : 'Post comment'}</button>
      </form>
    </section>}
  </div>;
}
