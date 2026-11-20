<?php
namespace Tests\Feature;
use App\Models\{User,Student,AttendanceSession,AttendanceLog,SystemBackup};
use App\Services\{BackupService,BackupIntegrity};
use Illuminate\Support\Facades\{DB,Schema,Hash,Mail,Storage};
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;
class ReliabilityUpgradeTest extends ProjectReviewRegressionTest {
    public function test_mixed_identity_registration_and_mismatched_vector_dimensions_are_rejected():void {
        $student=$this->actor();Sanctum::actingAs($student);
        $front=array_merge([1.0],array_fill(0,191,0.0));
        $other=array_merge([0.0,1.0],array_fill(0,190,0.0));
        $this->postJson('/api/student/face-embeddings',['embeddings'=>['front'=>$front,'left'=>$other,'right'=>$front]])->assertUnprocessable();
        $this->assertSame(0,\App\Models\FaceEmbedding::where('student_id',$student->student->id)->count());
        $this->assertSame(-1.0,app(\App\Services\FaceMatchingService::class)->cosineSimilarity([1.0],[1.0,0.0]));
    }
    public function test_excused_manual_records_appear_in_reports_and_student_get_history():void {
        [$teacher,$student,$class,$session]=$this->fixture();
        Sanctum::actingAs($teacher);
        $this->postJson('/api/attendance/sessions/'.$session->id.'/manual',['student_id'=>$student->student->id,'status'=>'excused','reason'=>'Verified medical excuse'])->assertOk();
        Sanctum::actingAs($student);
        $this->getJson('/api/attendance/my-history')->assertOk()->assertJsonPath('data.0.attendance_mark','excused');
        Sanctum::actingAs($this->actor('admin'));
        $response=$this->getJson('/api/admin/reports/attendance?start_date='.now()->subDay()->toDateString().'&end_date='.now()->toDateString())->assertOk();
        $this->assertEquals(1,$response->json('data.details.0.excused'));
        $this->assertEquals(0,$response->json('data.details.0.absent'));
    }
    private function actor(string $role='student'):User {
        $u=User::create(['first_name'=>'Recovery','last_name'=>ucfirst($role),'email'=>uniqid().'@example.test','student_id'=>'S'.uniqid(),'password'=>Hash::make('Old-password-01'),'role'=>$role,'is_active'=>true,'must_change_password'=>false]);
        if($role==='student')Student::create(['user_id'=>$u->id,'student_id'=>$u->student_id,'total_training_hours'=>90]);
        return $u;
    }
    private function fixture():array {
        $teacher=$this->actor('faculty');$student=$this->actor();
        foreach(['school_year','academic_year_id'] as $column)if(!Schema::hasColumn('class_students',$column))Schema::table('class_students',fn(Blueprint $t)=>$t->string($column)->nullable());
        $class=DB::table('classes')->insertGetId(['teacher_id'=>$teacher->id,'name'=>'Recovery class','component_type'=>'cwts','join_code'=>uniqid(),'status'=>'active']);
        DB::table('class_students')->insert(['class_id'=>$class,'student_id'=>$student->student->id,'status'=>'active']);
        $session=AttendanceSession::create(['class_id'=>$class,'faculty_id'=>$teacher->id,'status'=>'closed','is_scheduled'=>true,'scheduled_start'=>now()->subHours(2),'scheduled_end'=>now()->subHour(),'start_time'=>now()->subHours(2),'end_time'=>now()->subHour(),'grace_period_minutes'=>15]);
        return [$teacher,$student,$class,$session];
    }
    public function test_only_superadmin_can_lookup_and_reset_all_target_roles_with_audit_and_revocation():void {
        $super=$this->actor('super_admin');
        foreach(['admin','faculty','student'] as $role){
            $target=$this->actor($role);$target->createToken('old-login');
            Sanctum::actingAs($target);
            $payload=['new_password'=>'Temporary-password-02','new_password_confirmation'=>'Temporary-password-02','reason'=>'Verified identity: no email access'];
            $this->postJson('/api/superadmin/users/'.$target->id.'/reset-password',$payload)->assertForbidden();
            Sanctum::actingAs($super);
            $search=$role==='student'?$target->student_id:$target->email;
            $this->getJson('/api/superadmin/password-reset-users?role='.$role.'&search='.urlencode($search))->assertOk()->assertJsonPath('data.0.id',$target->id);
            $this->postJson('/api/superadmin/users/'.$target->id.'/reset-password',$payload)->assertOk();
            $this->assertTrue(Hash::check($payload['new_password'],$target->fresh()->password));
            $this->assertTrue($target->fresh()->must_change_password);$this->assertSame(0,$target->tokens()->count());
            $this->assertSame(1,DB::table('audit_events')->where('event','password.admin_reset')->where('subject_id',$target->id)->count());
            $this->assertStringNotContainsString($payload['new_password'],json_encode(DB::table('audit_events')->get()));
            Sanctum::actingAs($target->fresh());$this->getJson('/api/settings')->assertForbidden()->assertJsonPath('code','PASSWORD_CHANGE_REQUIRED');
        }
        Sanctum::actingAs($super);$this->postJson('/api/superadmin/users/'.$super->id.'/reset-password',['new_password'=>'Temporary-password-02','new_password_confirmation'=>'Temporary-password-02','reason'=>'test'])->assertForbidden();
    }
    public function test_reset_rejects_mismatch_missing_reason_and_partial_student_id():void {
        Sanctum::actingAs($this->actor('super_admin'));$student=$this->actor();
        $this->getJson('/api/superadmin/password-reset-users?role=student&search='.substr($student->student_id,0,5))->assertOk()->assertJsonCount(0,'data');
        $this->postJson('/api/superadmin/users/'.$student->id.'/reset-password',['new_password'=>'new-password','new_password_confirmation'=>'wrong'])->assertUnprocessable();
        $this->assertTrue(Hash::check('Old-password-01',$student->fresh()->password));
    }
    public function test_real_login_reset_urls_deliver_email_and_throttle_resends():void {
        $user=$this->actor();Mail::fake();
        $this->postJson('/api/password/send-otp',['email'=>$user->email])->assertOk();
        Mail::assertSent(\App\Mail\PasswordResetOtpMail::class);
        $this->postJson('/api/password/resend-otp',['email'=>$user->email])->assertStatus(429);
        $otp=Mail::sent(\App\Mail\PasswordResetOtpMail::class)->first()->otp;
        $stored=DB::table('password_reset_otps')->where('email',$user->email)->first();$this->assertNotSame($otp,$stored->otp);$this->assertTrue(Hash::check($otp,$stored->otp_hash));
        $response=$this->postJson('/api/password/verify-otp',['email'=>$user->email,'otp'=>$otp])->assertOk();
        $token=$response->json('data.reset_token');
        $user->createToken('old');
        $this->postJson('/api/password/reset',['email'=>$user->email,'reset_token'=>$token,'new_password'=>'Private-password-03','new_password_confirmation'=>'Private-password-03'])->assertOk();
        $this->assertSame(0,$user->tokens()->count());
        $this->postJson('/api/password/reset',['email'=>$user->email,'reset_token'=>$token,'new_password'=>'Private-password-04','new_password_confirmation'=>'Private-password-04'])->assertStatus(400);
    }
    public function test_manual_attendance_credit_is_elapsed_capped_and_idempotent():void {
        [$teacher,$student,$class,$session]=$this->fixture();Sanctum::actingAs($teacher);
        $data=['student_id'=>$student->student->id,'status'=>'late','check_in_at'=>now()->subMinutes(90)->toIso8601String(),'check_out_at'=>now()->subMinutes(45)->toIso8601String(),'reason'=>'Corrected after checking paper attendance'];
        $path='/api/attendance/sessions/'.$session->id.'/manual';
        $this->postJson($path,$data)->assertOk()->assertJsonPath('data.credited_hours',0.5);
        $this->postJson($path,$data)->assertOk();$this->assertEquals(.5,$student->student->fresh()->completed_training_hours);
        $data['status']='excused';$data['check_in_at']=null;$data['check_out_at']=null;
        $this->postJson($path,$data)->assertOk()->assertJsonPath('data.attendance_mark','excused');
        $this->assertEquals(0,$student->student->fresh()->completed_training_hours);
        $data['reason']='';$this->postJson($path,$data)->assertUnprocessable();
    }
    public function test_class_records_are_scoped_and_checkout_requires_timein_and_does_not_double_credit():void {
        [$teacher,$student,$class,$session]=$this->fixture();$other=$this->actor('faculty');Sanctum::actingAs($other);
        $this->getJson('/api/classes/'.$class.'/record')->assertForbidden();
        Sanctum::actingAs($teacher);$this->getJson('/api/classes/'.$class.'/record')->assertOk()->assertJsonCount(1,'data.students');
        foreach(['admin','super_admin'] as $role){Sanctum::actingAs($this->actor($role));$this->getJson('/api/classes/'.$class.'/record')->assertOk();}
        Sanctum::actingAs($student);$this->postJson('/api/attendance/sessions/'.$session->id.'/checkout')->assertNotFound();
        $log=AttendanceLog::create(['session_id'=>$session->id,'student_id'=>$student->student->id,'check_in_at'=>now()->subMinutes(90),'status'=>'late','attendance_mark'=>'late','review_status'=>'approved']);
        $this->postJson('/api/attendance/sessions/'.$session->id.'/checkout')->assertOk()->assertJsonPath('data.credited_hours',0.5);
        $this->postJson('/api/attendance/sessions/'.$session->id.'/checkout')->assertOk();$this->assertEquals(.5,$student->student->fresh()->completed_training_hours);
        $this->getJson('/api/student/attendance/records')->assertOk()->assertJsonCount(1,'data');
    }
    public function test_after_session_face_checkin_is_pending_and_has_no_automatic_credit():void {
        [$teacher,$student,$class,$session]=$this->fixture();Sanctum::actingAs($student);$vector=array_merge([1.0],array_fill(0,191,0.0));
        $this->postJson('/api/student/face-embeddings',['embeddings'=>['front'=>$vector,'left'=>$vector,'right'=>$vector]])->assertOk();
        $this->postJson('/api/attendance/checkin',['class_id'=>$class,'session_id'=>$session->id,'embedding'=>$vector])->assertOk()->assertJsonPath('data.review_status','pending');
        $this->assertEquals(0,$student->student->fresh()->completed_training_hours);
    }
    public function test_enrollment_counts_use_imported_gender_and_active_rosters_and_filters():void {
        [$teacher,$student,$class,$session]=$this->fixture();$student->student->update(['gender'=>'female','course'=>'BSIT','section'=>'A','nstp_component_selected'=>'cwts']);
        Sanctum::actingAs($this->actor('admin'));
        $this->getJson('/api/admin/reports/compliance?course=BSIT&section=A')->assertOk()->assertJsonPath('data.total',1)->assertJsonPath('data.total_female',1)->assertJsonPath('data.cwts',1);
        $this->getJson('/api/admin/reports/compliance?course=BEED')->assertOk()->assertJsonPath('data.total',0);
        Sanctum::actingAs($teacher);$this->getJson('/api/directory/options')->assertOk()->assertJsonPath('data.courses.0','BSIT');
    }
    public function test_excel_and_csv_share_parser_and_never_evaluate_formulas():void {
        $service=app(\App\Services\StudentImportService::class);$parser=new \ReflectionMethod($service,'parseCsv');
        $file=UploadedFile::fake()->createWithContent('students.csv',"student_id,first_name,last_name,course\nIMPORT-1,New,Student,BSIT\n");
        $csv=$parser->invoke($service,$file);$this->assertCount(1,$csv['rows']);
        $duplicate=$parser->invoke($service,UploadedFile::fake()->createWithContent('duplicate.csv',"student_id,first_name,last_name\nDUP-1,First,Student\nDUP-1,Second,Student\n"));$this->assertNotEmpty($duplicate['errors']);
        $book=new \PhpOffice\PhpSpreadsheet\Spreadsheet();$book->getActiveSheet()->fromArray([['student_id','first_name','last_name','course'],['IMPORT-1','New','Student','BSIT']]);
        $path=storage_path('test-students.xlsx');(new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($book))->save($path);
        try{$xlsx=$parser->invoke($service,new UploadedFile($path,'students.xlsx',null,null,true));$this->assertSame($csv['header'],$xlsx['header']);$this->assertCount(1,$xlsx['rows']);
        $book->getActiveSheet()->setCellValue('B2','=1+1');(new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($book))->save($path);$invalid=$parser->invoke($service,new UploadedFile($path,'students.xlsx',null,null,true));$this->assertNotEmpty($invalid['errors']);}finally{unlink($path);$book->disconnectWorksheets();}
    }
    public function test_backup_checksums_reject_tampering_and_restore_test_refuses_live_connection():void {
        $base=storage_path('backup-test-'.uniqid());mkdir($base,0700,true);$path=$base.'/backup.zip';$zip=new \ZipArchive();$zip->open($path,\ZipArchive::CREATE);$sql='SELECT 1;';$zip->addFromString('database.sql',$sql);$zip->addFromString('manifest.json',json_encode(['driver'=>'sqlite','files'=>['database.sql'=>hash('sha256',$sql)]]));$zip->close();
        try{$this->assertTrue(app(BackupIntegrity::class)->verify($path)['verified']);$backup=new SystemBackup(['file_path'=>'backups/test.zip']);
            try{app(BackupService::class)->testRestore($backup,config('database.default'));$this->fail('Production connection must be rejected.');}catch(\RuntimeException $e){$this->assertStringContainsString('separate',$e->getMessage());}
            $zip->open($path);$zip->addFromString('database.sql','tampered');$zip->close();
            try{app(BackupIntegrity::class)->verify($path);$this->fail('Tampered backup must fail.');}catch(\RuntimeException $e){$this->assertStringContainsString('checksum',$e->getMessage());}
        }finally{unlink($path);rmdir($base);}
    }
    public function test_preview_and_repeated_imports_update_enrollment_without_duplicates_or_password_resets():void {
        [$teacher,$student,$class,$session]=$this->fixture();
        (require database_path('migrations/2026_03_26_000003_create_academic_tables.php'))->up();
        (require database_path('migrations/2026_10_15_000001_add_import_fields_to_classes_table.php'))->up();
        (require database_path('migrations/2026_10_15_000003_add_import_meta_to_students_table.php'))->up();
        (require database_path('migrations/2026_10_15_000010_create_import_batches_table.php'))->up();
        DB::table('classes')->where('id',$class)->update(['class_code'=>'CWTS-TEST']);
        $csv="student_id,first_name,last_name,email,password,course,section,gender,class_code,component\nIMPORT-001,New,Student,import@example.test,Original-Import-123,BSIT,A,female,CWTS-TEST,cwts\n";
        $service=app(\App\Services\StudentImportService::class);$before=User::count();
        $preview=$service->import(UploadedFile::fake()->createWithContent('students.csv',$csv),'upsert',true,'2026-2027');
        $this->assertSame(1,$preview['created']);$this->assertSame($before,User::count());$this->assertSame(0,DB::table('academic_years')->count());
        $batch=$service->beginBatch(UploadedFile::fake()->createWithContent('students.csv',$csv),'upsert',false,'2026-2027',$teacher->id);
        $this->assertStringNotContainsString('Original-Import-123',$batch->rows_json);
        $result=$service->processChunk($batch,50);$this->assertSame(1,$result['created_count']);
        $new=Student::where('student_id','IMPORT-001')->firstOrFail();$this->assertTrue(Hash::check('Original-Import-123',$new->user->password));
        DB::table('class_students')->where('student_id',$new->id)->update(['status'=>'removed']);
        $second=$service->beginBatch(UploadedFile::fake()->createWithContent('students.csv',str_replace('Original-Import-123','Must-not-reset-123',$csv)),'upsert',false,'2026-2027',$teacher->id);
        $service->processChunk($second,50);$service->processChunk($second->fresh(),50);
        $this->assertSame(1,Student::where('student_id','IMPORT-001')->count());
        $this->assertSame(1,DB::table('class_students')->where('student_id',$new->id)->count());
        $this->assertSame('active',DB::table('class_students')->where('student_id',$new->id)->value('status'));
        $this->assertTrue(Hash::check('Original-Import-123',$new->user->fresh()->password));
        $this->assertNull($second->fresh()->rows_json);
    }
    public function test_actual_backup_and_restore_are_verified_in_an_isolated_database_and_storage():void {
        Schema::create('system_backups',function(Blueprint $t){$t->id();$t->string('backup_name');$t->string('file_path');$t->string('disk');$t->string('type');$t->string('status');$t->string('notes')->nullable();$t->unsignedBigInteger('created_by')->nullable();$t->bigInteger('file_size')->nullable();$t->integer('tables_count')->nullable();$t->integer('storage_files_count')->nullable();$t->text('error_message')->nullable();$t->timestamp('started_at')->nullable();$t->timestamp('completed_at')->nullable();$t->timestamp('finished_at')->nullable();$t->timestamps();});
        $user=$this->actor('super_admin');$public=storage_path('app/public');if(!is_dir($public))mkdir($public,0700,true);$file=$public.'/restore-test.txt';file_put_contents($file,'original uploaded content');
        $service=app(BackupService::class);$backup=$service->createBackup('manual',$user->id);
        $this->assertSame('completed',$backup->status);$this->assertTrue($service->verifyBackup($backup)['verified']);
        $target=storage_path('isolated-restore-'.uniqid().'.sqlite');file_put_contents($target,'');
        config(['database.connections.restore_check'=>['driver'=>'sqlite','database'=>$target,'prefix'=>'','foreign_key_constraints'=>false]]);
        try{
            $this->assertTrue($service->testRestore($backup,'restore_check')['restored']);
            $this->assertSame($user->email,DB::connection('restore_check')->table('users')->where('id',$user->id)->value('email'));
            file_put_contents($file,'changed after backup');DB::setDefaultConnection('restore_check');
            $service->restoreBackup($backup);$this->assertSame('original uploaded content',file_get_contents($file));
        }finally{DB::setDefaultConnection('sqlite');DB::disconnect('restore_check');if(is_file($target))unlink($target);if(is_file($file))unlink($file);$service->deleteBackup($backup);}
    }
    public function test_temporary_password_change_validates_and_unlocks_the_account():void {
        $user=$this->actor('faculty');$user->forceFill(['must_change_password'=>true])->save();Sanctum::actingAs($user);
        $this->postJson('/api/change-password-first-login',['current_password'=>'wrong','new_password'=>'New-private-123','new_password_confirmation'=>'New-private-123'])->assertStatus(401);
        $this->postJson('/api/change-password-first-login',['current_password'=>'Old-password-01','new_password'=>'Old-password-01','new_password_confirmation'=>'Old-password-01'])->assertUnprocessable();
        $this->postJson('/api/change-password-first-login',['current_password'=>'Old-password-01','new_password'=>'New-private-123','new_password_confirmation'=>'New-private-123'])->assertOk();
        $this->assertFalse($user->fresh()->must_change_password);$this->assertTrue(Hash::check('New-private-123',$user->fresh()->password));
        $this->assertSame(1,DB::table('audit_events')->where('event','password.temporary_changed')->count());
    }
    public function test_backup_schedule_uses_manila_time_and_includes_later_today_for_weekly_runs():void {
        $from=Carbon::parse('2026-11-20 00:00:00','UTC');
        $schedule=new \App\Models\BackupSchedule(['frequency'=>'weekly','day_of_week'=>Carbon::FRIDAY,'time'=>'09:00']);
        $next=$schedule->computeNextRun($from);$this->assertTrue($next->equalTo(Carbon::parse('2026-11-20 01:00:00','UTC')));
        $daily=new \App\Models\BackupSchedule(['frequency'=>'daily','time'=>'02:00']);
        $this->assertTrue($daily->computeNextRun($from)->equalTo(Carbon::parse('2026-11-20 18:00:00','UTC')));
    }

    public function test_schedule_buttons_reject_invalid_times_and_cron_instead_of_silently_falling_back():void {
        Sanctum::actingAs($this->actor('super_admin'));
        $this->postJson('/api/superadmin/backups/schedules',['name'=>'Bad time','frequency'=>'daily','time'=>'99:99'])->assertUnprocessable();
        $this->postJson('/api/superadmin/backups/schedules',['name'=>'Bad cron','frequency'=>'custom','cron_expression'=>'not a cron'])->assertUnprocessable();
        $this->postJson('/api/superadmin/backups/schedules',['name'=>'Missing day','frequency'=>'weekly','time'=>'02:00'])->assertUnprocessable();
    }

}
