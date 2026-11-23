<?php
namespace App\Http\Controllers\API\Web\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\BackupImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class BackupImportController extends Controller
{
    public function index(Request $request,BackupImportService $service)
    {
        return response()->json(['data'=>$service->history($request->user()->id)])->header('Cache-Control','private, no-store');
    }
    public function upload(Request $request, BackupImportService $service)
    {
        $request->validate(['backup'=>'required|file|max:102400']);
        if (strtolower($request->file('backup')->getClientOriginalExtension())!=='zip') return response()->json(['message'=>'Choose an NSTP backup ZIP file.'],422);
        return $this->run(fn()=>['data'=>$service->import($request->file('backup'),$request->user()->id),'message'=>'Backup uploaded. Current data has not been changed.']);
    }
    public function prepare(Request $request,int $id,BackupImportService $service)
    {
        $backup=\App\Models\SystemBackup::findOrFail($id);
        abort_unless($backup->status==='completed',422,'Choose a completed backup.');
        return $this->run(function()use($request,$backup,$service){
            $path=app(\App\Services\BackupService::class)->backupPath($backup);
            $file=new \Illuminate\Http\UploadedFile($path,$backup->backup_name.'.zip','application/zip',null,true);
            return ['data'=>$service->import($file,$request->user()->id),'message'=>'Backup prepared for testing. Current data has not been changed.'];
        });
    }
    public function test(Request $request,string $id,BackupImportService $service)
    {
        return $this->run(fn()=>['data'=>$service->recoveryTest($id,$request->user()->id),'message'=>'Separate-database recovery test passed.']);
    }
    public function restore(Request $request,string $id,BackupImportService $service)
    {
        $request->validate(['confirmation'=>'required|in:RESTORE','password'=>'required|string']);
        if (!Hash::check($request->password,$request->user()->getAuthPassword())) return response()->json(['message'=>'Your Super Admin password is incorrect.'],422);
        return $this->run(fn()=>['data'=>$service->restore($id,$request->user()->id),'message'=>'Recovery completed. Sign in again.']);
    }
    private function run(callable $action)
    {
        try { return response()->json($action()); }
        catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) { throw $e; }
        catch (\Throwable $e) {
            Log::warning('Backup import/recovery failed', ['type'=>get_class($e)]);
            return response()->json(['message'=>$e instanceof \RuntimeException && !$e instanceof \PDOException ? $e->getMessage() : 'Recovery operation failed. Check the server log and recovery database configuration.'],422);
        }
    }
}
