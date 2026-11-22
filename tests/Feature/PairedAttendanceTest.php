<?php
namespace Tests\Feature;
use App\Models\{User,Student,AttendanceSession,AttendanceLog};
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;
class PairedAttendanceTest extends ProjectReviewRegressionTest {
 private function actor(string $role):User{return User::create(['first_name'=>'Pair','last_name'=>$role,'email'=>uniqid().'@example.test','password'=>'Password-123','role'=>$role,'is_active'=>true,'nstp_component'=>'cwts']);}
 private function setupPair():array {
  Carbon::setTestNow(Carbon::parse('2026-11-23T06:00:00+08:00'));
  $teacher=$this->actor('faculty');$user=$this->actor('student');$student=Student::create(['user_id'=>$user->id,'student_id'=>uniqid('PAIR'),'total_training_hours'=>90]);
  $class=DB::table('classes')->insertGetId(['teacher_id'=>$teacher->id,'name'=>'Pair class','component_type'=>'cwts','join_code'=>uniqid(),'status'=>'active']);
  DB::table('class_students')->insert(['class_id'=>$class,'student_id'=>$student->id,'status'=>'active']);
  $session=AttendanceSession::create(['class_id'=>$class,'faculty_id'=>$teacher->id,'status'=>'active','is_scheduled'=>true,'scheduled_start'=>Carbon::parse('2026-11-23T02:10:00+08:00'),'scheduled_end'=>Carbon::parse('2026-11-23T04:10:00+08:00'),'start_time'=>Carbon::parse('2026-11-23T02:10:00+08:00'),'end_time'=>Carbon::parse('2026-11-23T04:10:00+08:00'),'grace_period_minutes'=>15,'rules_version'=>1]);
  Sanctum::actingAs($user);$vector=array_merge([1.0],array_fill(0,191,0.0));$this->postJson('/api/student/face-embeddings',['embeddings'=>['front'=>$vector,'left'=>$vector,'right'=>$vector]])->assertOk();
  return [$teacher,$user,$student,$session,['class_id'=>$class,'session_id'=>$session->id,'offline'=>true,'captured_at'=>'2026-11-22T18:16:09Z','embedding'=>$vector,'session_version'=>1,'client_id'=>'pair-in']];
 }
 public function test_offline_pair_preserves_philippine_capture_times_and_locks_early_checkout():void {
  [$teacher,$user,$student,$session,$input]=$this->setupPair();
  $response=$this->postJson('/api/attendance/checkin',$input)->assertOk()->assertJsonPath('match',true)->assertJsonPath('data.status','present');
  $this->assertSame('2026-11-23 02:16:09',DB::table('attendance_logs')->first()->check_in_at);
  $this->assertSame('2026-11-23 02:16:09',Carbon::parse($response->json('data.check_in_at'))->timezone('Asia/Manila')->format('Y-m-d H:i:s'));
  $this->assertSame('06:00:00',Carbon::parse($response->json('data.time_in_received_at'))->timezone('Asia/Manila')->format('H:i:s'));
  $out=$input+['event_type'=>'time_out'];$out['client_id']='pair-out';$out['captured_at']='2026-11-22T20:09:59Z';
  $this->postJson('/api/attendance/checkin',$out)->assertUnprocessable();
  $out['captured_at']='2026-11-22T20:10:00Z';
  $response=$this->postJson('/api/attendance/checkin',$out)->assertOk()->assertJsonPath('match',true)->assertJsonPath('data.credited_hours',1.9);
  $this->assertSame('04:10:00',Carbon::parse($response->json('data.check_out_at'))->timezone('Asia/Manila')->format('H:i:s'));
  $out['captured_at']='2026-11-22T20:12:00Z';$this->postJson('/api/attendance/checkin',$out)->assertOk();
  $this->assertSame(1,AttendanceLog::count());$this->assertEquals(1.9,$student->fresh()->completed_training_hours);
  $this->assertSame('2026-11-23 04:10:00',DB::table('attendance_logs')->first()->check_out_at);
 }
 public function test_timeout_requires_timein_and_matching_face():void {
  [$teacher,$user,$student,$session,$input]=$this->setupPair();$out=$input+['event_type'=>'time_out'];$out['captured_at']='2026-11-22T20:12:00Z';
  $this->postJson('/api/attendance/checkin',$out)->assertUnprocessable();$this->postJson('/api/attendance/checkin',$input)->assertOk();
  $out['embedding']=array_merge([0.0,1.0],array_fill(0,190,0.0));$this->postJson('/api/attendance/checkin',$out)->assertOk()->assertJsonPath('match',false);$this->assertNull(AttendanceLog::first()->check_out_at);
 }
 public function test_edit_permissions_conflicts_and_old_offline_rules_are_reviewed_without_rewriting_history():void {
  [$teacher,$user,$student,$session,$input]=$this->setupPair();
  $edit=['expected_version'=>1,'scheduled_start'=>'2026-11-23T02:30:00+08:00','scheduled_end'=>'2026-11-23T04:30:00+08:00','grace_period_minutes'=>15,'require_location'=>true,'latitude'=>8.48,'longitude'=>124.6,'geofence_radius'=>50,'reason'=>'Corrected venue and schedule'];
  Sanctum::actingAs($this->actor('faculty'));$this->putJson('/api/attendance/sessions/'.$session->id,$edit)->assertForbidden();
  Sanctum::actingAs($teacher);$this->putJson('/api/attendance/sessions/'.$session->id,$edit)->assertOk()->assertJsonPath('data.rules_version',2);$this->putJson('/api/attendance/sessions/'.$session->id,$edit)->assertStatus(409);
  $this->assertSame(2,DB::table('attendance_session_revisions')->count());$this->assertSame(1,DB::table('audit_events')->where('event','attendance.session_updated')->count());
  Sanctum::actingAs($user);$this->postJson('/api/attendance/checkin',$input)->assertOk()->assertJsonPath('data.review_status','pending');
  $out=$input+['event_type'=>'time_out'];$out['captured_at']='2026-11-22T20:12:00Z';$this->postJson('/api/attendance/checkin',$out)->assertOk()->assertJsonPath('data.review_status','pending')->assertJsonPath('data.credited_hours',0);
  $this->assertSame('2026-11-23 02:16:09',DB::table('attendance_logs')->first()->check_in_at);$this->assertEquals(0,$student->fresh()->completed_training_hours);
 }
 public function test_invalid_session_edits_are_rejected_and_admin_can_edit():void {
  [$teacher,$user,$student,$session,$input]=$this->setupPair();Sanctum::actingAs($this->actor('admin'));
  $edit=['expected_version'=>1,'scheduled_start'=>'2026-11-23T02:10:00+08:00','scheduled_end'=>'2026-11-23T04:10:00+08:00','grace_period_minutes'=>15,'require_location'=>false,'geofence_radius'=>100,'reason'=>'Valid correction'];
  $this->putJson('/api/attendance/sessions/'.$session->id,array_replace($edit,['scheduled_end'=>'2026-11-23T01:00:00+08:00']))->assertUnprocessable();
  $this->putJson('/api/attendance/sessions/'.$session->id,array_replace($edit,['reason'=>'']))->assertUnprocessable();
  $this->putJson('/api/attendance/sessions/'.$session->id,$edit)->assertOk();
 }
 public function test_uncertain_clock_is_saved_pending_and_session_download_supplies_server_time():void {
  [$teacher,$user,$student,$session,$input]=$this->setupPair();
  $this->getJson('/api/attendance/sessions/'.$session->id)->assertOk()->assertJsonStructure(['data'=>['server_now','rules_version']]);
  $input['clock_suspect']=true;$this->postJson('/api/attendance/checkin',$input)->assertOk()->assertJsonPath('data.review_status','pending');
 }
}
