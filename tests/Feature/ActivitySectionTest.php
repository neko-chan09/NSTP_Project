<?php
namespace Tests\Feature;
use App\Models\{User,Student,Activity};
use Illuminate\Support\Facades\{DB,Schema};
use Illuminate\Database\Schema\Blueprint;
use Laravel\Sanctum\Sanctum;
class ActivitySectionTest extends ProjectReviewRegressionTest {
 protected function setUp():void {
  parent::setUp();
  Schema::table('activities',function(Blueprint $t){$t->string('title')->default('Test');$t->text('description')->nullable();$t->dateTime('start_datetime')->nullable();$t->dateTime('end_datetime')->nullable();$t->string('status')->default('upcoming');$t->string('venue')->nullable();$t->integer('geofence_radius')->default(100);$t->integer('training_hours')->default(1);$t->integer('max_participants')->default(0);$t->timestamps();});
  Schema::create('activity_participations',function(Blueprint $t){$t->id();$t->integer('activity_id');$t->integer('student_id');$t->string('attendance_status');$t->timestamps();});
  if(!Schema::hasTable('notifications'))Schema::create('notifications',function(Blueprint $t){$t->id();$t->integer('user_id');$t->string('title');$t->text('message');$t->string('type');$t->text('data')->nullable();$t->boolean('is_read')->default(false);$t->timestamps();});
 }
 private function person(string $role='student',?string $component=null):User {
  $u=User::create(['first_name'=>'Section','last_name'=>'Test','email'=>uniqid().'@example.test','student_id'=>uniqid('S'),'password'=>'not-a-real-password','role'=>$role,'is_active'=>true,'nstp_component'=>$component]);
  if($role==='student')Student::create(['user_id'=>$u->id,'student_id'=>$u->student_id,'nstp_component_selected'=>'cwts']);return $u;
 }
 private function section(User $teacher,string $component):int {return DB::table('classes')->insertGetId(['teacher_id'=>$teacher->id,'name'=>$component.' section '.uniqid(),'component_type'=>$component,'join_code'=>uniqid(),'status'=>'active']);}
 private function enroll(User $student,int $id,string $status='active'):void {DB::table('class_students')->insert(['student_id'=>$student->student->id,'class_id'=>$id,'status'=>$status]);}
 private function payload(int $class,string $component):array {return ['class_id'=>$class,'component_type'=>$component,'title'=>'Section activity','description'=>'Assigned section activity','start_datetime'=>now()->addHour()->toIso8601String(),'end_datetime'=>now()->addHours(3)->toIso8601String(),'training_hours'=>2];}
 private function activity(User $teacher,?int $class,string $component):Activity {return Activity::create(['created_by'=>$teacher->id,'class_id'=>$class,'component_type'=>$component,'title'=>'Visible activity','description'=>'Section audience','start_datetime'=>now()->addHour(),'end_datetime'=>now()->addHours(3),'status'=>'upcoming']);}
 public function test_faculty_options_and_creation_support_both_assigned_components():void {
  $f=$this->person('faculty','cwts');$cwts=$this->section($f,'cwts');$lts=$this->section($f,'lts');$this->section($this->person('faculty','rotc'),'rotc');Sanctum::actingAs($f);
  $this->getJson('/api/activities/sections')->assertOk()->assertJsonCount(2,'data');
  $this->postJson('/api/activities',$this->payload($lts,'lts'))->assertCreated()->assertJsonPath('data.class_id',$lts)->assertJsonPath('data.component_type','lts');
  $this->postJson('/api/activities',$this->payload($cwts,'cwts'))->assertCreated();
  $this->getJson('/api/activities')->assertOk()->assertJsonCount(2,'data');
 }
 public function test_faculty_cannot_target_unassigned_class_or_wrong_component():void {
  $f=$this->person('faculty','cwts');$other=$this->section($this->person('faculty','lts'),'lts');$own=$this->section($f,'cwts');Sanctum::actingAs($f);
  $this->postJson('/api/activities',$this->payload($other,'lts'))->assertForbidden();
  $this->postJson('/api/activities',$this->payload($own,'lts'))->assertUnprocessable();
  $p=$this->payload($own,'cwts');unset($p['class_id']);$this->postJson('/api/activities',$p)->assertUnprocessable();
  $this->assertSame(0,Activity::count());
 }
 public function test_enrolled_student_can_see_and_register_for_second_component_class():void {
  $f=$this->person('faculty','cwts');$class=$this->section($f,'lts');$student=$this->person();$this->enroll($student,$class);$activity=$this->activity($f,$class,'lts');Sanctum::actingAs($student);
  $this->getJson('/api/student/activities')->assertOk()->assertJsonPath('data.0.id',$activity->id);
  $this->getJson('/api/student/activities/'.$activity->id)->assertOk();
  $this->postJson('/api/student/activities/'.$activity->id.'/register')->assertOk();
  $this->getJson('/api/student/activities')->assertOk()->assertJsonPath('data.0.is_registered',true);
 }
 public function test_same_component_other_section_is_hidden_including_direct_requests():void {
  $f=$this->person('faculty','cwts');$a=$this->section($f,'cwts');$b=$this->section($f,'cwts');$student=$this->person();$this->enroll($student,$b);$activity=$this->activity($f,$a,'cwts');Sanctum::actingAs($student);
  $this->getJson('/api/student/activities')->assertOk()->assertJsonCount(0,'data');
  $this->getJson('/api/student/activities/'.$activity->id)->assertNotFound();
  $this->postJson('/api/student/activities/'.$activity->id.'/register')->assertNotFound();
  $this->assertSame(0,DB::table('activity_participations')->count());
 }
 public function test_legacy_activity_uses_student_selected_component_when_user_field_is_empty():void {
  $f=$this->person('faculty','cwts');$student=$this->person();$activity=$this->activity($f,null,'cwts');Sanctum::actingAs($student);
  $this->getJson('/api/student/activities')->assertOk()->assertJsonPath('data.0.id',$activity->id);
 }
 public function test_completed_cancelled_expired_and_inactive_enrollment_are_not_listed():void {
  $f=$this->person('faculty','cwts');$student=$this->person();$class=$this->section($f,'cwts');$this->enroll($student,$class,'removed');$this->activity($f,$class,'cwts');
  $expired=$this->activity($f,null,'cwts');$expired->update(['end_datetime'=>now()->subMinute()]);
  $completed=$this->activity($f,null,'cwts');$completed->update(['status'=>'completed']);
  $cancelled=$this->activity($f,null,'cwts');$cancelled->update(['status'=>'cancelled']);Sanctum::actingAs($student);
  $this->getJson('/api/student/activities')->assertOk()->assertJsonCount(0,'data');
 }
 public function test_edit_keeps_assigned_class_scope_and_archive_protection():void {
  $f=$this->person('faculty','cwts');$class=$this->section($f,'lts');$other=$this->section($this->person('faculty','lts'),'lts');$activity=$this->activity($f,$class,'lts');Sanctum::actingAs($f);
  $this->putJson('/api/activities/'.$activity->id,['title'=>'Updated title'])->assertOk();
  $this->putJson('/api/activities/'.$activity->id,['class_id'=>$other])->assertForbidden();
  $activity->update(['status'=>'completed']);$this->putJson('/api/activities/'.$activity->id,['title'=>'Cannot edit'])->assertStatus(409);
 }
}
