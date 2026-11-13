<?php

namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Services\BulletinCommunityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BulletinInteractionController extends Controller
{
    public function discussion(Request $request, int $id, BulletinCommunityService $service)
    {
        $service->post($request->user(), $id);
        $request->validate(['comment_id' => 'nullable|integer|min:1']);
        $page = max(1, (int) $request->input('page', 1));
        if ($request->filled('comment_id') && DB::table('bulletin_comments')->where('bulletin_id', $id)->where('id', $request->comment_id)->exists()) {
            $position = DB::table('bulletin_comments')->where('bulletin_id', $id)->where('id', '<=', $request->comment_id)->count();
            $page = max(1, (int) ceil($position / 30));
        }
        $comments = DB::table('bulletin_comments as c')->leftJoin('users as u', 'u.id', '=', 'c.user_id')
            ->where('c.bulletin_id', $id)->orderBy('c.id')
            ->select('c.id', 'c.body', 'c.user_id', 'c.parent_id', 'c.created_at', 'u.first_name', 'u.last_name', 'u.role')->paginate(30, ['*'], 'page', $page);
        return response()->json(['data' => $comments->items(), 'summary' => $service->summary($id, $request->user()->id),
            'meta' => ['current_page' => $comments->currentPage(), 'last_page' => $comments->lastPage()]])->header('Cache-Control', 'no-store');
    }

    public function comment(Request $request, int $id, BulletinCommunityService $service)
    {
        if (is_string($request->input('body'))) $request->merge(['body' => trim($request->input('body'))]);
        $data = $request->validate(['body' => 'required|string|max:2000', 'parent_id' => 'nullable|integer',
            'client_id' => 'required|string|max:80|regex:/^[a-zA-Z0-9_-]+$/']);
        $commentId = DB::transaction(function () use ($request, $data, $id, $service) {
            $post = $service->post($request->user(), $id, true);
            $old = DB::table('bulletin_comments')->where('user_id', $request->user()->id)->where('client_id', $data['client_id'])->first();
            if ($old) {
                abort_unless((int) $old->bulletin_id === $id && $old->body === $data['body'] &&
                    (int) $old->parent_id === (int) ($data['parent_id'] ?? 0), 409, 'Comment submission changed. Please try again.');
                return $old->id;
            }
            $parent = null;
            if (!empty($data['parent_id'])) {
                $parent = DB::table('bulletin_comments')->where('id', $data['parent_id'])->where('bulletin_id', $id)->first();
                abort_unless($parent && !$parent->parent_id, 422, 'Choose a top-level comment from this post to reply to.');
            }
            $commentId = DB::table('bulletin_comments')->insertGetId(['bulletin_id' => $id, 'user_id' => $request->user()->id,
                'parent_id' => $parent?->id, 'client_id' => $data['client_id'], 'body' => $data['body'], 'created_at' => now(), 'updated_at' => now()]);
            $service->notify(array_filter([$post->created_by, $parent?->user_id]), $request->user(), $post,
                $parent ? 'New reply to a bulletin comment' : 'New bulletin comment',
                $request->user()->first_name . ' commented on ' . $post->title, $commentId);
            return $commentId;
        });
        return response()->json(['data' => ['id' => $commentId]], 201);
    }

    public function like(Request $request, int $id, BulletinCommunityService $service)
    {
        return $this->setState($request, $id, $service, 'bulletin_likes', 'liked');
    }

    public function follow(Request $request, int $id, BulletinCommunityService $service)
    {
        return $this->setState($request, $id, $service, 'bulletin_follows', 'following');
    }

    private function setState(Request $request, int $id, BulletinCommunityService $service, string $table, string $key)
    {
        $request->validate([$key => 'required|boolean']);
        DB::transaction(function () use ($request, $id, $service, $table, $key) {
            $service->post($request->user(), $id, true);
            $query = DB::table($table)->where('bulletin_id', $id)->where('user_id', $request->user()->id);
            if ($request->boolean($key)) {
                if (!$query->exists()) DB::table($table)->insert(['bulletin_id' => $id, 'user_id' => $request->user()->id,
                    'created_at' => now(), 'updated_at' => now()]);
            } else $query->delete();
        });
        return response()->json(['data' => $service->summary($id, $request->user()->id)]);
    }
}
