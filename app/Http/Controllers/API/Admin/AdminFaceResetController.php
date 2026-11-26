<?php
// app/Http/Controllers/API/Admin/AdminFaceResetController.php
// Already referenced by routes/api.php (admin group). Safe to delete together
// with its route + import if you only want super admins to reset faces.

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\FaceEmbedding;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminFaceResetController extends Controller
{
    public function destroy(Request $request, Student $student)
    {
        $deleted = FaceEmbedding::where('student_id', $student->id)->delete();

        Log::info('face_embeddings.admin_reset', [
            'student_id' => $student->id,
            'admin_user_id' => $request->user()->id,
            'rows_deleted' => $deleted,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Face registration reset. The student can register once again.',
        ]);
    }
}