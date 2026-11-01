<?php
// app/Http/Controllers/API/Web/SuperAdmin/SuperAdminFaceResetController.php

namespace App\Http\Controllers\API\Web\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FaceEmbedding;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SuperAdminFaceResetController extends Controller
{
    /**
     * GET /api/superadmin/students/search?search=...
     */
    public function search(Request $request)
    {
        $this->authorizeSuperAdmin($request);

        $q = trim((string) $request->query('search', ''));
        if (mb_strlen($q) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $students = Student::with('user')
            ->where(function ($query) use ($q) {
                $query->where('student_id', 'like', "%{$q}%")
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('first_name', 'like', "%{$q}%")
                            ->orWhere('last_name', 'like', "%{$q}%")
                            ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$q}%"]);
                    });
            })
            ->limit(10)
            ->get();

        // Which of these students currently have a registered face?
        $withFace = FaceEmbedding::whereIn('student_id', $students->pluck('id'))
            ->selectRaw('student_id, COUNT(*) as c')
            ->groupBy('student_id')
            ->pluck('c', 'student_id');

        $data = $students->map(fn ($s) => [
            'id' => $s->id,
            'student_id' => $s->student_id,
            'full_name' => trim(($s->user->first_name ?? '') . ' ' . ($s->user->last_name ?? '')),
            'course' => $s->course ?? null,
            'component' => $s->nstp_component ?? $s->component ?? null,
            'has_face' => ($withFace[$s->id] ?? 0) >= 3,
        ])->values();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * DELETE /api/superadmin/students/{student}/face-embeddings
     */
    public function destroy(Request $request, Student $student)
    {
        $this->authorizeSuperAdmin($request);

        $deleted = FaceEmbedding::where('student_id', $student->id)->delete();

        Log::info('face_embeddings.admin_reset', [
            'student_id' => $student->id,
            'by_user_id' => $request->user()->id,
            'rows_deleted' => $deleted,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Face registration reset. The student can register once again.',
        ]);
    }

    /** Destructive action: only super admins (routes only have auth:sanctum). */
    private function authorizeSuperAdmin(Request $request): void
    {
        if (($request->user()->role ?? null) !== 'super_admin') {
            abort(403, 'Only super admins can reset face registrations.');
        }
    }
}