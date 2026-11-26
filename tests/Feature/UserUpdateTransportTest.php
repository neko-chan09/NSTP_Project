<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Http\{Request,UploadedFile};
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
class UserUpdateTransportTest extends ProjectReviewRegressionTest {
 private function person(string $role):User {return User::create(['first_name'=>'Original','last_name'=>'Tester','email'=>uniqid().'@example.test','password'=>'test-only-password','role'=>$role,'is_active'=>true]);}
 public function test_multipart_post_override_updates_faculty_fields_and_photo():void {
  Request::enableHttpMethodParameterOverride();$super=$this->person('super_admin');$faculty=$this->person('faculty');Sanctum::actingAs($super);
  $this->post('/api/superadmin/users/'.$faculty->id,['_method'=>'PUT','first_name'=>'Kieth','last_name'=>'Bucad','nstp_component'=>'lts','profile_photo'=>UploadedFile::fake()->image('faculty.png')],['Accept'=>'application/json'])->assertOk()->assertJsonPath('data.first_name','Kieth')->assertJsonPath('data.nstp_component','lts');
  $faculty->refresh();$this->assertSame('Bucad',$faculty->last_name);Storage::disk('public')->assertExists($faculty->profile_photo);
 }
 public function test_multipart_plain_edit_preserves_existing_photo_and_blocks_wrong_role():void {
  Request::enableHttpMethodParameterOverride();$super=$this->person('super_admin');$faculty=$this->person('faculty');$faculty->update(['profile_photo'=>'profile_photos/existing.png']);Sanctum::actingAs($super);
  $this->post('/api/superadmin/users/'.$faculty->id,['_method'=>'PUT','first_name'=>'Updated'],['Accept'=>'application/json'])->assertOk();$this->assertSame('profile_photos/existing.png',$faculty->fresh()->profile_photo);
  Sanctum::actingAs($faculty);$this->post('/api/superadmin/users/'.$faculty->id,['_method'=>'PUT','first_name'=>'Unauthorized'],['Accept'=>'application/json'])->assertForbidden();$this->assertSame('Updated',$faculty->fresh()->first_name);
 }
}
