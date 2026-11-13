<?php
// app/Services/FaceMatchingService.php

namespace App\Services;

use App\Models\FaceEmbedding;
use App\Models\Student;
use Illuminate\Support\Facades\Log;

class FaceMatchingService
{
    public static function validVector(array $vector): bool
    {
        if (count($vector) !== (int) config('face.embedding_size', 192)) return false;
        $norm = 0.0;
        foreach ($vector as $value) {
            if (!is_numeric($value) || !is_finite((float) $value)) return false;
            $norm += (float) $value * (float) $value;
        }
        return is_finite($norm) && $norm > 0;
    }
    /**
     * L2-normalize an embedding vector.
     */
    public function l2Normalize(array $vec): array
    {
        $sumSq = 0.0;
        foreach ($vec as $v) {
            $sumSq += $v * $v;
        }

        if (!is_finite($sumSq) || $sumSq <= 0) {
            throw new \RuntimeException('l2Normalize: degenerate vector');
        }

        $norm = sqrt($sumSq);
        $out = [];
        foreach ($vec as $v) {
            $out[] = $v / $norm;
        }
        return $out;
    }

    /**
     * Cosine similarity between two L2-normalized vectors
     * (equivalent to dot product when both are unit vectors).
     */
    public function cosineSimilarity(array $a, array $b): float
    {
        $len = min(count($a), count($b));
        if ($len === 0) return 0.0;

        $sum = 0.0;
        for ($i = 0; $i < $len; $i++) {
            $sum += $a[$i] * $b[$i];
        }
        return $sum;
    }

    /**
     * Compare a live embedding against a student's stored pose embeddings.
     *
     * @return array{
     *   matched: bool,
     *   similarity: float,
     *   threshold: float,
     *   pose: string|null,
     *   best_pose: string|null
     * }
     */
    public function matchForStudent(Student $student, array $liveEmbedding): array
    {
        $threshold = (float) config('face.match_threshold', 0.5);

        $stored = FaceEmbedding::where('student_id', $student->id)->get();

        if ($stored->isEmpty()) {
            return [
                'matched' => false,
                'similarity' => 0.0,
                'threshold' => $threshold,
                'pose' => null,
                'best_pose' => null,
            ];
        }

        $liveEmbedding = $this->l2Normalize(array_map('floatval', $liveEmbedding));

        $bestSimilarity = -1.0;
        $bestPose = null;

        foreach ($stored as $row) {
            $ref = $row->embedding;

            if (!is_array($ref) || !self::validVector($ref)) {
                continue;
            }

            // Make sure reference is normalized (it should be, per controller store())
            $refNorm = $this->l2Normalize(array_map('floatval', $ref));

            $similarity = $this->cosineSimilarity($liveEmbedding, $refNorm);

            if ($similarity > $bestSimilarity) {
                $bestSimilarity = $similarity;
                $bestPose = $row->pose;
            }
        }

        $matched = $bestSimilarity >= $threshold;

        Log::info('FaceMatchingService::matchForStudent', [
            'student_id' => $student->id,
            'best_pose' => $bestPose,
            'similarity' => round($bestSimilarity, 4),
            'threshold' => $threshold,
            'matched' => $matched,
        ]);

        return [
            'matched' => $matched,
            'similarity' => $bestSimilarity,
            'threshold' => $threshold,
            'pose' => $bestPose,
            'best_pose' => $bestPose,
        ];
    }
}
