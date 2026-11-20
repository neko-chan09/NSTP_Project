<?php
namespace App\Services;
use ZipArchive;
class BackupIntegrity {
    public function verify(string $path): array {
        $zip=new ZipArchive();
        if($zip->open($path,ZipArchive::CHECKCONS)!==true) throw new \RuntimeException('Backup ZIP is invalid.');
        try {
            for($i=0;$i<$zip->numFiles;$i++){
                $name=$zip->getNameIndex($i);
                if(str_contains($name,'\\')||str_starts_with($name,'/')||preg_match('#(^|/)\.\.(/|$)|^[A-Za-z]:#',$name)) throw new \RuntimeException('Unsafe path in backup archive.');
                $ops=0;$attrs=0;$zip->getExternalAttributesIndex($i,$ops,$attrs);
                if((($attrs>>16)&0170000)===0120000) throw new \RuntimeException('Links are not allowed in backup archives.');
            }
            $manifest=json_decode($zip->getFromName('manifest.json')?:'',true);
            if(!is_array($manifest)||!isset($manifest['files']['database.sql'])) throw new \RuntimeException('Backup has no integrity manifest. Create a new verified backup before restoring.');
            foreach($manifest['files'] as $name=>$hash){
                $stream=$zip->getStream($name);if(!$stream)throw new \RuntimeException('A backup file is missing.');
                $ctx=hash_init('sha256');hash_update_stream($ctx,$stream);fclose($stream);
                if(!hash_equals($hash,hash_final($ctx)))throw new \RuntimeException('Backup checksum mismatch.');
            }
            for($i=0;$i<$zip->numFiles;$i++){$name=$zip->getNameIndex($i);if(!str_ends_with($name,'/')&&$name!=='manifest.json'&&!isset($manifest['files'][$name]))throw new \RuntimeException('Backup contains an unverified file.');}
            return ['verified'=>true,'files'=>count($manifest['files']),'driver'=>$manifest['driver']??'mysql','created_at'=>$manifest['created_at']??null];
        } finally {$zip->close();}
    }
}
