<?php
namespace Tests\Feature;
use App\Models\{User,Student,FaceEmbedding};
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
class MobileReadinessTest extends ProjectReviewRegressionTest {
 private function student():User {
  $u=User::create(['first_name'=>'Face','last_name'=>'Tester','email'=>uniqid().'@example.test','student_id'=>uniqid('S'),'password'=>Hash::make('testing-only'),'role'=>'student','is_active'=>true]);
  Student::create(['user_id'=>$u->id,'student_id'=>$u->student_id]);return $u;
 }
 private function vector(int $position):array {$v=array_fill(0,192,0.0);$v[$position]=1.0;return $v;}
 private function payload(array $v):array {return ['embeddings'=>['front'=>$v,'left'=>$v,'right'=>$v]];}
 public function test_other_account_cannot_register_identical_face():void {
  $a=$this->student();$b=$this->student();Sanctum::actingAs($a);
  $this->postJson('/api/student/face-embeddings',$this->payload($this->vector(0)))->assertOk();
  Sanctum::actingAs($b);$this->postJson('/api/student/face-embeddings',$this->payload($this->vector(0)))->assertStatus(409)->assertJsonPath('code','FACE_ALREADY_LINKED');
  $this->assertSame(0,FaceEmbedding::where('student_id',$b->student->id)->count());
 }
 public function test_different_face_is_allowed_and_repeat_account_is_blocked():void {
  $a=$this->student();$b=$this->student();Sanctum::actingAs($a);$this->postJson('/api/student/face-embeddings',$this->payload($this->vector(0)))->assertOk();
  Sanctum::actingAs($b);$this->postJson('/api/student/face-embeddings',$this->payload($this->vector(1)))->assertOk();
  $this->postJson('/api/student/face-embeddings',$this->payload($this->vector(1)))->assertStatus(409);
  $this->assertSame(6,FaceEmbedding::count());
 }
 public function test_similar_vectors_are_blocked_without_exact_equality():void {
  $a=$this->student();$b=$this->student();Sanctum::actingAs($a);$this->postJson('/api/student/face-embeddings',$this->payload($this->vector(0)))->assertOk();
  $v=$this->vector(0);$v[0]=0.9;$v[1]=sqrt(1-0.81);Sanctum::actingAs($b);
  $this->postJson('/api/student/face-embeddings',$this->payload($v))->assertStatus(409)->assertJsonPath('code','FACE_ALREADY_LINKED');
 }
 public function test_invalid_and_mixed_pose_vectors_are_not_saved():void {
  $a=$this->student();Sanctum::actingAs($a);$p=$this->payload($this->vector(0));$p['embeddings']['left']=$this->vector(1);
  $this->postJson('/api/student/face-embeddings',$p)->assertUnprocessable();
  $this->assertSame(0,FaceEmbedding::count());
 }
}
