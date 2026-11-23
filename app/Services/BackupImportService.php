<?php
namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class BackupImportService
{
    private function disk() { return Storage::disk('local'); }
    private function key(string $id): string
    {
        abort_unless(Str::isUuid($id), 404);
        return 'recovery-imports/'.$id;
    }
    public function metadata(string $id, int $owner): array
    {
        $key = $this->key($id).'/meta.json';
        abort_unless($this->disk()->exists($key), 404);
        $meta = json_decode($this->disk()->get($key), true, 512, JSON_THROW_ON_ERROR);
        abort_unless($meta['owner'] === $owner, 403);
        return $meta;
    }
    public function history(int $owner): array
    {
        $rows=[];
        foreach($this->disk()->directories('recovery-imports') as $directory) {
            if (!$this->disk()->exists($directory.'/meta.json')) continue;
            $meta=json_decode($this->disk()->get($directory.'/meta.json'),true);
            if (is_array($meta) && ($meta['owner']??null)===$owner) $rows[]=$meta;
        }
        usort($rows,fn($a,$b)=>strcmp($b['imported_at'],$a['imported_at']));
        return array_slice($rows,0,50);
    }
    private function save(array $meta): void { $this->disk()->put($this->key($meta['id']).'/meta.json', json_encode($meta, JSON_THROW_ON_ERROR)); }

    public function import(UploadedFile $upload, int $owner): array
    {
        $id = (string)Str::uuid(); $key = $this->key($id);
        $this->disk()->putFileAs($key, $upload, 'archive.zip');
        $path = $this->disk()->path($key.'/archive.zip');
        try {
            $zip = new ZipArchive();
            if ($zip->open($path, ZipArchive::CHECKCONS) !== true) throw new \RuntimeException('Upload a valid ZIP backup.');
            try {
                $total = 0; $files = []; $seen = [];
                if ($zip->numFiles > 20000) throw new \RuntimeException('Backup contains too many entries.');
                for ($i=0; $i<$zip->numFiles; $i++) {
                    $entry = $zip->statIndex($i); $name = $entry['name']; $lower = strtolower($name);
                    $ops=0; $attrs=0; $zip->getExternalAttributesIndex($i,$ops,$attrs);
                    if (isset($seen[$lower]) || str_contains($name,'\\') || str_contains($name,"\0") || str_starts_with($name,'/') || preg_match('#(^|/)\.\.(/|$)|^[A-Za-z]:#',$name) || (($attrs>>16)&0170000)===0120000) throw new \RuntimeException('Unsafe or duplicate archive path.');
                    $seen[$lower] = true;
                    if (!in_array($name,['database.sql','manifest.json','storage/'],true) && !str_starts_with($name,'storage/')) throw new \RuntimeException('Only NSTP database.sql and storage files are supported.');
                    if (preg_match('#(^|/)(?:\.env|\.htaccess|\.user\.ini)$|\.(?:php\d*|phtml|phar|cgi|exe|sh|bat)$#i',$name)) throw new \RuntimeException('Executable or server configuration files are not allowed.');
                    $total += $entry['size'];
                    if ($total > 512*1024*1024 || $entry['size'] > 128*1024*1024 || $entry['size'] > max(1,$entry['comp_size'])*300) throw new \RuntimeException('Archive expansion exceeds the allowed limit.');
                    if (!str_ends_with($name,'/') && $name !== 'manifest.json') {
                        $stream=$zip->getStream($name); if (!$stream) throw new \RuntimeException('Unreadable archive entry.');
                        $hash=hash_init('sha256');hash_update_stream($hash,$stream);fclose($stream);$files[$name]=hash_final($hash);
                    }
                }
                $sql=$zip->getFromName('database.sql');
                if (!is_string($sql) || trim($sql)==='' || strlen($sql)>64*1024*1024) throw new \RuntimeException('Database dump missing, empty or too large.');
                app(RecoverySqlGuard::class)->check($sql);
                $manifestRaw=$zip->getFromName('manifest.json');$legacy=$manifestRaw===false;
                $manifest=$legacy?[]:json_decode($manifestRaw,true,512,JSON_THROW_ON_ERROR);
                $driver=$manifest['driver']??(str_contains($sql,'PRAGMA foreign_keys')?'sqlite':'mysql');
                if ($driver!==DB::connection()->getDriverName()) throw new \RuntimeException('Backup database type does not match this system.');
            } finally { $zip->close(); }
            if (!$legacy) app(BackupIntegrity::class)->verify($path);
            else {
                $zip=new ZipArchive();$zip->open($path);$zip->addFromString('manifest.json',json_encode(['driver'=>$driver,'created_at'=>null,'files'=>$files],JSON_THROW_ON_ERROR));$zip->close();
            }
            $meta=['id'=>$id,'owner'=>$owner,'filename'=>basename($upload->getClientOriginalName()),'sha256'=>hash_file('sha256',$path),'legacy'=>$legacy,'verified'=>!$legacy,'files'=>count($files),'driver'=>$driver,'backup_date'=>$manifest['created_at']??null,'imported_at'=>now()->toIso8601String(),'tested'=>false];
            $this->save($meta);
            AuditTrail::record($owner,'backup.imported','backup_import',null,null,['import_id'=>$id,'legacy'=>$legacy]);
            return $meta;
        } catch (\Throwable $e) { $this->disk()->deleteDirectory($key);throw $e; }
    }

    public function archive(string $id, int $owner): array
    {
        $meta=$this->metadata($id,$owner);$path=$this->disk()->path($this->key($id).'/archive.zip');
        if (!hash_equals($meta['sha256'],hash_file('sha256',$path)?:'')) throw new \RuntimeException('Imported archive changed. Upload and test it again.');
        app(BackupIntegrity::class)->verify($path);
        return [$meta,$path];
    }
    public function recoveryTest(string $id, int $owner): array
    {
        return \Illuminate\Support\Facades\Cache::store('file')->lock('nstp-recovery-test',600)->block(1,fn()=>$this->performTest($id,$owner));
    }
    private function performTest(string $id, int $owner): array
    {
        [$meta,$path]=$this->archive($id,$owner);
        $connection='backup_restore_test';$target=config('database.connections.'.$connection);$production=config('database.connections.'.config('database.default'));
        if (!$target || empty($target['database']) || $target['driver']!==$meta['driver'] || strtolower($target['database'])===strtolower($production['database']??'') || ($target['database']??'')===':memory:') throw new \RuntimeException('Configure a separate disposable backup_restore_test database first.');
        if ($target['driver']==='mysql' && (empty($target['username']) || $target['username']===($production['username']??''))) throw new \RuntimeException('Use a separate database user restricted to the recovery-test database.');
        $expected=[];foreach(Schema::getTableListing() as $table)$expected[$table]=Schema::getColumnListing($table);
        $backup=new \App\Models\SystemBackup(['file_path'=>$this->key($id).'/archive.zip']);
        // SQL was allow-listed on upload; test only with the dedicated connection.
        $zip=new ZipArchive();$zip->open($path);try{$sql=$zip->getFromName('database.sql');}finally{$zip->close();}
        app(RecoverySqlGuard::class)->check($sql);
        $storageTest=$this->key($id).'/test-storage';
        $this->disk()->makeDirectory($storageTest);
        $zip=new ZipArchive();$zip->open($path);
        try {
            $entries=[];for($i=0;$i<$zip->numFiles;$i++)if(str_starts_with($zip->getNameIndex($i),'storage/'))$entries[]=$zip->getNameIndex($i);
            if ($entries && !$zip->extractTo($this->disk()->path($storageTest),$entries)) throw new \RuntimeException('Uploaded-file recovery test failed. Check private storage permissions and space.');
        } finally { $zip->close();$this->disk()->deleteDirectory($storageTest); }
        Schema::connection($connection)->dropAllTables();
        DB::connection($connection)->unprepared($sql);
        if (config('recovery.migrate',true)) {
            if (Artisan::call('migrate',['--database'=>$connection,'--force'=>true])!==0) throw new \RuntimeException('Recovery-test schema upgrade failed.');
        }
        foreach($expected as $table=>$columns) {
            if (!Schema::connection($connection)->hasTable($table) || array_diff($columns,Schema::connection($connection)->getColumnListing($table))) throw new \RuntimeException('Recovered schema is incompatible: '.$table.'. Restore has not been enabled.');
        }
        $meta['tested']=true;$meta['tested_at']=now()->toIso8601String();$meta['test_expires_at']=now()->addMinutes(30)->toIso8601String();$meta['test_tables']=count($expected);$this->save($meta);return $meta;
    }
    public function restore(string $id,int $owner): array
    {
        [$meta,$path]=$this->archive($id,$owner);
        if (!$meta['tested'] || now()->gte(\Carbon\Carbon::parse($meta['test_expires_at']))) throw new \RuntimeException('Run a successful recovery test before restoring (valid for 30 minutes).');
        $lockPath=storage_path('framework/nstp-recovery.lock');$lock=fopen($lockPath,'x');
        if (!$lock) throw new \RuntimeException('A recovery is already running.');
        fclose($lock);
        $started=false;
        try {
            $service=app(BackupService::class);$safety=$service->createBackup('manual',$owner);$service->verifyBackup($safety);
            $safetyPath=$service->backupPath($safety);$this->disk()->put($this->key($id).'/safety.json',json_encode(['path'=>$safetyPath,'created_at'=>now()->toIso8601String()]));
            // A normalized archive is copied to the private backups directory for the existing restore engine.
            $restoreKey='backups/import-'.$id.'.zip';$this->disk()->copy($this->key($id).'/archive.zip',$restoreKey);
            $started=true;
            $service->restoreBackup(new \App\Models\SystemBackup(['file_path'=>$restoreKey]));
            if (config('recovery.migrate',true) && Artisan::call('migrate',['--force'=>true])!==0) throw new \RuntimeException('Restore applied but database upgrade failed. Keep maintenance mode and recover using the safety backup.');
            $safetyAttributes=$safety->getAttributes();unset($safetyAttributes['id'],$safetyAttributes['created_at'],$safetyAttributes['updated_at']);
            if (!DB::table('users')->where('id',$owner)->exists()) $safetyAttributes['created_by']=null;
            $savedSafety=\App\Models\SystemBackup::updateOrCreate(['file_path'=>$safetyAttributes['file_path']],$safetyAttributes);
            $meta['safety_backup_id']=$savedSafety->id;
            AuditTrail::record($safetyAttributes['created_by'],'backup.restored','backup_import',null,'Confirmed full recovery',['import_id'=>$id,'safety_backup_id'=>$savedSafety->id]);
            if (Schema::hasTable('personal_access_tokens')) DB::table('personal_access_tokens')->delete();
            Artisan::call('cache:clear');
            $meta['restored_at']=now()->toIso8601String();$meta['tested']=false;$this->save($meta);
            unlink($lockPath);return ['restored'=>true,'sign_in_again'=>true];
        } catch (\Throwable $e) {
            if (!$started) unlink($lockPath);
            // Keep maintenance enabled after a partial restore; do not allow writes to inconsistent data.
            $this->disk()->put($this->key($id).'/failure.json',json_encode(['at'=>now()->toIso8601String(),'error'=>$e->getMessage()]));
            throw $e;
        }
    }
}
