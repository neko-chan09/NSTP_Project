<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function myCertificates(Request $request)
    {
        $student = $request->user()->student;
        $certificates = Certificate::where('student_id', $student->id)
            ->orderBy('issued_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $certificates]);
    }

    public function download($id, Request $request)
    {
        $certificate = Certificate::find($id);
        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        $student = $request->user()->student;
        
        if ($certificate->student_id !== $student->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if (!Storage::disk('public')->exists($certificate->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }
        
        return Storage::disk('public')->download($certificate->file_path, $certificate->certificate_number . '.pdf');
    }

    // Public verification – no auth required
    public function verify($number)
    {
        $certificate = Certificate::with('student.user')->where('certificate_number', $number)->first();
        
        if (!$certificate) {
            return response()->json(['valid' => false, 'message' => 'Certificate not found'], 404);
        }
        
        return response()->json([
            'valid' => true,
            'data' => [
                'certificate_number' => $certificate->certificate_number,
                'student_name' => $certificate->student->user->full_name ?? $certificate->student->user->name,
                'student_id' => $certificate->student->student_id,
                'type' => $certificate->certificate_type,
                'issued_date' => $certificate->issued_at,
            ]
        ]);
    }
}