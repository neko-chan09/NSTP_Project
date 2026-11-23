<?php
namespace Tests\Feature;
use App\Models\Activity;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

class ActivityArchiveTest extends MonitorRepairTest
{
    public function test_completed_records_and_participants_are_read_only_for_all_management_roles():void
    {
        $activity=Activity::first();DB::table('activities')->where('id',$activity->id)->update(['end_datetime'=>now()->subMinute(),'title'=>'Archived title']);
        $participant=DB::table('activity_participations')->first();
        foreach(['faculty','admin','super_admin'] as $role){
            $user=$role==='faculty'?User::where('role','faculty')->first():User::create(['first_name'=>'Archive','last_name'=>$role,'email'=>$role.'@archive.test','password'=>'password123','role'=>$role,'is_active'=>true]);Sanctum::actingAs($user);
            $this->getJson('/api/activities/'.$activity->id)->assertOk()->assertJsonPath('data.status','completed');
            $this->getJson('/api/activities/'.$activity->id.'/participants')->assertOk();
            $this->putJson('/api/activities/'.$activity->id,['title'=>'Changed'])->assertStatus(409);
            $this->deleteJson('/api/activities/'.$activity->id)->assertStatus(409);
            $this->putJson('/api/activities/'.$activity->id.'/participants/'.$participant->id,['attendance_status'=>'absent'])->assertStatus(409);
            $this->deleteJson('/api/activities/'.$activity->id.'/participants/'.$participant->id)->assertStatus(409);
            $this->putJson('/api/activities/'.$activity->id.'/location',['latitude'=>8.49,'longitude'=>124.6])->assertStatus(409);
        }
        $this->assertSame('Archived title',DB::table('activities')->value('title'));
        $this->assertSame(1,DB::table('activity_participations')->count());
        Sanctum::actingAs(User::where('role','student')->first());$this->postJson('/api/student/activities/'.$activity->id.'/register')->assertStatus(409);
    }
    public function test_activity_automatically_becomes_read_only_at_scheduled_end():void
    {
        $activity=Activity::first();$this->assertSame('ongoing',$activity->status);
        Carbon::setTestNow($activity->end_datetime->copy());
        $this->assertSame('completed',$activity->fresh()->status);
        Sanctum::actingAs(User::where('role','faculty')->first());
        $this->putJson('/api/activities/'.$activity->id,['end_datetime'=>now()->addHour()->toIso8601String()])->assertStatus(409);
    }
    public function test_upcoming_activity_can_still_be_edited_and_explicit_completion_is_final():void
    {
        Schema::table('activities',fn(Blueprint $t)=>$t->timestamps());
        $activity=Activity::first();DB::table('activities')->where('id',$activity->id)->update(['start_datetime'=>now()->addHour(),'end_datetime'=>now()->addHours(2)]);
        Sanctum::actingAs(User::where('role','faculty')->first());
        $this->putJson('/api/activities/'.$activity->id,['title'=>'Future edit'])->assertOk();
        $this->putJson('/api/activities/'.$activity->id,['status'=>'completed'])->assertOk()->assertJsonPath('data.status','completed');
        $this->putJson('/api/activities/'.$activity->id,['status'=>'upcoming'])->assertStatus(409);
    }
    public function test_archive_location_monitor_returns_historical_points_and_filters_derived_status():void
    {
        $activity=Activity::first();DB::table('activities')->where('id',$activity->id)->update(['end_datetime'=>now()->subMinute(),'status'=>'upcoming']);
        $participation=DB::table('activity_participations')->first();
        DB::table('activity_participations')->update(['is_tracking_location'=>true]);
        DB::table('student_locations')->insert(['activity_id'=>$activity->id,'student_id'=>$participation->student_id,'latitude'=>$activity->latitude,'longitude'=>$activity->longitude,'accuracy'=>5,'is_within_geofence'=>true,'location_source'=>'gps','tracked_at'=>now()]);
        Sanctum::actingAs(User::where('role','faculty')->first());
        $this->getJson('/api/activities/'.$activity->id.'/map')->assertOk()->assertJsonPath('data.participants.0.historical',true)->assertJsonPath('data.participants.0.is_tracking',false)->assertJsonPath('data.participants.0.is_within_geofence',null);
        $this->getJson('/api/activities/map?status=completed')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.status','completed');
        $this->getJson('/api/activities/map?status=upcoming')->assertOk()->assertJsonCount(0,'data');
    }
}
