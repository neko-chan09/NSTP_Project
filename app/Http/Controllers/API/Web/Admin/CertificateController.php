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
use App\Services\CertificateDesignService;
use Illuminate\Support\Facades\DB;

class CertificateController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'super_admin'], true), 403);
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);
        $certificates = Certificate::with('student.user')->get();
        return response()->json(['success' => true, 'data' => $certificates]);
    }

    // ── INSERTED HERE ──
    public function getEligibleStudents(Request $request)
    {
        $this->authorizeAdmin($request);
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
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'certificate_type' => 'required|in:completion,participation,training',
            'template_mode' => 'sometimes|in:default,saved',
        ]);
        $student = Student::with('user')->findOrFail($data['student_id']);
        $this->checkEligibility($student, $data['certificate_type']);
        $design = $this->selectedDesign($data['certificate_type'], $data['template_mode'] ?? 'default');
        $certificate = $this->issue($student, $data['certificate_type'], $design, $request->user()->id);
        return response()->json(['success' => true, 'message' => 'Certificate generated', 'data' => $certificate]);
    }

    private function checkEligibility(Student $student, string $type): void
    {
        if ($type === 'completion' && !$student->is_eligible_for_completion) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'student_ids' => "Student {$student->student_id} is not eligible for a completion certificate.",
            ]);
        }
    }

    private function selectedDesign(string $type, string $mode): array
    {
        $service = app(CertificateDesignService::class);
        if ($mode === 'saved') {
            $saved = $service->load($type);
            if (!$saved) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'template_mode' => 'Save a design for this certificate type before generating certificates.',
                ]);
            }
            return $service->validate($saved['design']);
        }
        return $service->defaults($type);
    }

    private function issue(Student $student, string $type, array $design, int $issuerId): Certificate
    {
        $service = app(CertificateDesignService::class);
        $number = 'NSTP-' . date('Y') . '-' . Str::upper(Str::random(8));
        $verificationUrl = url('/api/verify-certificate/' . $number);
        $pdfPath = 'certificates/' . $number . '.pdf';
        $qrPath = 'certificates/qrcodes/' . $number . '.png';
        $pdf = $service->render($design, $service->fields($student, $type, $number), $verificationUrl);
        try {
            if (!Storage::disk('public')->put($pdfPath, $pdf->output()) ||
                !Storage::disk('public')->put($qrPath, QrCode::format('png')->size(200)->generate($verificationUrl))) {
                throw new \RuntimeException('The certificate file could not be stored.');
            }
            $certificate = DB::transaction(function () use ($student, $number, $type, $pdfPath, $qrPath, $issuerId) {
                $certificate = Certificate::create([
                    'student_id' => $student->id, 'certificate_number' => $number,
                    'certificate_type' => $type, 'file_path' => $pdfPath, 'qr_code_path' => $qrPath,
                    'status' => 'issued', 'issued_by' => $issuerId, 'issued_at' => now(),
                ]);
                NotificationHelper::sendToStudent($student, 'Certificate Issued',
                    "Your {$type} certificate is now available.", 'certificate', ['id' => $certificate->id]);
                return $certificate;
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete([$pdfPath, $qrPath]);
            throw $error;
        }
        return $certificate;
    }

    public function batchGenerate(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'student_ids' => 'required|array|min:1|max:200',
            'student_ids.*' => 'required|integer|distinct|exists:students,id',
            'certificate_type' => 'required|in:completion,participation,training',
            'template_mode' => 'sometimes|in:default,saved',
        ]);
        $students = Student::with('user')->whereIn('id', $data['student_ids'])->get();
        // Validate every recipient before issuing any certificate.
        foreach ($students as $student) {
            $this->checkEligibility($student, $data['certificate_type']);
        }
        // Snapshot the saved design once so a batch cannot mix template revisions.
        $design = $this->selectedDesign($data['certificate_type'], $data['template_mode'] ?? 'default');
        $certificates = [];
        $files = [];
        try {
            DB::transaction(function () use ($students, $data, $design, $request, &$certificates, &$files) {
                foreach ($students as $student) {
                    $certificate = $this->issue($student, $data['certificate_type'], $design, $request->user()->id);
                    $certificates[] = $certificate;
                    $files[] = $certificate->file_path;
                    $files[] = $certificate->qr_code_path;
                }
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($files);
            throw $error;
        }
        return response()->json(['success' => true, 'data' => $certificates]);
    }
}
