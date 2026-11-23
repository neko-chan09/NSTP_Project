<?php
namespace Tests\Feature;

use App\Models\User;
use App\Services\BackupImportService;
use App\Services\RecoverySqlGuard;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use ZipArchive;

class BackupImportTest extends ProjectReviewRegressionTest
{
    private array $temporary=[];
    protected function setUp():void {parent::setUp();Storage::fake('local');config(['recovery.migrate'=>false]);}
    protected function tearDown():void {DB::disconnect('backup_restore_test');foreach($this->temporary as $p)if(file_exists($p))unlink($p);parent::tearDown();}
    private function user(string $role='super_admin'):User
    {
        return User::create(['first_name'=>'Recovery','last_name'=>'Test','email'=>uniqid().'@example.test','role'=>$role,'password'=>\Illuminate\Support\Facades\Hash::make('test-password'),'is_active'=>true]);
    }
    private function archive(array $files,bool $manifest=true,string $driver='sqlite'):UploadedFile
    {
        $path=storage_path('app/import-test-'.uniqid().'.zip');if(!is_dir(dirname($path)))mkdir(dirname($path),0700,true);$this->temporary[]=$path;
        $zip=new ZipArchive();$zip->open($path,ZipArchive::CREATE);foreach($files as $name=>$data)$zip->addFromString($name,$data);
        if($manifest){$hashes=[];foreach($files as $name=>$data)$hashes[$name]=hash('sha256',$data);$zip->addFromString('manifest.json',json_encode(['driver'=>$driver,'files'=>$hashes,'created_at'=>now()->toIso8601String()]));}$zip->close();
        return new UploadedFile($path,'backup.zip','application/zip',null,true);
    }
    private function sql():string {return 'PRAGMA foreign_keys=OFF; DROP TABLE IF EXISTS sample; CREATE TABLE sample (id INTEGER); INSERT INTO sample VALUES (1); PRAGMA foreign_keys=ON;';}
    public function test_import_is_superadmin_only_and_does_not_restore_on_upload():void
    {
        $this->postJson('/api/superadmin/backups/imports')->assertUnauthorized();
        foreach(['admin','faculty','student'] as $role){Sanctum::actingAs($this->user($role));$this->postJson('/api/superadmin/backups/imports')->assertForbidden();}
        Sanctum::actingAs($this->user());
        $this->post('/api/superadmin/backups/imports',['backup'=>$this->archive(['database.sql'=>$this->sql(),'storage/certificates/test.pdf'=>'pdf'])],['Accept'=>'application/json'])->assertOk()->assertJsonPath('data.verified',true)->assertJsonPath('data.tested',false);
        $this->assertFalse(Schema::hasTable('sample'));
    }
    public function test_legacy_import_is_explicitly_unverified_and_cannot_restore_without_testing():void
    {
        $user=$this->user();$service=app(BackupImportService::class);$meta=$service->import($this->archive(['database.sql'=>$this->sql()],false),$user->id);
        $this->assertTrue($meta['legacy']);$this->assertFalse($meta['verified']);
        Sanctum::actingAs($user);
        $this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/restore',['confirmation'=>'RESTORE','password'=>'test-password'])->assertUnprocessable();
        $this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/restore',['confirmation'=>'RESTORE','password'=>'wrong'])->assertUnprocessable()->assertJsonPath('message','Your Super Admin password is incorrect.');
        $this->assertFalse(Schema::hasTable('sample'));
    }
    public function test_unsafe_paths_executables_and_driver_mismatch_are_rejected():void
    {
        $user=$this->user();Sanctum::actingAs($user);
        foreach(['../secret','storage/../secret','storage/test.php','storage/.htaccess'] as $name){
            $this->post('/api/superadmin/backups/imports',['backup'=>$this->archive(['database.sql'=>$this->sql(),$name=>'bad'])],['Accept'=>'application/json'])->assertUnprocessable();
        }
        $this->post('/api/superadmin/backups/imports',['backup'=>$this->archive(['database.sql'=>$this->sql()],true,'mysql')],['Accept'=>'application/json'])->assertUnprocessable();
    }
    public function test_sql_guard_rejects_cross_database_and_executable_queries():void
    {
        $guard=app(RecoverySqlGuard::class);$guard->check($this->sql());
        foreach(['USE production;','ATTACH DATABASE \'live.sqlite\' AS live;','DROP TABLE production.users;','INSERT INTO sample VALUES (LOAD_FILE(\'/etc/passwd\'));','CREATE TRIGGER secret AFTER INSERT ON sample BEGIN DELETE FROM users; END;'] as $sql){
            try{$guard->check($sql);throw new \LogicException('Unsafe SQL accepted');}catch(\RuntimeException $e){$this->assertNotEmpty($e->getMessage());}
        }
    }
    public function test_recovery_test_requires_isolation_and_owner_and_pins_archive_hash():void
    {
        $user=$this->user();$service=app(BackupImportService::class);$meta=$service->import($this->archive(['database.sql'=>$this->sql()]),$user->id);
        Sanctum::actingAs($this->user());$this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/test')->assertForbidden();
        Sanctum::actingAs($user);config(['database.connections.backup_restore_test'=>config('database.connections.sqlite')]);
        $this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/test')->assertUnprocessable();
        Storage::disk('local')->append('recovery-imports/'.$meta['id'].'/archive.zip','changed');
        $this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/test')->assertUnprocessable()->assertJsonPath('message','Imported archive changed. Upload and test it again.');
    }
    public function test_recovery_test_restores_only_a_separate_database():void
    {
        $user=$this->user();$sql="PRAGMA foreign_keys=OFF;\n";
        foreach(DB::select("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'") as $table){$sql.='DROP TABLE IF EXISTS "'.$table->name.'";'.$table->sql.";\n";foreach(DB::table($table->name)->get() as $row){$values=array_map(fn($v)=>$v===null?'NULL':DB::getPdo()->quote((string)$v),(array)$row);$sql.='INSERT INTO "'.$table->name.'" VALUES ('.implode(',',$values).");\n";}}
        $sql.='PRAGMA foreign_keys=ON;';
        $path=storage_path('app/recovery-test-'.uniqid().'.sqlite');file_put_contents($path,'');$this->temporary[]=$path;
        config(['database.connections.backup_restore_test'=>['driver'=>'sqlite','database'=>$path,'prefix'=>'','foreign_key_constraints'=>false]]);
        $service=app(BackupImportService::class);$meta=$service->import($this->archive(['database.sql'=>$sql,'storage/test.txt'=>'recovered']),$user->id);
        $tested=$service->recoveryTest($meta['id'],$user->id);
        $this->assertTrue($tested['tested']);$this->assertSame(1,DB::table('users')->count());$this->assertSame(1,DB::connection('backup_restore_test')->table('users')->count());
    }
    public function test_maintenance_blocks_new_api_requests_and_import_history_is_private():void
    {
        $user=$this->user();$service=app(BackupImportService::class);$service->import($this->archive(['database.sql'=>$this->sql()]),$user->id);
        Sanctum::actingAs($user);$this->getJson('/api/superadmin/backups/imports')->assertOk()->assertJsonCount(1,'data');
        Sanctum::actingAs($this->user());$this->getJson('/api/superadmin/backups/imports')->assertOk()->assertJsonCount(0,'data');
        $path=storage_path('framework/nstp-recovery.lock');file_put_contents($path,'test');
        try{$this->getJson('/api/me')->assertStatus(503)->assertHeader('Retry-After','60');}finally{unlink($path);}
    }
    public function test_full_restore_recovers_isolated_rows_files_and_keeps_safety_backup():void
    {
        Schema::create('system_backups',function(\Illuminate\Database\Schema\Blueprint $t){$t->id();$t->string('backup_name');$t->string('file_path');$t->string('disk');$t->string('type');$t->string('status');$t->string('notes')->nullable();$t->unsignedBigInteger('created_by')->nullable();$t->bigInteger('file_size')->nullable();$t->integer('tables_count')->nullable();$t->integer('storage_files_count')->nullable();$t->text('error_message')->nullable();$t->timestamp('started_at')->nullable();$t->timestamp('completed_at')->nullable();$t->timestamp('finished_at')->nullable();$t->timestamps();});
        $user=$this->user();$user->createToken('old-session');Sanctum::actingAs($user);
        $file=storage_path('app/public/recovery-fixture.txt');if(!is_dir(dirname($file)))mkdir(dirname($file),0700,true);file_put_contents($file,'original');$this->temporary[]=$file;
        $backups=app(\App\Services\BackupService::class);$snapshot=$backups->createBackup('manual',$user->id);
        $imports=app(BackupImportService::class);$meta=$this->postJson('/api/superadmin/backups/'.$snapshot->id.'/prepare-import')->assertOk()->json('data');
        DB::table('users')->where('id',$user->id)->update(['first_name'=>'Changed']);file_put_contents($file,'changed');
        $target=storage_path('app/recovery-test-'.uniqid().'.sqlite');file_put_contents($target,'');$this->temporary[]=$target;
        config(['database.connections.backup_restore_test'=>['driver'=>'sqlite','database'=>$target,'prefix'=>'','foreign_key_constraints'=>false]]);
        $imports->recoveryTest($meta['id'],$user->id);$result=$this->postJson('/api/superadmin/backups/imports/'.$meta['id'].'/restore',['confirmation'=>'RESTORE','password'=>'test-password'])->assertOk()->json('data');
        $this->assertTrue($result['restored']);$this->assertSame('Recovery',DB::table('users')->where('id',$user->id)->value('first_name'));
        $this->assertSame('original',file_get_contents($file));$this->assertSame(0,DB::table('personal_access_tokens')->count());
        $this->assertFalse(is_file(storage_path('framework/nstp-recovery.lock')));
        $history=$imports->metadata($meta['id'],$user->id);$this->assertArrayHasKey('safety_backup_id',$history);
        $safety=\App\Models\SystemBackup::findOrFail($history['safety_backup_id']);$this->assertTrue($backups->verifyBackup($safety)['verified']);
    }
}
