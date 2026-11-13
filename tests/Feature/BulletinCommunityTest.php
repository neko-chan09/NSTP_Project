<?php
namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use App\Services\BulletinCommunityService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BulletinCommunityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite' => [
            'driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true],
            'cache.default' => 'array', 'session.driver' => 'array']);
        DB::purge('sqlite');
        Schema::create('users', function (Blueprint $t) {
            $t->id(); $t->string('first_name'); $t->string('last_name'); $t->string('email')->unique();
            $t->string('password'); $t->string('role'); $t->string('profile_photo')->nullable();
            $t->boolean('is_active')->default(true); $t->rememberToken(); $t->softDeletes(); $t->timestamps();
        });
        Schema::create('students', function (Blueprint $t) { $t->id(); $t->foreignId('user_id'); $t->string('nstp_component_selected')->nullable(); $t->timestamps(); });
        Schema::create('bulletin_board', function (Blueprint $t) {
            $t->id(); $t->string('title'); $t->text('content'); $t->string('category')->default('general');
            $t->string('target_audience')->default('all'); $t->timestamp('display_from'); $t->timestamp('display_until')->nullable();
            $t->boolean('is_featured')->default(false); $t->integer('views')->default(0); $t->foreignId('created_by')->constrained('users'); $t->timestamps();
        });
        Schema::create('notifications', function (Blueprint $t) {
            $t->id(); $t->foreignId('user_id')->constrained('users'); $t->string('title'); $t->text('message');
            $t->string('type'); $t->text('data')->nullable(); $t->boolean('is_read')->default(false); $t->timestamp('read_at')->nullable(); $t->timestamps();
        });
        (require database_path('migrations/2026_11_13_000001_add_bulletin_interactions.php'))->up();
        Storage::fake('public');
    }

    private function person(string $role, string $component = 'cwts'): User
    {
        $user = User::create(['first_name' => 'Test', 'last_name' => ucfirst($role), 'role' => $role,
            'email' => uniqid() . '@example.test', 'password' => 'unused', 'is_active' => true]);
        if ($role === 'student') DB::table('students')->insert(['user_id' => $user->id, 'nstp_component_selected' => $component]);
        return $user;
    }
    private function makePost(User $author, array $extra = []): int
    {
        return DB::table('bulletin_board')->insertGetId($extra + ['created_by' => $author->id, 'title' => 'Orientation',
            'content' => 'Bring your ID', 'target_audience' => 'all', 'category' => 'general',
            'display_from' => now()->subMinute(), 'created_at' => now(), 'updated_at' => now()]);
    }
    public function test_audience_and_write_authorization_cover_detail_and_interactions(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student', 'rotc'); $faculty = $this->person('faculty');
        $private = $this->makePost($admin, ['target_audience' => 'cwts']);
        Sanctum::actingAs($student);
        $this->getJson("/api/bulletin/{$private}")->assertNotFound();
        $this->getJson("/api/bulletin/{$private}/discussion")->assertNotFound();
        $this->putJson("/api/bulletin/{$private}/like", ['liked' => true])->assertNotFound();
        $this->postJson('/api/bulletin', ['title' => 'Injected', 'content' => 'No'])->assertForbidden();
        Sanctum::actingAs($faculty);
        $this->putJson("/api/bulletin/{$private}", ['title' => 'Changed', 'content' => 'No'])->assertForbidden();
        $all = $this->makePost($admin);
        $response = $this->getJson("/api/bulletin/{$all}")->assertOk();
        $response->assertJsonMissingPath('data.user.email')->assertJsonMissingPath('data.user.password');
    }

    public function test_comments_are_idempotent_and_replies_notify_only_the_right_people(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student'); $other = $this->person('student');
        $id = $this->makePost($admin); $differentPost = $this->makePost($admin);
        Sanctum::actingAs($student);
        $payload = ['body' => 'Question?', 'client_id' => 'same-request'];
        $first = $this->postJson("/api/bulletin/{$id}/comments", $payload)->assertCreated()->json('data.id');
        $this->postJson("/api/bulletin/{$id}/comments", $payload)->assertCreated()->assertJsonPath('data.id', $first);
        $this->assertSame(1, DB::table('bulletin_comments')->count()); $this->assertSame(1, Notification::count());
        Sanctum::actingAs($other);
        $this->postJson("/api/bulletin/{$differentPost}/comments", ['body' => 'Bad reply', 'parent_id' => $first, 'client_id' => 'wrong-post'])->assertUnprocessable();
        $reply = $this->postJson("/api/bulletin/{$id}/comments", ['body' => 'Answer', 'parent_id' => $first, 'client_id' => 'reply-request'])->assertCreated()->json('data.id');
        $this->assertSame(1, Notification::where('user_id', $student->id)->count());
        $this->assertSame(0, Notification::where('user_id', $other->id)->count());
        $this->getJson("/api/bulletin/{$id}/discussion?comment_id={$reply}")->assertOk()->assertJsonCount(2, 'data');
        $this->postJson("/api/bulletin/{$id}/comments", ['body' => '   ', 'client_id' => 'empty'])->assertUnprocessable();
    }

    public function test_likes_and_follows_use_explicit_idempotent_state(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student'); $id = $this->makePost($admin);
        Sanctum::actingAs($student);
        foreach ([true, true, false, false] as $liked) {
            $this->putJson("/api/bulletin/{$id}/like", ['liked' => $liked])->assertOk()->assertJsonPath('data.likes_count', $liked ? 1 : 0);
        }
        $this->putJson("/api/bulletin/{$id}/follow", ['following' => true])->assertOk();
        $this->putJson("/api/bulletin/{$id}/follow", ['following' => true])->assertOk();
        $this->assertSame(1, DB::table('bulletin_follows')->count());
    }

    public function test_new_and_scheduled_updates_respect_audience_followers_and_delivery_once(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student'); $outsider = $this->person('student', 'rotc');
        $id = $this->makePost($admin, ['target_audience' => 'cwts', 'display_from' => now()->addHour()]);
        $service = app(BulletinCommunityService::class); $post = DB::table('bulletin_board')->find($id);
        $service->schedule($post, $admin, 'new'); $this->assertSame(0, $service->dispatchDue());
        DB::table('bulletin_board')->where('id', $id)->update(['display_from' => now()->subMinute()]);
        DB::table('bulletin_notification_events')->where('bulletin_id', $id)->update(['due_at' => now()->subMinute()]);
        $this->assertSame(1, $service->dispatchDue()); $this->assertSame(0, $service->dispatchDue());
        $this->assertSame(1, Notification::where('user_id', $student->id)->count());
        $this->assertSame(0, Notification::where('user_id', $outsider->id)->count());
        Sanctum::actingAs($student); $this->putJson("/api/bulletin/{$id}/follow", ['following' => true])->assertOk();
        $service->schedule(DB::table('bulletin_board')->find($id), $admin, 'update'); $service->dispatchDue();
        $this->assertSame(2, Notification::where('user_id', $student->id)->count());
        $this->putJson("/api/bulletin/{$id}/follow", ['following' => false])->assertOk();
        $service->schedule(DB::table('bulletin_board')->find($id), $admin, 'update'); $service->dispatchDue();
        $this->assertSame(2, Notification::where('user_id', $student->id)->count());
    }

    public function test_notification_ownership_and_unread_counts(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student'); $id = $this->makePost($admin);
        app(BulletinCommunityService::class)->notify([$student->id], $admin, DB::table('bulletin_board')->find($id), 'Update', 'Message');
        $notice = Notification::first(); Sanctum::actingAs($admin);
        $this->postJson("/api/notifications/{$notice->id}/read")->assertNotFound();
        Sanctum::actingAs($student);
        $this->getJson('/api/notifications')->assertOk()->assertJsonPath('unread_count', 1);
        $this->postJson("/api/notifications/{$notice->id}/read")->assertOk();
        $this->postJson("/api/notifications/{$notice->id}/read")->assertOk();
        $this->getJson('/api/notifications')->assertJsonPath('unread_count', 0);
    }

    public function test_saving_unchanged_content_does_not_send_update_notifications(): void
    {
        $admin = $this->person('admin'); $student = $this->person('student'); $id = $this->makePost($admin);
        Sanctum::actingAs($student); $this->putJson("/api/bulletin/{$id}/follow", ['following' => true])->assertOk();
        Sanctum::actingAs($admin);
        $post = DB::table('bulletin_board')->find($id);
        $this->putJson("/api/bulletin/{$id}", ['title' => $post->title, 'content' => $post->content,
            'display_from' => \Carbon\Carbon::parse($post->display_from)->toIso8601String(), 'is_featured' => false])->assertOk();
        $this->assertSame(0, Notification::count());
    }

    public function test_profile_photo_is_normalized_served_without_symlink_and_missing_photo_is_null(): void
    {
        $user = $this->person('student'); Sanctum::actingAs($user);
        $image = imagecreatetruecolor(30, 30); imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
        ob_start(); imagepng($image); $bytes = ob_get_clean(); imagedestroy($image);
        $response = $this->post('/api/profile/photo', ['photo' => UploadedFile::fake()->createWithContent('alpha.png', $bytes)], ['Accept' => 'application/json'])->assertOk();
        $path = $response->json('data.profile_photo'); $this->assertStringEndsWith('.jpg', $path);
        $jpeg = imagecreatefromstring(Storage::disk('public')->get($path));
        $pixel = imagecolorat($jpeg, 0, 0); imagedestroy($jpeg); $this->assertGreaterThan(240, ($pixel >> 16) & 255);
        $this->get('/api/profile-photos/' . $user->id)->assertOk()->assertHeader('Content-Type', 'image/jpeg');
        Storage::disk('public')->delete($path); $this->assertNull($user->fresh()->profile_photo_url);
        $this->get('/api/profile-photos/' . $user->id)->assertNotFound();
    }

    public function test_class_deletion_is_disabled_in_both_controllers_and_routes(): void
    {
        $user = $this->person('admin'); Sanctum::actingAs($user);
        $this->deleteJson('/api/admin/classes/123')->assertStatus(405);
        $this->assertSame(405, app(\App\Http\Controllers\API\Web\Admin\ClassController::class)->destroy(123)->status());
        $this->assertSame(405, app(\App\Http\Controllers\API\Mobile\Faculty\ClassController::class)->destroy(request(), 123)->status());
    }
}
