<?php
// app/Services/BackupService.php

namespace App\Services;

use App\Models\SystemBackup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class BackupService
{
    /**
     * Run a full backup (database + storage/app/public).
     *
     * @param  string  $type  'manual' | 'auto'
     * @param  int|null  $userId
     * @return SystemBackup
     */
    public function createBackup(string $type = 'manual', ?int $userId = null): SystemBackup
    {
        $timestamp = now()->format('Y-m-d_His');
        $name = "backup_{$timestamp}_".Str::random(8);
        $fileName = "{$name}.zip";
        $relativePath = "backups/{$fileName}";

        // 1. Create record
        $backup = SystemBackup::create([
            'backup_name'  => $name,
            'file_path'    => $relativePath,
            'disk'         => 'local',
            'type'         => $type,
            'status'       => 'processing',
            'notes'        => null,
            'created_by'   => $userId,
            'started_at'   => now(),
        ]);

        try {
            // 2. Temp paths
            $tmpDir = storage_path('app/tmp_backups/' . $name);
            if (!file_exists($tmpDir)) {
                mkdir($tmpDir, 0755, true);
            }

            // 3. Dump database
            $dbDumpPath = $tmpDir . '/database.sql';
            $this->dumpDatabase($dbDumpPath);

            // 4. Copy public storage
            $storageCopyDir = $tmpDir . '/storage';
            $this->copyStorage($storageCopyDir);

            $manifest=['created_at'=>now()->toIso8601String(),'driver'=>DB::connection()->getDriverName(),'files'=>[]];
            foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($tmpDir,\FilesystemIterator::SKIP_DOTS)) as $file) {
                if($file->isLink())throw new \RuntimeException('Backup sources cannot contain symbolic links.');
                if($file->isFile())$manifest['files'][str_replace('\\','/',substr($file->getPathname(),strlen($tmpDir)+1))]=hash_file('sha256',$file->getPathname());
            }
            file_put_contents($tmpDir.'/manifest.json',json_encode($manifest,JSON_PRETTY_PRINT));
            // 5. Zip everything
            $zipPath = Storage::disk('local')->path($relativePath);
            if (!file_exists(dirname($zipPath))) {
                mkdir(dirname($zipPath), 0755, true);
            }
            $this->zipDirectory($tmpDir, $zipPath);

            app(BackupIntegrity::class)->verify($zipPath);
            // 6. Count files
            $storageFiles = $this->countFiles($storageCopyDir);
            $tablesCount = count($this->getTableNames());

            // 7. Update record
            $fileSize = file_exists($zipPath) ? filesize($zipPath) : 0;
            $backup->update([
                'file_size'           => $fileSize,
                'tables_count'        => $tablesCount,
                'storage_files_count' => $storageFiles,
                'status'              => 'completed',
                'completed_at'        => now(),
                'finished_at'         => now(),
            ]);

            // 8. Clean up temp
            $this->deleteDirectory($tmpDir);

            Log::info('Backup completed successfully', [
                'backup_id' => $backup->id,
                'file_size' => $fileSize,
            ]);

            AuditTrail::record($userId,'backup.created','backup',$backup->id,null,['type'=>$type,'files'=>$storageFiles]);
            return $backup->fresh();
        } catch (\Throwable $e) {
            Log::error('Backup failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            $backup->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
                'finished_at'   => now(),
            ]);

            throw $e;
        }
    }

    /**
     * Dump the entire database to a .sql file.
     * Uses mysqldump if available, falls back to pure PHP.
     */
    protected function dumpDatabase(string $path): void
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        // Try mysqldump first
        if ($config['driver'] === 'mysql' && $this->isMysqldumpAvailable()) {
            $process=new \Symfony\Component\Process\Process(['mysqldump','--single-transaction','--user='.$config['username'],'--host='.$config['host'],'--port='.($config['port']??3306),$config['database']],null,['MYSQL_PWD'=>(string)$config['password']]);
            $process->setTimeout(300);$stream=fopen($path,'w');
            try{$return=$process->run(function($type,$buffer)use($stream){if($type===\Symfony\Component\Process\Process::OUT)fwrite($stream,$buffer);});}finally{fclose($stream);}
            $output=[];
            if ($return === 0 && file_exists($path) && filesize($path) > 0) {
                return;
            }

            Log::warning('mysqldump failed, falling back to PHP dumper', [
                'return' => $return,
                'output' => $output,
            ]);
        }

        // Fallback: pure-PHP dump
        $this->phpDumpDatabase($path);
    }

    /**
     * Check if mysqldump is available.
     */
    protected function isMysqldumpAvailable(): bool
    {
        if(!function_exists('exec'))return false;
        exec('which mysqldump 2>nul', $out, $code);
        if ($code === 0) return true;

        // Windows check
        exec('where mysqldump 2>nul', $out2, $code2);
        return $code2 === 0;
    }

    /**
     * Pure-PHP database dump.
     */
    protected function phpDumpDatabase(string $path): void
    {
        if(DB::connection()->getDriverName()==='sqlite') {
            $handle=fopen($path,'w');fwrite($handle,"PRAGMA foreign_keys=OFF;\n");
            foreach(DB::select("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'") as $table) {
                $identifier='"'.str_replace('"','""',$table->name).'"';fwrite($handle,"DROP TABLE IF EXISTS $identifier;\n".$table->sql.";\n");
                foreach(DB::table($table->name)->cursor() as $row){$values=array_map(fn($v)=>$v===null?'NULL':DB::connection()->getPdo()->quote((string)$v),(array)$row);fwrite($handle,"INSERT INTO $identifier VALUES (".implode(',',$values).");\n");}
            }
            fwrite($handle,"PRAGMA foreign_keys=ON;\n");fclose($handle);return;
        }
        $tables = $this->getTableNames();
        $handle = fopen($path, 'w');

        fwrite($handle, "-- NSTP Database Backup\n");
        fwrite($handle, "-- Generated: " . now()->toDateTimeString() . "\n\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        foreach ($tables as $table) {
            fwrite($handle, "\n-- ----------------------------\n");
            fwrite($handle, "-- Table structure for `{$table}`\n");
            fwrite($handle, "-- ----------------------------\n");
            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");

            // CREATE TABLE statement
            $create = DB::select("SHOW CREATE TABLE `{$table}`");
            $createSql = (array) $create[0];
            fwrite($handle, $createSql['Create Table'] . ";\n\n");

            // INSERT statements
            $rows = DB::table($table)->cursor();
                fwrite($handle, "\n-- Dumping data for `{$table}`\n");
                foreach ($rows->chunk(100) as $chunk) {
                    $inserts = [];
                    foreach ($chunk as $row) {
                        $values = [];
                        foreach ((array) $row as $value) {
                            if (is_null($value)) {
                                $values[] = 'NULL';
                            } else {
                                $values[] = DB::connection()->getPdo()->quote((string)$value);
                            }
                        }
                        $inserts[] = '(' . implode(',', $values) . ')';
                    }
                    fwrite($handle, "INSERT INTO `{$table}` VALUES\n" . implode(",\n", $inserts) . ";\n");
                }
            
            fwrite($handle, "\n");
        }

        fwrite($handle, "\nSET FOREIGN_KEY_CHECKS=1;\n");
        fclose($handle);
    }

    /**
     * Copy storage/app/public into the tmp storage folder.
     */
    protected function copyStorage(string $destination): void
    {
        $source = storage_path('app/public');
        if (!file_exists($source)) {
            mkdir($destination, 0755, true);
            return;
        }
        $this->recurseCopy($source, $destination);
    }

    /**
     * Recursively copy a directory.
     */
    protected function recurseCopy(string $source, string $dest): void
    {
        if (!is_dir($dest)) {
            mkdir($dest, 0755, true);
        }
        $dir = opendir($source);
        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') continue;
            $srcPath = $source . DIRECTORY_SEPARATOR . $file;
            $dstPath = $dest . DIRECTORY_SEPARATOR . $file;
            if(is_link($srcPath)) throw new \RuntimeException('Backup sources cannot contain symbolic links.');
            if (is_dir($srcPath)) {
                $this->recurseCopy($srcPath, $dstPath);
            } else {
                copy($srcPath, $dstPath);
            }
        }
        closedir($dir);
    }

    /**
     * Recursively delete a directory.
     */
    protected function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($items as $item) {
            $item->isDir() ? rmdir($item->getRealPath()) : unlink($item->getRealPath());
        }
        rmdir($dir);
    }

    /**
     * Zip a directory into a single file.
     */
    protected function zipDirectory(string $source, string $destination): void
    {
        $zip = new ZipArchive();
        if ($zip->open($destination, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException("Cannot create zip at {$destination}");
        }

        $source = rtrim($source, '/') . '/';
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            $filePath = $file->getRealPath();
            $relativePath = str_replace('\\','/',substr($filePath, strlen($source)));
            if ($file->isDir()) {
                $zip->addEmptyDir($relativePath);
            } else {
                $zip->addFile($filePath, $relativePath);
            }
        }

        $zip->close();
    }

    /**
     * Count files inside a directory recursively.
     */
    protected function countFiles(string $dir): int
    {
        if (!is_dir($dir)) return 0;
        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->isFile()) $count++;
        }
        return $count;
    }

    /**
     * Get all table names (excluding migrations meta tables you don't want to restore).
     */
    protected function getTableNames(): array
    {
        if(DB::connection()->getDriverName()==='sqlite')return array_column(DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"),'name');
        $tables = DB::select('SHOW TABLES');
        $key = 'Tables_in_' . config('database.connections.' . config('database.default') . '.database');
        return array_map(fn ($t) => $t->$key ?? array_values((array) $t)[0], $tables);
    }

    public function backupPath(SystemBackup $backup): string {
        if(!preg_match('#^backups/[A-Za-z0-9_.-]+\.zip$#D',$backup->file_path))throw new \RuntimeException('Invalid backup path.');
        $path=Storage::disk('local')->path($backup->file_path);
        if(!is_file($path))$path=storage_path('app/'.$backup->file_path);
        if(!is_file($path))throw new \RuntimeException('Backup file not found.');
        return $path;
    }
    public function verifyBackup(SystemBackup $backup): array {
        return app(BackupIntegrity::class)->verify($this->backupPath($backup));
    }
    /** Restores SQL only to an explicitly separate, configured testing connection. */
    public function testRestore(SystemBackup $backup,string $connection): array {
        $config=config('database.connections.'.$connection);
        $production=config('database.connections.'.config('database.default'));
        if(!$config||$connection===config('database.default')||empty($config['database'])||(mb_strtolower((string)($config['database']??''))===mb_strtolower((string)($production['database']??''))))throw new \RuntimeException('Configure a separate restore-testing database first.');
        $info=$this->verifyBackup($backup);
        if(($config['driver']??null)!==$info['driver'])throw new \RuntimeException('Restore-test database driver must match the backup.');
        $zip=new ZipArchive();$zip->open($this->backupPath($backup));
        try{$sql=$zip->getFromName('database.sql');if(!$sql)throw new \RuntimeException('Database dump is empty.');DB::connection($connection)->unprepared($sql);}finally{$zip->close();}
        return ['restored'=>true,'connection'=>$connection]+$info;
    }

    /**
     * Delete a backup file and record.
     */
    public function deleteBackup(SystemBackup $backup): void {
        $path=$this->backupPath($backup);if(!unlink($path))throw new \RuntimeException('Could not delete backup file.');AuditTrail::record(request()->user()?->id,'backup.deleted','backup',$backup->id);$backup->delete();
    }

    /**
     * Restore from a backup ZIP.
     */
    public function restoreBackup(SystemBackup $backup): void
    {
        $filePath = $this->backupPath($backup);
        app(BackupIntegrity::class)->verify($filePath);
        if (!file_exists($filePath)) {
            throw new \RuntimeException('Backup file not found on disk');
        }

        $tmpDir = storage_path('app/tmp_restore_' . Str::random(8));
        mkdir($tmpDir, 0755, true);

        try {
            // 1. Extract ZIP
            $zip = new ZipArchive();
            if ($zip->open($filePath) !== true) {
                throw new \RuntimeException('Could not open backup zip');
            }
            $zip->extractTo($tmpDir);
            $zip->close();

            // 2. Restore database
            $sqlPath = $tmpDir . '/database.sql';
            if (file_exists($sqlPath)) {
                $this->restoreDatabase($sqlPath);
            }

            // 3. Restore storage
            $storageSource = $tmpDir . '/storage';
            if (is_dir($storageSource)) {
                $storageDest = storage_path('app/public');
                $this->deleteDirectory($storageDest);
                mkdir($storageDest, 0755, true);
                $this->recurseCopy($storageSource, $storageDest);
            }
        } finally {
            $this->deleteDirectory($tmpDir);
        }
    }

    /**
     * Restore database from a .sql file.
     */
    protected function restoreDatabase(string $sqlPath): void
    {
        $sql = file_get_contents($sqlPath);
        DB::unprepared($sql);
    }
}