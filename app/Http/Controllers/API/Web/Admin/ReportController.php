<?php
// app/Http/Controllers/API/Web/Admin/ReportController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Document;
use App\Models\Certificate;
use App\Models\ActivityParticipation;
use App\Models\AttendanceLog;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    /**
     * Helper function to convert name to uppercase
     */
    private function toUpperCase($value)
    {
        if (empty($value)) return 'N/A';
        return strtoupper($value);
    }

    /**
     * Helper function to format gender for display
     */
    private function formatGender($gender)
    {
        if (empty($gender)) return 'N/A';
        return ucfirst(strtolower($gender));
    }

    /**
     * Helper function to get gender sort order
     * Male = 0, Female = 1, Others = 2
     */
    private function getGenderSortOrder($gender)
    {
        $genderLower = strtolower($gender ?? '');
        if ($genderLower === 'male') return 0;
        if ($genderLower === 'female') return 1;
        return 2;
    }

    /**
     * Enrollment Summary Report
     */
    public function enrollmentSummary()
    {
        try {
            $total = Student::count();
            
            $totalMale = Student::whereHas('user', fn($q) => $q->where('gender', 'male'))->count();
            $totalFemale = Student::whereHas('user', fn($q) => $q->where('gender', 'female'))->count();

            $cwts = Student::where('nstp_component_selected', 'cwts')->count();
            $rotc = Student::where('nstp_component_selected', 'rotc')->count();
            $lts = Student::where('nstp_component_selected', 'lts')->count();

            $cwtsMale = Student::where('nstp_component_selected', 'cwts')
                ->whereHas('user', fn($q) => $q->where('gender', 'male'))->count();
            $cwtsFemale = Student::where('nstp_component_selected', 'cwts')
                ->whereHas('user', fn($q) => $q->where('gender', 'female'))->count();

            $rotcMale = Student::where('nstp_component_selected', 'rotc')
                ->whereHas('user', fn($q) => $q->where('gender', 'male'))->count();
            $rotcFemale = Student::where('nstp_component_selected', 'rotc')
                ->whereHas('user', fn($q) => $q->where('gender', 'female'))->count();

            $ltsMale = Student::where('nstp_component_selected', 'lts')
                ->whereHas('user', fn($q) => $q->where('gender', 'male'))->count();
            $ltsFemale = Student::where('nstp_component_selected', 'lts')
                ->whereHas('user', fn($q) => $q->where('gender', 'female'))->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'total_male' => $totalMale,
                    'total_female' => $totalFemale,
                    'total_unspecified' => $total - ($totalMale + $totalFemale),
                    'cwts' => $cwts,
                    'cwts_male' => $cwtsMale,
                    'cwts_female' => $cwtsFemale,
                    'rotc' => $rotc,
                    'rotc_male' => $rotcMale,
                    'rotc_female' => $rotcFemale,
                    'lts' => $lts,
                    'lts_male' => $ltsMale,
                    'lts_female' => $ltsFemale,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Enrollment Summary Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load enrollment summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deficiency Report
     */
    public function deficiencySummary()
    {
        try {
            $students = Student::with('user')
                ->where('is_eligible_for_completion', false)
                ->get()
                ->map(function ($student) {
                    $requiredHours = 90;
                    $completedHours = $student->completed_training_hours ?? 0;
                    $missingHours = max(0, $requiredHours - $completedHours);

                    $missingDocuments = Document::where('student_id', $student->id)
                        ->whereIn('status', ['pending', 'rejected'])
                        ->pluck('document_type')
                        ->toArray();

                    return [
                        'id' => $student->id,
                        'student_id' => $student->student_id,
                        'user' => [
                            'first_name' => $this->toUpperCase($student->user->first_name ?? ''),
                            'last_name' => $this->toUpperCase($student->user->last_name ?? ''),
                            'email' => strtolower($student->user->email ?? ''),
                        ],
                        'nstp_component_selected' => $student->nstp_component_selected,
                        'completed_training_hours' => $completedHours,
                        'total_training_hours' => $student->total_training_hours ?? 0,
                        'is_eligible_for_completion' => $student->is_eligible_for_completion,
                        'completion_status' => $student->completion_status ?? 'pending',
                        'missing_documents' => $missingDocuments,
                        'missing_hours' => $missingHours,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $students,
                'meta' => [
                    'total_deficient' => $students->count(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Deficiency Summary Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load deficiency summary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Compliance Report (PDF)
     */
    public function complianceReport(Request $request)
    {
        try {
            $students = Student::with('user')->get();
            $pdf = Pdf::loadView('reports.compliance', [
                'students' => $students,
                'generated_at' => now(),
            ]);
            return $pdf->download('compliance_report_' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Compliance Report PDF Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate compliance report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Deficiency Report (PDF)
     */
    public function deficiencyReport(Request $request)
    {
        try {
            $students = Student::with('user')
                ->where('is_eligible_for_completion', false)
                ->get();

            $pdf = Pdf::loadView('reports.deficiency', [
                'students' => $students,
                'generated_at' => now(),
            ]);

            return $pdf->download('deficiency_report_' . date('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Deficiency Report PDF Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate deficiency report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Attendance Report
     */
    public function attendanceReport(Request $request)
    {
        try {
            $request->validate([
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'component' => 'nullable|in:cwts,rotc,lts',
            ]);

            $startDate = $request->start_date;
            $endDate = $request->end_date;
            $component = $request->component;

            $query = DB::table('attendance_logs')
                ->join('students', 'attendance_logs.student_id', '=', 'students.id')
                ->join('attendance_sessions', 'attendance_logs.session_id', '=', 'attendance_sessions.id')
                ->whereBetween('attendance_logs.check_in_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

            if ($component) {
                $query->where('students.nstp_component_selected', $component);
            }

            $dailyBreakdown = $query
                ->select(
                    DB::raw('DATE(attendance_logs.check_in_at) as date'),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN attendance_logs.status = "present" THEN 1 ELSE 0 END) as present'),
                    DB::raw('SUM(CASE WHEN attendance_logs.status = "late" THEN 1 ELSE 0 END) as late'),
                    DB::raw('SUM(CASE WHEN attendance_logs.status = "absent" THEN 1 ELSE 0 END) as absent')
                )
                ->groupBy(DB::raw('DATE(attendance_logs.check_in_at)'))
                ->orderBy(DB::raw('DATE(attendance_logs.check_in_at)'), 'asc')
                ->get()
                ->map(function ($row) {
                    $total = $row->total;
                    $rate = $total > 0 ? round(($row->present / $total) * 100, 2) : 0;
                    return [
                        'date' => $row->date,
                        'total' => $total,
                        'present' => $row->present,
                        'late' => $row->late,
                        'absent' => $row->absent,
                        'rate' => $rate,
                    ];
                });

            $summary = DB::table('attendance_logs')
                ->join('students', 'attendance_logs.student_id', '=', 'students.id')
                ->join('attendance_sessions', 'attendance_logs.session_id', '=', 'attendance_sessions.id')
                ->whereBetween('attendance_logs.check_in_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->when($component, function ($query, $component) {
                    return $query->where('students.nstp_component_selected', $component);
                })
                ->select(
                    DB::raw('COUNT(DISTINCT attendance_logs.session_id) as total_sessions'),
                    DB::raw('COUNT(*) as total_checkins'),
                    DB::raw('SUM(CASE WHEN attendance_logs.status = "present" THEN 1 ELSE 0 END) as present'),
                    DB::raw('SUM(CASE WHEN attendance_logs.status = "late" THEN 1 ELSE 0 END) as late')
                )
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_sessions' => $summary->total_sessions ?? 0,
                    'total_checkins' => $summary->total_checkins ?? 0,
                    'present' => $summary->present ?? 0,
                    'late' => $summary->late ?? 0,
                    'details' => $dailyBreakdown,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Attendance Report Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load attendance report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Accomplishment Report PDF
     */
    public function accomplishmentReportPdf(Request $request)
    {
        $reportData = $this->getAccomplishmentData($request);
        $pdf = Pdf::loadView('reports.accomplishment', [
            'students' => $reportData['students'],
            'summary' => $reportData['summary'],
            'filters' => $reportData['filters'],
            'generated_at' => now(),
            'title' => 'NSTP Accomplishment Report',
        ]);
        return $pdf->download('accomplishment_report_' . date('Y-m-d') . '.pdf');
    }

    /**
     * Export Accomplishment Report to CSV
     */
    public function accomplishmentExport(Request $request)
    {
        try {
            $query = Student::with(['user']);
            
            if ($request->filled('component')) {
                $query->where('nstp_component_selected', $request->component);
            }
            
            $status = $request->input('status', 'completed');
            if ($status !== 'all' && $status !== '') {
                $query->where('completion_status', $status);
            }

            $students = $query->orderBy('completed_at', 'desc')->get();

            $rows = $students->map(function ($student) {
                return [
                    'student_id' => $student->student_id,
                    'no' => 0,
                    'serial_no' => '',
                    'surname' => $this->toUpperCase($student->user->last_name ?? ''),
                    'first_name' => $this->toUpperCase($student->user->first_name ?? ''),
                    'middle_name' => $this->toUpperCase($student->user->middle_name ?? ''),
                    'course_program' => $this->toUpperCase($student->course ?? 'BEEd'),
                    'gender' => $this->formatGender($student->gender),
                    'birthdate' => $student->birth_date ? date('Y-m-d', strtotime($student->birth_date)) : 'N/A',
                    'address' => $this->toUpperCase($student->address ?? 'N/A'),
                    'telephone_mobile' => $student->user->contact_number ?? 'N/A',
                    'email_address' => strtolower($student->user->email ?? 'N/A'),
                    'component' => $student->nstp_component_selected ?? 'N/A',
                    'completed_hours' => $student->completed_training_hours,
                    'total_hours' => $student->total_training_hours ?? 90,
                    'status' => $student->completion_status,
                    'is_eligible' => $student->is_eligible_for_completion ? 'Yes' : 'No',
                    'completed_at' => $student->completed_at,
                ];
            });

            $sortedRows = $rows->sortBy(function ($item) {
                return $this->getGenderSortOrder($item['gender']);
            })->values();

            $sortedRows = $sortedRows->map(function ($item, $index) {
                $item['no'] = $index + 1;
                return $item;
            });

            // Export with all columns for editing
            $headers = [
                'Student ID',
                'No.',
                'Serial No.',
                'Surname',
                'First Name',
                'Middle Name',
                'Course/Program',
                'Gender',
                'Birthdate',
                'Address',
                'Telephone/Mobile No.',
                'Email Address',
                'Component',
                'Completed Hours',
                'Total Hours',
                'Status',
                'Eligible',
                'Completed At'
            ];

            $csv = implode(',', $headers) . "\n";
            foreach ($sortedRows as $row) {
                $escapedRow = array_map(function($value) {
                    if ($value === null) return '';
                    $value = (string) $value;
                    if (strpos($value, ',') !== false || 
                        strpos($value, '"') !== false || 
                        strpos($value, "\n") !== false || 
                        strpos($value, "\r") !== false) {
                        return '"' . str_replace('"', '""', $value) . '"';
                    }
                    return $value;
                }, array_values($row));
                $csv .= implode(',', $escapedRow) . "\n";
            }

            $bom = chr(239) . chr(187) . chr(191);
            
            return response($bom . $csv)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="accomplishment_report_' . date('Y-m-d') . '.csv"')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                ->header('Pragma', 'no-cache')
                ->header('Expires', '0');
                
        } catch (\Exception $e) {
            Log::error('Accomplishment CSV Export Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export CSV: ' . $e->getMessage()
            ], 500);
        }
    }   

public function accomplishmentImport(Request $request)
{
    try {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $path = $file->getPathname();
        
        // Parse CSV
        $handle = fopen($path, 'r');
        if (!$handle) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to open file'
            ], 500);
        }

        // Read headers - handle BOM
        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Invalid CSV file format'
            ], 422);
        }

        // Remove BOM from first header if present
        $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', $headers[0]);

        // Map headers to column indices
        $headerMap = [];
        foreach ($headers as $index => $header) {
            $headerMap[trim($header)] = $index;
        }

        // Check required columns
        $requiredColumns = ['Student ID', 'Serial No.'];
        $missingColumns = [];
        foreach ($requiredColumns as $col) {
            if (!isset($headerMap[$col])) {
                $missingColumns[] = $col;
            }
        }

        if (!empty($missingColumns)) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Missing required columns: ' . implode(', ', $missingColumns) . '. Please use the template.'
            ], 422);
        }

        $updatedStudents = [];
        $errors = [];
        $rowNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            
            // Skip empty rows
            if (empty(array_filter($row))) {
                continue;
            }

            // Get Student ID
            $studentId = trim($row[$headerMap['Student ID']] ?? '');
            if (empty($studentId)) {
                $errors[] = "Row {$rowNumber}: Student ID is empty";
                continue;
            }

            // Get Serial Number
            $serialNo = trim($row[$headerMap['Serial No.']] ?? '');
            
            // Skip if Serial No is empty
            if (empty($serialNo)) {
                $errors[] = "Row {$rowNumber}: Serial No. is empty for student '{$studentId}'";
                continue;
            }

            // Find student
            $student = Student::where('student_id', $studentId)->first();
            if (!$student) {
                $errors[] = "Row {$rowNumber}: Student ID '{$studentId}' not found";
                continue;
            }

            // Only update the serial number field
            // Note: You need to add 'serial_no' column to your students table first
            // For now, we'll store it in the student record
            // You can either add a column or use an existing one
            $student->update([
                'serial_no' => $serialNo, // Make sure this column exists
            ]);

            $updatedStudents[] = [
                'student_id' => $student->student_id,
                'name' => $student->user->first_name . ' ' . $student->user->last_name,
                'serial_no' => $serialNo,
            ];
        }

        fclose($handle);

        // Prepare response message
        $message = "Import completed.";
        if (count($updatedStudents) > 0) {
            $message .= " Updated " . count($updatedStudents) . " students with Serial Numbers.";
        }
        if (count($errors) > 0) {
            $message .= " Encountered " . count($errors) . " errors.";
        }

        if (count($updatedStudents) === 0 && count($errors) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . implode('; ', array_slice($errors, 0, 5)) . (count($errors) > 5 ? '...' : ''),
                'data' => [
                    'updated' => 0,
                    'errors' => $errors,
                    'students' => [],
                    'error_count' => count($errors),
                ]
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'updated' => count($updatedStudents),
                'errors' => $errors,
                'students' => $updatedStudents,
                'error_count' => count($errors),
            ]
        ]);

    } catch (\Exception $e) {
        Log::error('Accomplishment Import Error: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json([
            'success' => false,
            'message' => 'Failed to import CSV: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Download CSV Template - Simplified for Serial No only
 */
public function accomplishmentTemplate()
{
    try {
        // Create headers with proper column names
        $headers = [
            'Student ID',
            'Serial No.',
            'Surname',
            'First Name',
            'Middle Name',
            'Course/Program',
            'Gender',
            'Birthdate',
            'Address',
            'Telephone/Mobile No.',
            'Email Address',
            'Component',
        ];

        // Add sample data with Serial No
        $sampleRow = [
            'STU-0001',
            '2025-001',
            'SANTOS',
            'MARIA',
            'CRUZ',
            'BSIT',
            'Female',
            '2000-01-01',
            '123 MAIN ST.',
            '09171234567',
            'student@email.com',
            'CWTS',
        ];

        // Build CSV with UTF-8 BOM
        $bom = chr(239) . chr(187) . chr(191);
        $csv = $bom . implode(',', $headers) . "\n";
        $csv .= implode(',', $sampleRow) . "\n";

        // Add empty rows for users to fill
        $emptyRow = array_fill(0, count($headers), '');
        $emptyRow[0] = 'STU-XXXX';
        $emptyRow[1] = '2025-XXX';
        $csv .= implode(',', $emptyRow) . "\n";

        for ($i = 0; $i < 3; $i++) {
            $emptyRow = array_fill(0, count($headers), '');
            $emptyRow[0] = 'STU-XXXX';
            $csv .= implode(',', $emptyRow) . "\n";
        }

        // Add instructions
        $csv .= "\n# INSTRUCTIONS:\n";
        $csv .= "# - Student ID: Required - Must match existing student ID\n";
        $csv .= "# - Serial No.: Required - Enter the serial number for each student\n";
        $csv .= "# - Other columns are for reference only and will not be updated\n";
        $csv .= "# - Save as CSV file before uploading\n";

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="accomplishment_template.csv"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
                
    } catch (\Exception $e) {
        Log::error('Template Export Error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to generate template: ' . $e->getMessage()
        ], 500);
    }
}

public function accomplishmentReport(Request $request)
{
    $request->validate([
        'component' => 'nullable|in:cwts,rotc,lts',
        'start_date' => 'nullable|date',
        'end_date' => 'nullable|date|after_or_equal:start_date',
        'search' => 'nullable|string|max:255',
        'status' => 'nullable|in:completed,in_progress,deficient,pending',
    ]);

    $query = Student::with(['user']);

    if ($request->filled('component')) {
        $query->where('nstp_component_selected', $request->component);
    }

    $status = $request->input('status', 'completed');
    if ($status !== 'all') {
        $query->where('completion_status', $status);
    }

    if ($request->filled('start_date')) {
        $query->whereDate('completed_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('completed_at', '<=', $request->end_date);
    }

    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('student_id', 'like', "%{$search}%")
                ->orWhereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
        });
    }

    $students = $query->orderBy('completed_at', 'desc')->get();

    $reportData = $students->map(function ($student) {
        $componentLabels = [
            'cwts' => 'CWTS',
            'rotc' => 'ROTC',
            'lts' => 'LTS',
        ];
        $component = $student->nstp_component_selected ?? 'N/A';
        $componentLabel = $componentLabels[$component] ?? $component;

        return [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'no' => 0,
            // ===== FIX: Include serial_no =====
            'serial_no' => $student->serial_no ?? '',
            'surname' => $this->toUpperCase($student->user->last_name ?? ''),
            'first_name' => $this->toUpperCase($student->user->first_name ?? ''),
            'middle_name' => $this->toUpperCase($student->user->middle_name ?? ''),
            'course_program' => $this->toUpperCase($student->course ?? 'BEEd'),
            'gender' => $this->formatGender($student->gender),
            'birthdate' => $student->birth_date ? date('Y-m-d', strtotime($student->birth_date)) : 'N/A',
            'address' => $this->toUpperCase($student->address ?? 'N/A'),
            'telephone_mobile' => $student->user->contact_number ?? 'N/A',
            'email_address' => strtolower($student->user->email ?? 'N/A'),
            'component' => $componentLabel,
            'component_code' => $component,
            'completed_hours' => $student->completed_training_hours,
            'total_hours' => $student->total_training_hours ?? 90,
            'status' => $student->completion_status,
            'is_eligible' => $student->is_eligible_for_completion,
            'completed_at' => $student->completed_at,
            'created_at' => $student->created_at,
        ];
    });

    $sortedReportData = $reportData->sortBy(function ($item) {
        return $this->getGenderSortOrder($item['gender']);
    })->values();

    $sortedReportData = $sortedReportData->map(function ($item, $index) {
        $item['no'] = $index + 1;
        return $item;
    });

    $summary = [
        'total' => $sortedReportData->count(),
        'component_breakdown' => [
            'cwts' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'cwts')->count(),
            'rotc' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'rotc')->count(),
            'lts' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'lts')->count(),
        ],
        'gender_breakdown' => [
            'male' => $sortedReportData->filter(fn($s) => strtolower($s['gender'] ?? '') === 'male')->count(),
            'female' => $sortedReportData->filter(fn($s) => strtolower($s['gender'] ?? '') === 'female')->count(),
        ],
    ];

    $summary['graduation_year_breakdown'] = $sortedReportData
        ->filter(fn($s) => $s['completed_at'] !== null)
        ->groupBy(fn($s) => date('Y', strtotime($s['completed_at'])))
        ->map(fn($group) => $group->count())
        ->toArray();

    return response()->json([
        'success' => true,
        'data' => [
            'students' => $sortedReportData,
            'summary' => $summary,
            'filters' => [
                'component' => $request->input('component'),
                'status' => $status,
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'search' => $request->input('search'),
            ],
            'generated_at' => now()->toISOString(),
        ]
    ]);
}

private function getAccomplishmentData(Request $request)
{
    $query = Student::with(['user']);

    if ($request->filled('component')) {
        $query->where('nstp_component_selected', $request->component);
    }

    $status = $request->input('status', 'completed');
    if ($status !== 'all') {
        $query->where('completion_status', $status);
    }

    if ($request->filled('start_date')) {
        $query->whereDate('completed_at', '>=', $request->start_date);
    }
    if ($request->filled('end_date')) {
        $query->whereDate('completed_at', '<=', $request->end_date);
    }

    $students = $query->orderBy('completed_at', 'desc')->get();

    $reportData = $students->map(function ($student) {
        $componentLabels = [
            'cwts' => 'CWTS',
            'rotc' => 'ROTC',
            'lts' => 'LTS',
        ];
        $component = $student->nstp_component_selected ?? 'N/A';
        $componentLabel = $componentLabels[$component] ?? $component;

        return [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'no' => 0,
            // ===== FIX: Include serial_no =====
            'serial_no' => $student->serial_no ?? '',
            'surname' => $this->toUpperCase($student->user->last_name ?? ''),
            'first_name' => $this->toUpperCase($student->user->first_name ?? ''),
            'middle_name' => $this->toUpperCase($student->user->middle_name ?? ''),
            'course_program' => $this->toUpperCase($student->course ?? 'BEEd'),
            'gender' => $this->formatGender($student->gender),
            'birthdate' => $student->birth_date ? date('Y-m-d', strtotime($student->birth_date)) : 'N/A',
            'address' => $this->toUpperCase($student->address ?? 'N/A'),
            'telephone_mobile' => $student->user->contact_number ?? 'N/A',
            'email_address' => strtolower($student->user->email ?? 'N/A'),
            'component' => $componentLabel,
            'component_code' => $component,
            'completed_hours' => $student->completed_training_hours,
            'total_hours' => $student->total_training_hours ?? 90,
            'status' => $student->completion_status,
            'is_eligible' => $student->is_eligible_for_completion,
            'completed_at' => $student->completed_at,
            'created_at' => $student->created_at,
        ];
    });

    $sortedReportData = $reportData->sortBy(function ($item) {
        return $this->getGenderSortOrder($item['gender']);
    })->values();

    $sortedReportData = $sortedReportData->map(function ($item, $index) {
        $item['no'] = $index + 1;
        return $item;
    });

    $summary = [
        'total' => $sortedReportData->count(),
        'component_breakdown' => [
            'cwts' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'cwts')->count(),
            'rotc' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'rotc')->count(),
            'lts' => $sortedReportData->filter(fn($s) => $s['component_code'] === 'lts')->count(),
        ],
        'gender_breakdown' => [
            'male' => $sortedReportData->filter(fn($s) => strtolower($s['gender'] ?? '') === 'male')->count(),
            'female' => $sortedReportData->filter(fn($s) => strtolower($s['gender'] ?? '') === 'female')->count(),
        ],
    ];

    return [
        'students' => $sortedReportData,
        'summary' => $summary,
        'filters' => $request->only(['component', 'status', 'start_date', 'end_date']),
    ];
}

}