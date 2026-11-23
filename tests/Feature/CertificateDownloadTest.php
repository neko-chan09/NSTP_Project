<?php
namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class CertificateDownloadTest extends ProjectReviewRegressionTest
{
    private function user(string $role):User
    {
        $user=User::create(['first_name'=>'Certificate','last_name'=>'Test','email'=>uniqid().'@example.test','password'=>'password123','role'=>$role,'is_active'=>true]);
        if($role==='student')Student::create(['user_id'=>$user->id,'student_id'=>uniqid('STU-')]);
        return $user;
    }
    private function certificate(User $student):Certificate
    {
        Schema::create('certificates',function(Blueprint $t){$t->id();$t->integer('student_id');$t->string('certificate_number');$t->string('certificate_type');$t->string('file_path')->nullable();$t->string('qr_code_path')->nullable();$t->string('status')->default('issued');$t->timestamp('issued_at')->nullable();$t->timestamps();});
        Storage::disk('public')->put('certificates/example.pdf','%PDF-1.4 test certificate');
        Storage::disk('public')->put('certificates/example.png','test qr');
        return Certificate::create(['student_id'=>$student->student->id,'certificate_number'=>'NSTP-TEST','certificate_type'=>'completion','file_path'=>'certificates/example.pdf','qr_code_path'=>'certificates/example.png']);
    }
    public function test_browser_navigation_to_protected_download_returns_401_instead_of_missing_login_route():void
    {
        $this->get('/api/student/certificates/1/download',['Accept'=>'text/html'])->assertUnauthorized()->assertJsonPath('message','Unauthenticated.');
        $this->get('/api/admin/certificates/1/download',['Accept'=>'text/html'])->assertUnauthorized();
    }
    public function test_admin_and_superadmin_can_download_pdf_and_qr():void
    {
        $cert=$this->certificate($this->user('student'));
        foreach(['admin','super_admin'] as $role){
            Sanctum::actingAs($this->user($role));
            $this->get('/api/admin/certificates/'.$cert->id.'/download')->assertOk()->assertHeader('Content-Type','application/pdf')->assertDownload('NSTP-TEST.pdf');
            $this->get('/api/admin/certificates/'.$cert->id.'/qr')->assertOk()->assertHeader('Content-Type','image/png')->assertDownload('NSTP-TEST-qr.png');
        }
    }
    public function test_students_can_only_download_their_own_certificate():void
    {
        $owner=$this->user('student');$cert=$this->certificate($owner);
        Sanctum::actingAs($owner);$this->getJson('/api/student/certificates/'.$cert->id.'/download')->assertOk();
        $this->getJson('/api/admin/certificates/'.$cert->id.'/download')->assertForbidden();
        Sanctum::actingAs($this->user('student'));$this->getJson('/api/student/certificates/'.$cert->id.'/download')->assertForbidden();
        Sanctum::actingAs($this->user('faculty'));$this->getJson('/api/admin/certificates/'.$cert->id.'/download')->assertForbidden();
    }
    public function test_missing_files_and_records_return_404_and_profileless_students_do_not_crash():void
    {
        $student=$this->user('student');$cert=$this->certificate($student);
        Sanctum::actingAs($this->user('admin'));
        Storage::disk('public')->delete($cert->file_path);
        $this->getJson('/api/admin/certificates/'.$cert->id.'/download')->assertNotFound()->assertJsonPath('message','Certificate file is missing. Contact the NSTP office to restore it.');
        $this->getJson('/api/admin/certificates/999/download')->assertNotFound();
        $student->student->delete();$student->unsetRelation('student');Sanctum::actingAs($student);
        $this->getJson('/api/student/certificates/'.$cert->id.'/download')->assertForbidden();
        $this->getJson('/api/student/certificates')->assertForbidden();
    }
}
