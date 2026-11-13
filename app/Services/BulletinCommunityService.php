<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class BulletinCommunityService
{
    public function visibleTo(User $user, object $post): bool
    {
        if (in_array($user->role, ['admin', 'super_admin'], true)) return true;
        if ((int) $post->created_by === (int) $user->id && $user->role === 'faculty') return true;
        if (\Carbon\Carbon::parse($post->display_from)->isFuture() ||
            ($post->display_until && \Carbon\Carbon::parse($post->display_until)->isPast())) return false;
        $allowed = ['all'];
        if ($user->role === 'student') {
            $allowed[] = 'students';
            $component = strtolower($user->student?->nstp_component_selected ?? '');
            if (in_array($component, ['cwts', 'rotc', 'lts'], true)) $allowed[] = $component;
        } elseif ($user->role === 'faculty') $allowed[] = 'faculty';
        return in_array($post->target_audience, $allowed, true);
    }

    public function post(User $user, int $id, bool $lock = false): object
    {
        $query = DB::table('bulletin_board')->where('id', $id);
        if ($lock) $query->lockForUpdate();
        $post = $query->first();
        abort_unless($post && $this->visibleTo($user, $post), 404, 'Bulletin not found or no longer available.');
        return $post;
    }

    public function authorizeWrite(User $user, ?object $post = null): void
    {
        abort_unless(in_array($user->role, ['admin', 'super_admin'], true) ||
            ($user->role === 'faculty' && (!$post || (int) $post->created_by === (int) $user->id)), 403);
    }

    public function summary(int $id, int $userId): array
    {
        return [
            'likes_count' => DB::table('bulletin_likes')->where('bulletin_id', $id)->count(),
            'comments_count' => DB::table('bulletin_comments')->where('bulletin_id', $id)->count(),
            'liked' => DB::table('bulletin_likes')->where('bulletin_id', $id)->where('user_id', $userId)->exists(),
            'following' => DB::table('bulletin_follows')->where('bulletin_id', $id)->where('user_id', $userId)->exists(),
        ];
    }

    public function notify(array $recipientIds, User $actor, object $post, string $title, string $message, ?int $commentId = null): void
    {
        foreach (User::with('student')->whereIn('id', array_unique($recipientIds))->where('id', '!=', $actor->id)->get() as $recipient) {
            if (!$this->visibleTo($recipient, $post)) continue;
            Notification::create([
                'user_id' => $recipient->id, 'title' => $title, 'message' => $message,
                'type' => 'announcement', 'is_read' => false,
                'data' => ['type' => 'bulletin', 'bulletin_id' => $post->id, 'id' => $post->id, 'comment_id' => $commentId],
            ]);
        }
    }

    /** Persist the pending publication; the scheduler handles future-dated posts. */
    public function schedule(object $post, User $actor, string $kind): void
    {
        $old = DB::table('bulletin_notification_events')->where('bulletin_id', $post->id)->first();
        if ($old && !$old->processed_at && $old->kind === 'new') $kind = 'new';
        DB::table('bulletin_notification_events')->updateOrInsert(['bulletin_id' => $post->id], [
            'kind' => $kind, 'actor_id' => $actor->id, 'due_at' => $post->display_from,
            'processed_at' => null, 'created_at' => $old?->created_at ?? now(), 'updated_at' => now(),
        ]);
    }

    public function dispatchDue(): int
    {
        $count = 0;
        $ids = DB::table('bulletin_notification_events')->whereNull('processed_at')->where('due_at', '<=', now())->pluck('id');
        foreach ($ids as $id) {
            DB::transaction(function () use ($id, &$count) {
                $event = DB::table('bulletin_notification_events')->where('id', $id)->lockForUpdate()->first();
                if (!$event || $event->processed_at || \Carbon\Carbon::parse($event->due_at)->isFuture()) return;
                $post = DB::table('bulletin_board')->find($event->bulletin_id);
                $actor = User::find($event->actor_id);
                if ($post && $actor && (!$post->display_until || \Carbon\Carbon::parse($post->display_until)->isFuture())) {
                    $query = User::where('id', '!=', $actor->id)->with('student');
                    if ($event->kind === 'update') $query->whereIn('id', DB::table('bulletin_follows')->where('bulletin_id', $post->id)->select('user_id'));
                    $query->chunkById(200, function ($users) use ($actor, $post, $event) {
                        $this->notify($users->modelKeys(), $actor, $post,
                            $event->kind === 'new' ? 'New bulletin post' : 'Bulletin updated', $post->title);
                    });
                }
                DB::table('bulletin_notification_events')->where('id', $id)->update(['processed_at' => now()]);
                $count++;
            });
        }
        return $count;
    }
}
