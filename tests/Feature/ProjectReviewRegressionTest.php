<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use App\Models\AttendanceSession;
use App\Models\PasswordResetOtp;
use App\Services\AttendanceCaptureWindow;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectReviewRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite' => ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true], 'cache.default' => 'array', 'session.driver' => 'array']);
        DB::purge('sqlite');
        foreach (['0001_01_01_000000_create_framework_tables.php', '2026_03_26_000002_create_students_table.php',
            '2026_06_28_000001_create_classes_and_attendance_tables.php', '2026_11_13_000002_secure_password_reset_tokens.php'] as $name) {
            (require database_path('migrations/' . $name))->up();
        }
        Schema::table('users', fn(Blueprint $t) => $t->boolean('must_change_password')->default(false));
        Schema::create('settings', function (Blueprint $t) { $t->id(); $t->string('key')->unique(); $t->text('value')->nullable(); $t->timestamps(); });
        Schema::create('activities', function (Blueprint $t) { $t->id(); $t->foreignId('created_by'); $t->string('component_type'); $t->decimal('latitude')->nullable(); $t->decimal('longitude')->nullable(); });
        Storage::fake('public'); Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-11-13 10:00:00 UTC'));
    }
    protected function tearDown(): void { Carbon::setTestNow(); parent::tearDown(); }
    private function person(string $role = 'student'): User
    {
        $user = User::create(['first_name' => 'Test', 'last_name' => ucfirst($role), 'email' => uniqid() . '@example.test',
            'student_id' => 'S-' . uniqid(), 'role' => $role, 'password' => Hash::make('old-password'), 'is_active' => true, 'nstp_component' => 'cwts']);
        if ($role === 'student') Student::create(['user_id' => $user->id, 'student_id' => $user->student_id, 'total_training_hours' => 90]);
        return $user;
    }
    private function enrollment(User $teacher, User $student): int
    {
        $id = DB::table('classes')->insertGetId(['teacher_id' => $teacher->id, 'name' => 'Test class', 'component_type' => 'cwts', 'join_code' => uniqid(), 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        DB::table('class_students')->insert(['class_id' => $id, 'student_id' => $student->student->id, 'status' => 'active']);
        return $id;
    }
    public function test_private_routes_reject_public_and_wrong_role_requests_before_data_access(): void
    {
        $this->getJson('/api/activities/map')->assertUnauthorized();
        $this->putJson('/api/activities/1/location', ['latitude' => 1, 'longitude' => 2])->assertUnauthorized();
        $student = $this->person(); Sanctum::actingAs($student);
        foreach (['/api/superadmin/users', '/api/superadmin/backups', '/api/admin/students', '/api/faculty/classes', '/api/activities/map', '/api/settings', '/api/office-documents', '/api/ocr-stats'] as $url) $this->getJson($url)->assertForbidden();
        $this->putJson('/api/settings', ['app_name' => 'No'])->assertForbidden();
        $faculty = $this->person('faculty'); Sanctum::actingAs($faculty);
        $this->getJson('/api/superadmin/users')->assertForbidden();
        $this->getJson('/api/admin/students')->assertForbidden();
    }
    public function test_inactive_accounts_cannot_login_or_use_existing_tokens(): void
    {
        $user = $this->person('admin'); $user->update(['is_active' => false]);
        $this->postJson('/api/admin/login', ['email' => $user->email, 'password' => 'old-password'])->assertUnauthorized();
        Sanctum::actingAs($user);
        $this->getJson('/api/me')->assertForbidden();
    }
    public function test_reset_requires_the_secret_expiry_and_single_use_and_revokes_tokens(): void
    {
        $user = $this->person(); $user->createToken('prior-session');
        $otp = PasswordResetOtp::createOtp($user->email);
        $token = $this->postJson('/api/api/verify-otp', ['email' => $user->email, 'otp' => $otp->otp])->assertOk()->json('data.reset_token');
        [$id, $secret] = explode('|', $token);
        $this->assertSame(hash('sha256', $secret), $otp->fresh()->reset_token_hash);
        $payload = ['email' => $user->email, 'new_password' => 'new-password', 'new_password_confirmation' => 'new-password'];
        $this->postJson('/api/api/reset', $payload + ['reset_token' => $id . '|' . str_repeat('a', 64)])->assertStatus(400);
        $otp->fresh()->update(['reset_expires_at' => now()->subSecond()]);
        $this->postJson('/api/api/reset', $payload + ['reset_token' => $token])->assertStatus(400);
        $otp->fresh()->update(['reset_expires_at' => now()->addMinute()]);
        $this->postJson('/api/api/reset', $payload + ['reset_token' => $token])->assertOk();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/api/reset', $payload + ['reset_token' => $token])->assertStatus(400);
    }
    public function test_otp_attempt_limit_and_consumption_prevent_repeated_verification(): void
    {
        $user = $this->person(); $otp = PasswordResetOtp::createOtp($user->email); $otp->update(['otp' => '123456']);
        for ($i = 0; $i < 5; $i++) $this->postJson('/api/api/verify-otp', ['email' => $user->email, 'otp' => '000000'])->assertStatus(400);
        $this->postJson('/api/api/verify-otp', ['email' => $user->email, 'otp' => '123456'])->assertStatus(400);
        $next = PasswordResetOtp::createOtp($user->email);
        $this->postJson('/api/api/verify-otp', ['email' => $user->email, 'otp' => $next->otp])->assertOk();
        $this->postJson('/api/api/verify-otp', ['email' => $user->email, 'otp' => $next->otp])->assertStatus(400);
    }
    public function test_registration_creates_the_student_profile_atomically(): void
    {
        $response = $this->postJson('/api/register', ['first_name' => 'New', 'last_name' => 'Student', 'email' => 'new@example.test', 'password' => 'password123', 'student_id' => 'NEW-001'])->assertCreated();
        $user = User::findOrFail($response->json('user.id'));
        $this->assertSame('NEW-001', $user->student->student_id);
        $this->postJson('/api/register', ['first_name' => 'New', 'last_name' => 'Student', 'email' => 'other@example.test', 'password' => 'password123', 'student_id' => 'NEW-001'])->assertUnprocessable();
    }
    public function test_mobile_photo_route_uses_the_same_normalized_upload_path(): void
    {
        $user = $this->person(); Sanctum::actingAs($user);
        $response = $this->post('/api/student/profile/photo', ['photo' => UploadedFile::fake()->image('avatar.png')], ['Accept' => 'application/json'])->assertOk();
        $this->assertStringEndsWith('.jpg', $response->json('data.profile_photo'));
        $this->deleteJson('/api/student/profile/photo')->assertOk();
        $this->assertNull($user->fresh()->profile_photo);
    }
    public function test_settings_are_validated_and_faculty_cannot_edit_another_activity(): void
    {
        $admin = $this->person('admin'); Sanctum::actingAs($admin);
        DB::table('settings')->insert(['key' => 'app_name', 'value' => 'Before', 'created_at' => now()->subYear(), 'updated_at' => now()]);
        $before = DB::table('settings')->value('created_at');
        $this->putJson('/api/settings', ['app_name' => 'After'])->assertOk();
        $this->assertSame($before, DB::table('settings')->value('created_at'));
        $this->putJson('/api/settings', ['unknown_api_secret' => 'No'])->assertUnprocessable();
        $this->putJson('/api/settings', ['face_threshold' => 8])->assertUnprocessable();
        $faculty = $this->person('faculty'); Sanctum::actingAs($faculty);
        $activity = DB::table('activities')->insertGetId(['created_by' => $admin->id, 'component_type' => 'rotc']);
        $this->putJson("/api/activities/{$activity}/location", ['latitude' => 8, 'longitude' => 124])->assertNotFound();
        $this->putJson("/api/activities/{$activity}/location", ['latitude' => 200, 'longitude' => 124])->assertUnprocessable();
    }
    public function test_student_cannot_read_or_close_other_class_attendance(): void
    {
        $teacher = $this->person('faculty'); $student = $this->person(); $other = $this->person();
        $class = $this->enrollment($teacher, $other);
        $session = AttendanceSession::create(['class_id' => $class, 'faculty_id' => $teacher->id, 'status' => 'active', 'start_time' => now()->subHour(), 'end_time' => now()->addHour()]);
        Sanctum::actingAs($student);
        $this->getJson('/api/attendance/sessions/' . $session->id)->assertForbidden();
        $this->patchJson('/api/attendance/session/' . $session->id . '/close')->assertForbidden();
        $this->getJson('/api/attendance/session/' . $session->id . '/logs')->assertForbidden();
        $this->assertSame('active', $session->fresh()->status);
    }
    public function test_offline_sync_records_original_session_time_and_credits_once(): void
    {
        $teacher = $this->person('faculty'); $student = $this->person(); $class = $this->enrollment($teacher, $student);
        $old = AttendanceSession::create(['class_id' => $class, 'faculty_id' => $teacher->id, 'is_scheduled' => true, 'status' => 'closed',
            'scheduled_start' => now()->subHours(2), 'scheduled_end' => now()->subMinutes(30), 'start_time' => now()->subHours(2), 'end_time' => now()->subMinutes(45), 'grace_period_minutes' => 15]);
        AttendanceSession::create(['class_id' => $class, 'faculty_id' => $teacher->id, 'status' => 'active', 'start_time' => now()->subMinutes(5), 'end_time' => now()->addHour()]);
        Sanctum::actingAs($student); $vector = array_merge([1.0], array_fill(0, 191, 0.0));
        $this->postJson('/api/student/face-embeddings', ['embeddings' => ['front' => $vector, 'left' => $vector, 'right' => $vector]])->assertOk();
        $this->getJson('/api/student/face-template')->assertOk()->assertJsonCount(192, 'data.front')->assertHeader('Cache-Control', 'no-store, private');
        $captured = now()->subHour();
        $payload = ['class_id' => $class, 'session_id' => $old->id, 'offline' => true, 'captured_at' => $captured->toIso8601String(), 'embedding' => $vector, 'client_id' => 'offline-one'];
        $response = $this->postJson('/api/attendance/checkin', $payload)->assertOk()->assertJsonPath('match', true)->assertJsonPath('data.session_id', $old->id);
        $this->assertTrue(Carbon::parse($response->json('data.check_in_at'))->equalTo($captured));
        $this->assertSame(45, $response->json('data.minutes_late'));
        $this->postJson('/api/attendance/checkin', $payload)->assertOk();
        $this->assertSame(1, DB::table('attendance_logs')->count());
        $this->assertSame(1, $student->student->fresh()->completed_training_hours);
        $payload['captured_at'] = now()->toIso8601String();
        $this->postJson('/api/attendance/checkin', $payload)->assertUnprocessable();
    }
    public function test_invalid_face_vectors_and_cancelled_sessions_are_rejected(): void
    {
        $student = $this->person(); Sanctum::actingAs($student);
        $zeros = array_fill(0, 192, 0);
        $this->postJson('/api/student/face-embeddings', ['embeddings' => ['front' => $zeros, 'left' => $zeros, 'right' => $zeros]])->assertUnprocessable();
        $session = new AttendanceSession(['status' => 'cancelled', 'start_time' => now()->subHour(), 'end_time' => now()->addHour()]);
        try {
            app(AttendanceCaptureWindow::class)->time($session, true, now()->toIso8601String());
            $this->fail('Cancelled attendance sessions must reject captures.');
        } catch (\Illuminate\Validation\ValidationException $exception) {
            $this->assertArrayHasKey('session_id', $exception->errors());
        }
    }
}

