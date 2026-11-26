<?php
namespace Tests\Feature;
use App\Models\{User,Student};
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
class ComponentLookupTest extends ProjectReviewRegressionTest {
 private function signIn(string $role='super_admin'):void{Sanctum::actingAs(User::create(['first_name'=>'Test','last_name'=>'Admin','email'=>uniqid().'@example.test','password'=>'fixture-password','role'=>$role,'is_active'=>true]));}
 private function makeStudent(string $id):Student{$u=User::create(['first_name'=>'Test','last_name'=>'Student','email'=>uniqid().'@example.test','password'=>'fixture-password','role'=>'student','is_active'=>true]);return Student::create(['user_id'=>$u->id,'student_id'=>$id,'nstp_component_selected'=>'cwts']);}
 public function test_exact_lookup_finds_student_beyond_first_thousand():void{$this->signIn();for($chunk=0;$chunk<2;$chunk++){$users=[];$students=[];for($i=1;$i<=500;$i++){$n=$chunk*500+$i;$users[]=['id'=>10000+$n,'first_name'=>'Fixture','last_name'=>'Student','email'=>'fixture'.$n.'@example.test','password'=>'fixture-only','role'=>'student','is_active'=>true];$students[]=['user_id'=>10000+$n,'student_id'=>'0000-'.str_pad((string)$n,5,'0',STR_PAD_LEFT),'gender'=>'Male'];}DB::table('users')->insert($users);DB::table('students')->insert($students);}$s=$this->makeStudent('2026-1-08656');$s->update(['gender'=>'Female']);$this->getJson('/api/admin/students?per_page=1000')->assertOk()->assertJsonCount(1000,'data')->assertJsonMissing(['student_id'=>'2026-1-08656']);$this->getJson('/api/admin/students?student_id=2026-1-08656&per_page=1&page=1')->assertOk()->assertJsonCount(1,'data')->assertJsonPath('data.0.student_id','2026-1-08656')->assertJsonPath('meta.total',1);}
 public function test_exact_lookup_does_not_return_partial_id_match():void{$this->signIn();$this->makeStudent('2026-1-086560');$this->getJson('/api/admin/students?student_id=2026-1-08656&per_page=1')->assertOk()->assertJsonCount(0,'data');}
 public function test_trimmed_exact_lookup_and_admin_access():void{$this->signIn('admin');$this->makeStudent('2026-1-08656');$this->getJson('/api/admin/students?student_id=%202026-1-08656%20&per_page=1')->assertOk()->assertJsonPath('data.0.student_id','2026-1-08656');}
 public function test_student_and_faculty_cannot_use_admin_lookup():void{foreach(['student','faculty'] as $role){$this->signIn($role);$this->getJson('/api/admin/students?student_id=2026-1-08656')->assertForbidden();}}
 public function test_invalid_lookup_value_is_validation_error():void{$this->signIn();$this->getJson('/api/admin/students?student_id[]=2026-1-08656')->assertUnprocessable();}
}
