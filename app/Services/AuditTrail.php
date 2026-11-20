<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
class AuditTrail {
    public static function record(?int $actor, string $event, string $type, ?int $id, ?string $reason=null, array $details=[]): void {
        // Callers pass explicit metadata only. Never accept raw request/password/token payloads.
        DB::table('audit_events')->insert(['actor_id'=>$actor,'event'=>$event,'subject_type'=>$type,'subject_id'=>$id,'reason'=>$reason,'details'=>json_encode($details),'created_at'=>now()]);
    }
}
