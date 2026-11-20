<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;

class GpsTimestampTest extends ProjectReviewRegressionTest
{
    public function test_location_updates_keep_capture_time_and_reject_expired_fixes(): void
    {
        $user=User::create(['first_name'=>'GPS','last_name'=>'Test','email'=>'timestamp@example.test','password'=>'password123','role'=>'student','is_active'=>true]);
        $student=Student::create(['user_id'=>$user->id,'student_id'=>'GPS-TIME']);
        Schema::table('activities', fn(Blueprint $t) => $t->integer('geofence_radius')->default(50));
        Schema::create('activity_participations', function(Blueprint $t) {
            $t->id();$t->integer('activity_id');$t->integer('student_id');$t->double('checkin_latitude')->nullable();$t->double('checkin_longitude')->nullable();$t->double('latitude')->nullable();$t->double('longitude')->nullable();$t->boolean('is_within_geofence')->nullable();$t->double('distance_from_venue')->nullable();$t->string('attendance_status')->nullable();$t->timestamp('check_in_at')->nullable();$t->timestamps();
        });
        Schema::create('student_locations', function(Blueprint $t) {
            $t->id();$t->integer('activity_id');$t->integer('student_id');$t->double('latitude');$t->double('longitude');$t->double('accuracy')->nullable();$t->boolean('is_within_geofence');$t->double('distance_from_venue')->nullable();$t->string('location_source');$t->timestamp('tracked_at');$t->timestamps();
        });
        $activity=DB::table('activities')->insertGetId(['created_by'=>$user->id,'component_type'=>'cwts','latitude'=>8.48,'longitude'=>124.6]);
        DB::table('activity_participations')->insert(['activity_id'=>$activity,'student_id'=>$student->id]);
        Sanctum::actingAs($user);
        $payload=['activity_id'=>$activity,'latitude'=>8.48,'longitude'=>124.6,'accuracy'=>5,'captured_at'=>now()->subSeconds(20)->toIso8601String()];
        $response=$this->postJson('/api/student/location/update',$payload)->assertOk();
        $this->assertTrue(\Carbon\Carbon::parse($response->json('data.tracked_at'))->equalTo(now()->subSeconds(20)));
        $payload['captured_at']=now()->subMinutes(3)->toIso8601String();
        $this->postJson('/api/student/location/update',$payload)->assertUnprocessable();
        $payload['captured_at']=now()->addMinutes(2)->toIso8601String();
        $this->postJson('/api/student/location/update',$payload)->assertUnprocessable();
        $this->assertSame(1,DB::table('student_locations')->count());
    }
}
