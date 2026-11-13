<?php
namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Services\BulletinCommunityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BulletinController extends Controller
{
    public function __construct(private BulletinCommunityService $community) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = DB::table('bulletin_board as b')->select('b.*');
        foreach (['likes_count' => 'bulletin_likes', 'comments_count' => 'bulletin_comments',
            'liked' => 'bulletin_likes', 'following' => 'bulletin_follows'] as $field => $table) {
            $sub = DB::table($table)->whereColumn('bulletin_id', 'b.id')->selectRaw('count(*)');
            if (in_array($field, ['liked', 'following'], true)) $sub->where('user_id', $user->id);
            $query->selectSub($sub, $field);
        }
        if ($request->filled('date')) $query->whereDate('b.display_from', $request->date);
        elseif (!in_array($user->role, ['admin', 'super_admin'], true)) {
            $query->where('b.display_from', '<=', now())->where(fn($q) => $q->whereNull('b.display_until')->orWhere('b.display_until', '>=', now()));
        }
        $posts = $query->orderByDesc('b.is_featured')->orderByDesc('b.created_at')->get()
            ->filter(fn($post) => $this->community->visibleTo($user, $post))->values();
        foreach ($posts as $post) {
            $post->liked = (bool) $post->liked; $post->following = (bool) $post->following;
            $post->likes_count = (int) $post->likes_count; $post->comments_count = (int) $post->comments_count;
        }
        return response()->json(['success' => true, 'data' => $posts])->header('Cache-Control', 'no-store');
    }

    public function show(Request $request, int $id)
    {
        $post = $this->community->post($request->user(), $id);
        DB::table('bulletin_board')->where('id', $id)->increment('views');
        $post->views++;
        $post->user = DB::table('users')->where('id', $post->created_by)->first(['id', 'first_name', 'last_name', 'role']);
        foreach ($this->community->summary($id, $request->user()->id) as $key => $value) $post->$key = $value;
        return response()->json(['success' => true, 'data' => $post])->header('Cache-Control', 'no-store');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['title' => 'required|string|max:255', 'content' => 'required|string|max:20000',
            'target_audience' => 'nullable|in:all,students,faculty,cwts,rotc,lts', 'category' => 'nullable|string|max:60',
            'display_from' => 'nullable|date', 'display_until' => 'nullable|date|after:display_from', 'is_featured' => 'nullable|boolean']);
    }

    private function fields(array $data): array
    {
        return ['title' => $data['title'], 'content' => $data['content'], 'category' => $data['category'] ?? 'general',
            'target_audience' => $data['target_audience'] ?? 'all', 'display_from' => $data['display_from'] ?? now(),
            'display_until' => $data['display_until'] ?? null, 'is_featured' => (bool) ($data['is_featured'] ?? false), 'updated_at' => now()];
    }

    private function dispatch(): void
    {
        try { $this->community->dispatchDue(); }
        catch (\Throwable $error) { Log::warning('Bulletin notifications pending scheduled retry', ['error' => $error->getMessage()]); }
    }

    public function store(Request $request)
    {
        $this->community->authorizeWrite($request->user());
        $data = $this->validated($request);
        $post = DB::transaction(function () use ($request, $data) {
            $id = DB::table('bulletin_board')->insertGetId($this->fields($data) + ['created_by' => $request->user()->id, 'created_at' => now(), 'views' => 0]);
            $post = DB::table('bulletin_board')->find($id);
            $this->community->schedule($post, $request->user(), 'new');
            return $post;
        });
        $this->dispatch();
        return response()->json(['success' => true, 'data' => $post], 201);
    }

    public function update(Request $request, int $id)
    {
        $existing = DB::table('bulletin_board')->find($id);
        abort_unless($existing, 404);
        $this->community->authorizeWrite($request->user(), $existing);
        $data = $this->validated($request);
        $post = DB::transaction(function () use ($request, $data, $id) {
            $old = DB::table('bulletin_board')->where('id', $id)->lockForUpdate()->first();
            abort_unless($old, 404);
            $fields = $this->fields($data);
            $changed = false;
            foreach ($fields as $key => $value) {
                if ($key === 'updated_at') continue;
                if ($key === 'is_featured') {
                    if ((bool) $old->$key !== (bool) $value) $changed = true;
                } elseif (in_array($key, ['display_from', 'display_until'], true) && $old->$key && $value) {
                    if (!\Carbon\Carbon::parse($old->$key)->equalTo(\Carbon\Carbon::parse($value))) $changed = true;
                } elseif ((string) $old->$key !== (string) $value) $changed = true;
            }
            DB::table('bulletin_board')->where('id', $id)->update($fields);
            $post = DB::table('bulletin_board')->find($id);
            if ($changed) $this->community->schedule($post, $request->user(), 'update');
            return $post;
        });
        $this->dispatch();
        return response()->json(['success' => true, 'data' => $post]);
    }

    public function destroy(Request $request, int $id)
    {
        $post = DB::table('bulletin_board')->find($id);
        abort_unless($post, 404);
        $this->community->authorizeWrite($request->user(), $post);
        DB::table('bulletin_board')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}
