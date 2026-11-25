<?php
namespace App\Services;
use App\Models\FaceEmbedding;
use Illuminate\Support\Facades\DB;
class FaceRegistrationUniqueness {
    /** Call in the same transaction as insertion; serializes registrations across accounts. */
    public function lock(): void {
        $guard=DB::table('face_registration_guards')->where('id',1)->lockForUpdate()->first();
        if(!$guard)throw new \RuntimeException('Face registration guard is unavailable.');
    }
    public function linkedToAnother(int $studentId,array $poses):bool {
        $matching=app(FaceMatchingService::class);
        $threshold=(float)config('face.duplicate_threshold',0.75);
        if(!is_finite($threshold)||$threshold<0.5||$threshold>1)throw new \RuntimeException('Invalid duplicate face threshold.');
        $hits=[];
        foreach(FaceEmbedding::where('student_id','!=',$studentId)->orderBy('id')->cursor() as $row){
            if(!is_array($row->embedding)||!FaceMatchingService::validVector($row->embedding))continue;
            $stored=$matching->l2Normalize($row->embedding);
            foreach($poses as $pose=>$vector){
                $score=$matching->cosineSimilarity($vector,$stored);
                if($score>=0.999999)return true; // Also block an exactly copied template.
                if($score>=$threshold)$hits[$row->student_id][$pose]=true;
            }
            if(count($hits[$row->student_id]??[])>=2)return true;
        }
        return false;
    }
}
