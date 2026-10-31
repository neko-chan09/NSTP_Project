<?php
// app/Services/ClassImportService.php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClassImportService
{
    /**
     * Import instructors/classes CSV (NSTP-Sections-and-Instructors.csv).
     */
    public function importClasses(
        UploadedFile $file,
        ?string $defaultSchoolYear,
        bool $dryRun = false
    ): array {
        $parsed = $this->parseCsv($file);

        if (!empty($parsed['errors'])) {
            return $this->emptyResultWithErrors($parsed['errors']);
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['class_code', 'component', 'section'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            return $this->emptyResultWithErrors([
                'Missing required columns: ' . implode(', ', $missing),
            ]);
        }

        $schoolYear   = $defaultSchoolYear ?: $this->guessCurrentSchoolYear();
        $academicYear = AcademicYear::findOrCreateByLabel($schoolYear);

        $created  = 0;
        $updated  = 0;
        $skipped  = 0;
        $errors   = [];
        $warnings = [];
        $report   = [];

        foreach ($rows as $i => $row) {
            $lineNo     = $i + 2;
            $classCode  = trim((string) ($row['class_code'] ?? ''));
            $component  = strtolower(trim((string) ($row['component'] ?? '')));
            $section    = trim((string) ($row['section'] ?? ''));
            $lastName   = trim((string) ($row['last_name'] ?? ''));
            $firstName  = trim((string) ($row['first_name'] ?? ''));

            if ($classCode === '') {
                $errors[] = "Row {$lineNo}: missing class_code";
                $skipped++;
                continue;
            }
            if (!in_array($component, ['cwts', 'rotc', 'lts'], true)) {
                $errors[] = "Row {$lineNo}: invalid component '{$component}'";
                $skipped++;
                continue;
            }
            if ($section === '') {
                $errors[] = "Row {$lineNo}: missing section";
                $skipped++;
                continue;
            }

            // Match instructor
            $teacherId = null;
            if ($lastName !== '' || $firstName !== '') {
                $matches = User::query()
                    ->where('role', 'faculty')
                    ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
                    ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
                    ->get();

                if ($matches->count() === 1) {
                    $teacherId = $matches->first()->id;
                } elseif ($matches->count() === 0) {
                    $warnings[] = "Row {$lineNo}: no faculty match for '{$lastName}, {$firstName}' — left unassigned";
                } else {
                    $errors[] = "Row {$lineNo}: multiple faculty match '{$lastName}, {$firstName}' — skipped";
                    $skipped++;
                    continue;
                }
            } else {
                $warnings[] = "Row {$lineNo}: no instructor provided — left unassigned";
            }

            $className = "Section {$section} - {$schoolYear}";
            $existing  = ClassGroup::where('class_code', $classCode)->first();

            $payload = [
                'name'             => $className,
                'description'      => $existing?->description ?? "Imported from CSV",
                'component_type'   => $component,
                'class_code'       => $classCode,
                'school_year'      => $schoolYear,
                'academic_year_id' => $academicYear->id,
                'status'           => $existing?->status ?? 'active',
            ];

            if ($teacherId !== null) {
                $payload['teacher_id'] = $teacherId;
            }

            $report[] = [
                'line'        => $lineNo,
                'class_code'  => $classCode,
                'component'   => $component,
                'section'     => $section,
                'teacher'     => $teacherId ? "{$lastName}, {$firstName}" : null,
                'action'      => $existing ? 'update' : 'create',
                'school_year' => $schoolYear,
            ];

            if ($dryRun) {
                $existing ? $updated++ : $created++;
                continue;
            }

            DB::transaction(function () use ($existing, $payload, &$created, &$updated) {
                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                } else {
                    ClassGroup::create($payload);
                    $created++;
                }
            });
        }

        return [
            'created'          => $created,
            'updated'          => $updated,
            'enrolled'         => 0,
            'skipped'          => $skipped,
            'errors'           => $errors,
            'warnings'         => $warnings,
            'rows'             => $report,
            'school_year'      => $schoolYear,
            'academic_year_id' => $academicYear->id,
            'dry_run'          => $dryRun,
        ];
    }

    /**
     * Import student enrollments (NSTP-Student-classes.csv).
     */
    public function importStudents(
        UploadedFile $file,
        ?string $defaultSchoolYear,
        bool $dryRun = false
    ): array {
        $parsed = $this->parseCsv($file);

        if (!empty($parsed['errors'])) {
            return $this->emptyResultWithErrors($parsed['errors']);
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['class_code', 'last_name', 'first_name'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            return $this->emptyResultWithErrors([
                'Missing required columns: ' . implode(', ', $missing),
            ]);
        }

        $schoolYear   = $defaultSchoolYear ?: $this->guessCurrentSchoolYear();
        $academicYear = AcademicYear::findOrCreateByLabel($schoolYear);

        $created  = 0;
        $updated  = 0;
        $enrolled = 0;
        $skipped  = 0;
        $errors   = [];
        $warnings = [];
        $report   = [];

        foreach ($rows as $i => $row) {
            $lineNo    = $i + 2;
            $classCode = trim((string) ($row['class_code'] ?? ''));
            $lastName  = trim((string) ($row['last_name'] ?? ''));
            $firstName = trim((string) ($row['first_name'] ?? ''));
            $component = strtolower(trim((string) ($row['component'] ?? '')));
            $section   = trim((string) ($row['section'] ?? ''));

            if ($classCode === '' || $lastName === '' || $firstName === '') {
                $errors[] = "Row {$lineNo}: missing required field(s)";
                $skipped++;
                continue;
            }

            $class = ClassGroup::where('class_code', $classCode)->first();
            if (!$class) {
                $errors[] = "Row {$lineNo}: class '{$classCode}' not found";
                $skipped++;
                continue;
            }

            $studentQuery = Student::query()
                ->whereHas('user', function ($q) use ($lastName, $firstName) {
                    $q->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
                      ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)]);
                });

            if ($component !== '' && in_array($component, ['cwts', 'rotc', 'lts'], true)) {
                $studentQuery->where('nstp_component_selected', $component);
            }
            if ($section !== '') {
                $studentQuery->where('section', $section);
            }

            $students = $studentQuery->get();

            if ($students->count() === 0) {
                $errors[] = "Row {$lineNo}: student '{$lastName}, {$firstName}' not found";
                $skipped++;
                continue;
            }
            if ($students->count() > 1) {
                $errors[] = "Row {$lineNo}: multiple students match '{$lastName}, {$firstName}' — skipped";
                $skipped++;
                continue;
            }

            $student = $students->first();

            $alreadyEnrolled = DB::table('class_students')
                ->where('class_id', $class->id)
                ->where('student_id', $student->id)
                ->exists();

            if ($alreadyEnrolled) {
                $warnings[] = "Row {$lineNo}: student already enrolled in {$classCode}";
                $report[] = [
                    'line'       => $lineNo,
                    'class_code' => $classCode,
                    'student'    => "{$lastName}, {$firstName}",
                    'student_id' => $student->student_id,
                    'action'     => 'skip (already enrolled)',
                ];
                $skipped++;
                continue;
            }

            $report[] = [
                'line'       => $lineNo,
                'class_code' => $classCode,
                'student'    => "{$lastName}, {$firstName}",
                'student_id' => $student->student_id,
                'action'     => 'enroll',
            ];

            if ($dryRun) {
                $enrolled++;
                continue;
            }

            DB::table('class_students')->insert([
                'class_id'         => $class->id,
                'student_id'       => $student->id,
                'joined_at'        => now(),
                'status'           => 'active',
                'school_year'      => $schoolYear,
                'academic_year_id' => $academicYear->id,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            $enrolled++;
        }

        return [
            'created'          => $created,
            'updated'          => $updated,
            'enrolled'         => $enrolled,
            'skipped'          => $skipped,
            'errors'           => $errors,
            'warnings'         => $warnings,
            'rows'             => $report,
            'school_year'      => $schoolYear,
            'academic_year_id' => $academicYear->id,
            'dry_run'          => $dryRun,
        ];
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return ['errors' => ['Could not open uploaded file'], 'header' => [], 'rows' => []];
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return ['errors' => ['Empty file'], 'header' => [], 'rows' => []];
        }

        $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', $header[0]);
        $header = array_map(fn ($h) => strtolower(trim((string) $h)), $header);

        $rows = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row, fn ($v) => $v !== null && $v !== ''))) {
                continue;
            }
            $assoc = [];
            foreach ($header as $idx => $key) {
                $assoc[$key] = $row[$idx] ?? null;
            }
            $rows[] = $assoc;
        }

        fclose($handle);

        return ['errors' => [], 'header' => $header, 'rows' => $rows];
    }

    private function guessCurrentSchoolYear(): string
    {
        $y = (int) date('Y');
        return (int) date('n') >= 8
            ? "{$y}-" . ($y + 1)
            : ($y - 1) . "-{$y}";
    }

    private function emptyResultWithErrors(array $errors): array
    {
        return [
            'created'          => 0,
            'updated'          => 0,
            'enrolled'         => 0,
            'skipped'          => 0,
            'errors'           => $errors,
            'warnings'         => [],
            'rows'             => [],
            'school_year'      => null,
            'academic_year_id' => null,
            'dry_run'          => false,
        ];
    }
}