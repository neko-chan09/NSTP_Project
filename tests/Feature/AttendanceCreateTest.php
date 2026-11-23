<?php
namespace Tests\Feature;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

class AttendanceCreateTest extends ProjectReviewRegressionTest
{
    private function payload():array
    {
        $user=User::create(['first_name'=>'Faculty','last_name'=>'Test','email'=>'schedule@example.test','role'=>'faculty','nstp_component'=>'cwts','password'=>'password123','is_active'=>true]);
        $id=DB::table('classes')->insertGetId(['teacher_id'=>$user->id,'name'=>'CWTS Section A','component_type'=>'cwts','status'=>'active','join_code'=>'SCHEDULE-TEST','created_at'=>now(),'updated_at'=>now()]);
        Sanctum::actingAs($user);return ['class_id'=>$id,'component'=>'cwts','section'=>'A','scheduled_start'=>'2026-11-24T00:45:00+08:00','scheduled_end'=>'2026-11-24T02:30:00+08:00','require_location'=>true,'latitude'=>8.487961,'longitude'=>124.609493,'geofence_radius'=>30];
    }
    public function test_1245_am_to_230_am_same_day_creates_session_with_correct_philippine_times():void
    {
        $payload=$this->payload();Carbon::setTestNow(Carbon::parse('2026-11-24 00:30 Asia/Manila'));
        $response=$this->postJson('/api/attendance/session',$payload)->assertCreated();
        $this->assertTrue(Carbon::parse($response->json('data.scheduled_start'))->equalTo(Carbon::parse($payload['scheduled_start'])));
        $this->assertSame('2026-11-24 02:30:00',DB::table('attendance_sessions')->value('end_time'));
    }
    public function test_1245_pm_to_230_am_requires_the_next_date_and_returns_a_field_message():void
    {
        $payload=$this->payload();$payload['scheduled_start']='2026-11-24T12:45:00+08:00';
        $response=$this->postJson('/api/attendance/session',$payload)->assertUnprocessable()->assertJsonValidationErrors('scheduled_end');
        $this->assertNotEmpty($response->json('message'));
        $payload['scheduled_end']='2026-11-25T02:30:00+08:00';$this->postJson('/api/attendance/session',$payload)->assertCreated();
    }
    public function test_missing_times_produce_actionable_validation_errors_without_creating_rows():void
    {
        $payload=$this->payload();unset($payload['scheduled_start']);
        $this->postJson('/api/attendance/session',$payload)->assertUnprocessable()->assertJsonValidationErrors('scheduled_start');
        $this->assertSame(0,DB::table('attendance_sessions')->count());
    }
}
