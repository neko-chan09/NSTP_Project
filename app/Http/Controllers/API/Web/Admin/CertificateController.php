<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use App\Helpers\NotificationHelper;

class CertificateController extends Controller
{
    public function index()
    {
        $certificates = Certificate::with('student.user')->get();
        return response()->json(['success' => true, 'data' => $certificates]);
    }

    // ── INSERTED HERE ──
    public function getEligibleStudents(Request $request)
    {
        $search = $request->get('search', '');

        $students = Student::with('user')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('student_id', 'LIKE', "%{$search}%")
                      ->orWhereHas('user', function ($q2) use ($search) {
                          $q2->where('first_name', 'LIKE', "%{$search}%")
                             ->orWhere('last_name', 'LIKE', "%{$search}%");
                      });
                });
            })
            ->orderBy('student_id', 'asc')
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                    'course' => $student->course,
                    'year_level' => $student->year_level,
                    'section' => $student->section,
                    'nstp_component_selected' => $student->nstp_component_selected,
                    'is_eligible_for_completion' => $student->is_eligible_for_completion,
                    'completion_status' => $student->completion_status,
                    'user' => [
                        'first_name' => $student->user->first_name,
                        'last_name' => $student->user->last_name,
                        'email' => $student->user->email,
                    ],
                ];
            });

        return response()->json(['data' => $students]);
    }
    // ── END INSERT ──

    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:students,id',
            'certificate_type' => 'required|in:completion,participation,training',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $student = Student::with('user')->find($request->student_id);
        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $certificateNumber = 'NSTP-' . date('Y') . '-' . Str::upper(Str::random(8));
        
        // Generate QR Code
        $qrCode = QrCode::format('png')->size(200)->generate($certificateNumber);
        $qrPath = 'certificates/qrcodes/' . $certificateNumber . '.png';
        Storage::disk('public')->put($qrPath, $qrCode);

        // Generate PDF
        $pdf = Pdf::loadView('certificates.completion', [
            'student' => $student,
            'certificate_number' => $certificateNumber,
            'date' => now()->format('F d, Y'),
        ]);
        
        $pdfPath = 'certificates/' . $certificateNumber . '.pdf';
        Storage::disk('public')->put($pdfPath, $pdf->output());

        $certificate = Certificate::create([
            'student_id' => $request->student_id,
            'certificate_number' => $certificateNumber,
            'certificate_type' => $request->certificate_type,
            'file_path' => $pdfPath,
            'qr_code_path' => $qrPath,
            'status' => 'issued',
            'issued_by' => $request->user()->id,
            'issued_at' => now(),
        ]);

        // --- Add notification to student ---
        NotificationHelper::sendToStudent(
            $student,
            'Certificate Issued',
            "Your {$request->certificate_type} certificate is now available.",
            'certificate',
            ['id' => $certificate->id]
        );

        return response()->json([
            'success' => true,
            'message' => 'Certificate generated',
            'data' => $certificate
        ]);
    }

    public function batchGenerate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'certificate_type' => 'required|in:completion,participation,training',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $certificates = [];
        foreach ($request->student_ids as $studentId) {
            $childRequest = new Request([
                'student_id' => $studentId,
                'certificate_type' => $request->certificate_type,
            ]);
            $childRequest->setUserResolver(fn () => $request->user());
            $response = $this->generate($childRequest);
            $payload = $response->getData(true);
            if (isset($payload['data'])) {
                $certificates[] = $payload['data'];
            }
        }

        return response()->json(['success' => true, 'data' => $certificates]);
    }
}