import { API_URL } from './api';
import { getToken } from '../lib/token';

export interface BulletinComment { id: number; body: string; parent_id: number | null; user_id: number; first_name: string; last_name: string; role: string; created_at: string }
export interface BulletinSummary { liked: boolean | number; following: boolean | number; likes_count: number; comments_count: number }
export interface Discussion { data: BulletinComment[]; summary: BulletinSummary; meta: { current_page: number; last_page: number } }
export interface InboxItem { id: number; title: string; message: string; is_read: boolean; created_at: string; data?: { type?: string; bulletin_id?: number; comment_id?: number } }

export async function communityRequest<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method, signal, cache: 'no-store',
    headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || Object.values(result.errors ?? {}).flat().join(' ') || `Request failed (${response.status})`);
  return result;
}

export function commentSubmissionId() {
  return globalThis.crypto?.randomUUID?.() ?? `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
