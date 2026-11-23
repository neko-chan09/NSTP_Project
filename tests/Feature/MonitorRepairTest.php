<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

class MonitorRepairTest extends ProjectReviewRegressionTest
{
    private User $studentUser;
    private User $teacher;
    private int $activityId;
    protected function setUp(): void
    {
        parent::setUp();
        config(['app.timezone'=>'Asia/Manila']); date_default_timezone_set('Asia/Manila');
        Carbon::setTestNow(Carbon::parse('2026-11-23 15:30:00 Asia/Manila'));
        Schema::table('activities',function(Blueprint $t){$t->string('title')->nullable();$t->string('venue')->nullable();$t->string('description')->nullable();$t->string('status')->default('active');$t->timestamp('start_datetime')->nullable();$t->timestamp('end_datetime')->nullable();$t->integer('geofence_radius')->default(20);});
        Schema::create('activity_participations',function(Blueprint $t){$t->id();$t->integer('activity_id');$t->integer('student_id');$t->boolean('is_tracking_location')->default(false);foreach(['checkin_latitude','checkin_longitude','latitude','longitude','distance_from_venue'] as $n)$t->double($n)->nullable();$t->boolean('is_within_geofence')->nullable();$t->string('attendance_status')->nullable();foreach(['check_in_at','attended_at','tracking_started_at','tracking_ended_at'] as $n)$t->timestamp($n)->nullable();$t->timestamps();});
        Schema::create('student_locations',function(Blueprint $t){$t->id();$t->integer('activity_id');$t->integer('student_id');$t->double('latitude');$t->double('longitude');$t->double('accuracy')->nullable();$t->boolean('is_within_geofence');$t->double('distance_from_venue')->nullable();$t->string('location_source');$t->timestamp('tracked_at');$t->timestamps();});
        $this->teacher=User::create(['first_name'=>'Faculty','last_name'=>'Test','email'=>'faculty@example.test','password'=>'password123','role'=>'faculty','is_active'=>true,'nstp_component'=>'cwts']);
        $this->studentUser=User::create(['first_name'=>'Student','last_name'=>'Test','email'=>'gps@example.test','password'=>'password123','role'=>'student','is_active'=>true]);
        $student=Student::create(['user_id'=>$this->studentUser->id,'student_id'=>'GPS-1']);
        $this->activityId=DB::table('activities')->insertGetId(['created_by'=>$this->teacher->id,'component_type'=>'cwts','latitude'=>8.48795,'longitude'=>124.609476,'start_datetime'=>now()->subHour(),'end_datetime'=>now()->addHour()]);
        DB::table('activity_participations')->insert(['activity_id'=>$this->activityId,'student_id'=>$student->id]);
    }
    private function payload():array {return ['latitude'=>8.48795,'longitude'=>124.609476,'accuracy'=>5,'captured_at'=>now()->subSeconds(3)->utc()->toIso8601String()];}
    private function start(array $payload){Sanctum::actingAs($this->studentUser);return $this->postJson('/api/student/activity/'.$this->activityId.'/start-tracking',$payload);}
    private function monitor(){Sanctum::actingAs($this->teacher);return $this->getJson('/api/activities/'.$this->activityId.'/map')->assertOk();}
    public function test_registered_students_without_gps_are_not_invented_positions():void
    {
        $this->monitor()->assertJsonPath('data.participants.0.latitude',null)->assertJsonPath('data.participants.0.has_location',false)->assertJsonPath('data.participants.0.location_state','not_sharing')->assertJsonPath('data.stats.waiting_for_location',1);
        $this->start([])->assertUnprocessable();
        $this->assertFalse((bool)DB::table('activity_participations')->value('is_tracking_location'));
        foreach([['accuracy'=>100],['captured_at'=>now()->subMinutes(5)->toIso8601String()]] as $delta)$this->start(array_replace($this->payload(),$delta))->assertUnprocessable();
        $this->assertSame(0,DB::table('student_locations')->count());
    }
    public function test_fresh_utc_phone_fix_is_stored_in_database_timezone_and_visible():void
    {
        $this->start($this->payload())->assertOk();
        $this->assertSame('2026-11-23 15:29:57',DB::table('student_locations')->value('tracked_at'));
        $this->monitor()->assertJsonPath('data.participants.0.location_state','received')->assertJsonPath('data.participants.0.is_within_geofence',true)->assertJsonPath('data.stats.within_geofence',1);
        $this->assertTrue(Carbon::parse($this->monitor()->json('data.participants.0.location_recorded_at'))->equalTo(now()->subSeconds(3)));
    }
    public function test_legacy_millisecond_timestamp_can_start_and_unregistered_users_cannot():void
    {
        $payload=$this->payload();unset($payload['captured_at']);$payload['timestamp']=now()->getTimestampMs();
        $this->start($payload)->assertOk();
        DB::table('activity_participations')->delete();$this->start($payload)->assertForbidden();
    }
    public function test_movement_updates_and_delayed_higher_id_cannot_rewind_monitor():void
    {
        $this->start($this->payload())->assertOk();
        Sanctum::actingAs($this->studentUser);
        $this->postJson('/api/student/location/update',array_replace($this->payload(),['activity_id'=>$this->activityId,'latitude'=>8.489,'captured_at'=>now()->utc()->toIso8601String()]))->assertOk();
        $row=(array)DB::table('student_locations')->first();unset($row['id']);$row['tracked_at']=now()->subSeconds(20)->format('Y-m-d H:i:s');$row['latitude']=8.48;DB::table('student_locations')->insert($row);
        $this->monitor()->assertJsonPath('data.participants.0.latitude',8.489)->assertJsonPath('data.participants.0.is_within_geofence',false);
        Carbon::setTestNow(now()->addSeconds(65));$this->monitor()->assertJsonPath('data.participants.0.is_within_geofence',null)->assertJsonPath('data.stats.outside_geofence',0);
    }
    public function test_stopped_sharing_retains_last_location_but_not_live_inside_count():void
    {
        $this->start($this->payload())->assertOk();DB::table('activity_participations')->update(['is_tracking_location'=>false]);
        $this->monitor()->assertJsonPath('data.participants.0.location_state','stopped')->assertJsonPath('data.participants.0.has_location',true)->assertJsonPath('data.stats.within_geofence',0);
    }
    public function test_retry_sharing_keeps_original_activity_checkin():void
    {
        $this->start($this->payload())->assertOk();
        $first=DB::table('activity_participations')->first();
        Carbon::setTestNow(now()->addSeconds(15));
        $this->start(array_replace($this->payload(),['latitude'=>8.489]))->assertOk();
        $current=DB::table('activity_participations')->first();
        $this->assertSame($first->check_in_at,$current->check_in_at);
        $this->assertEquals($first->checkin_latitude,$current->checkin_latitude);
        $this->assertEquals(8.489,$current->latitude);
    }
}
