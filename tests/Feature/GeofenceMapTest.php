<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

class GeofenceMapTest extends ProjectReviewRegressionTest
{
    public function test_map_returns_latest_fix_with_its_own_accuracy_and_time(): void
    {
        $admin = User::create(['first_name'=>'Map','last_name'=>'Admin','email'=>'map@example.test','password'=>'password123','role'=>'admin','is_active'=>true]);
        $studentUser = User::create(['first_name'=>'GPS','last_name'=>'Student','email'=>'gps@example.test','password'=>'password123','role'=>'student','is_active'=>true]);
        $student = Student::create(['user_id'=>$studentUser->id,'student_id'=>'GPS-01']);
        Schema::table('activities', function(Blueprint $t) { $t->string('title')->nullable(); $t->string('venue')->nullable(); $t->integer('geofence_radius')->default(10); });
        Schema::create('activity_participations', function(Blueprint $t) { $t->id(); $t->integer('activity_id'); $t->integer('student_id'); $t->double('checkin_latitude')->nullable(); $t->double('checkin_longitude')->nullable(); $t->timestamp('check_in_at')->nullable(); });
        Schema::create('student_locations', function(Blueprint $t) { $t->id(); $t->integer('activity_id'); $t->integer('student_id'); $t->double('latitude'); $t->double('longitude'); $t->double('accuracy')->nullable(); $t->timestamp('tracked_at'); });
        $activity=DB::table('activities')->insertGetId(['created_by'=>$admin->id,'component_type'=>'cwts','title'=>'Geofence test','latitude'=>0,'longitude'=>124,'geofence_radius'=>10]);
        DB::table('activity_participations')->insert(['activity_id'=>$activity,'student_id'=>$student->id,'checkin_latitude'=>8,'checkin_longitude'=>124,'check_in_at'=>now()->subHour()]);
        DB::table('student_locations')->insert(['activity_id'=>$activity,'student_id'=>$student->id,'latitude'=>0,'longitude'=>124.001,'accuracy'=>50,'tracked_at'=>now()->subMinutes(2)]);
        DB::table('student_locations')->insert(['activity_id'=>$activity,'student_id'=>$student->id,'latitude'=>0,'longitude'=>124.0001,'accuracy'=>8,'tracked_at'=>now()->subMinute()]);
        Sanctum::actingAs($admin);
        $response=$this->getJson('/api/activities/'.$activity.'/map')->assertOk()->assertJsonPath('data.participants.0.accuracy',8)->assertJsonPath('data.participants.0.latitude',0);
        $this->assertEqualsWithDelta(11.12,$response->json('data.participants.0.distance_from_venue'),.1);
        $this->assertTrue(\Carbon\Carbon::parse($response->json('data.participants.0.location_recorded_at'))->equalTo(now()->subMinute()));
        DB::table('student_locations')->delete();
        $this->getJson('/api/activities/'.$activity.'/map')->assertOk()->assertJsonPath('data.participants.0.accuracy',null);
    }
}
