<?php
// app/Services/StudentImportService.php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class StudentImportService
{
    private array $warnings = [];

    public function import(
        UploadedFile $file,
        string $mode = 'upsert',
        bool $dryRun = false,
        ?string $defaultSchoolYear = null,
    ): array {
        $this->warnings = [];

        $parsed = $this->parseCsv($file);
        if (!empty($parsed['errors'])) {
            return $this->emptyResult($parsed['errors'], $dryRun);
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['student_id', 'first_name', 'last_name'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            return $this->emptyResult([
                'Missing required columns: ' . implode(', ', $missing),
                'Detected columns: ' . implode(', ', $header),
            ], $dryRun);
        }

        $schoolYear   = $defaultSchoolYear ?: $this->guessCurrentSchoolYear();
        $academicYear = AcademicYear::findOrCreateByLabel($schoolYear);

        $created   = 0;
        $updated   = 0;
        $skipped   = 0;
        $enrolled  = 0;
        $errors    = [];
        $rowReport = [];
        $batch     = 'IMP-' . date('Ymd-His');

        foreach ($rows as $i => $row) {
            $lineNo = $i + 2;
            $norm   = $this->normalizeRow($row);

            if (empty($norm['student_id'])) {
                $errors[] = "Row {$lineNo}: missing student_id";
                $skipped++;
                continue;
            }
            if (empty($norm['first_name']) || empty($norm['last_name'])) {
                $errors[] = "Row {$lineNo}: missing first_name or last_name";
                $skipped++;
                continue;
            }

            $existing = Student::with('user')
                ->where('student_id', $norm['student_id'])
                ->first();

            if ($mode === 'create' && $existing) {
                $this->warnings[] = "Row {$lineNo}: student {$norm['student_id']} already exists — skipped";
                $rowReport[] = [
                    'line'       => $lineNo,
                    'student_id' => $norm['student_id'],
                    'name'       => "{$norm['last_name']}, {$norm['first_name']}",
                    'action'     => 'skip (exists)',
                ];
                $skipped++;
                continue;
            }
            if ($mode === 'update' && !$existing) {
                $this->warnings[] = "Row {$lineNo}: student {$norm['student_id']} not found — skipped";
                $rowReport[] = [
                    'line'       => $lineNo,
                    'student_id' => $norm['student_id'],
                    'name'       => "{$norm['last_name']}, {$norm['first_name']}",
                    'action'     => 'skip (not found)',
                ];
                $skipped++;
                continue;
            }

            $isNew = !$existing;

            $class = null;
            if (!empty($norm['class_code'])) {
                $class = ClassGroup::where('class_code', $norm['class_code'])->first();
                if (!$class) {
                    $this->warnings[] = "Row {$lineNo}: class_code '{$norm['class_code']}' not found — skipping enrollment";
                }
            }

            $rowSchoolYear = !empty($norm['school_year']) ? $norm['school_year'] : $schoolYear;

            $rowReport[] = [
                'line'        => $lineNo,
                'student_id'  => $norm['student_id'],
                'name'        => "{$norm['last_name']}, {$norm['first_name']}",
                'action'      => $isNew ? 'create' : 'update',
                'class_code'  => $class?->class_code,
                'school_year' => $rowSchoolYear,
            ];

            if ($dryRun) {
                $isNew ? $created++ : $updated++;
                if ($class) $enrolled++;
                continue;
            }

            try {
                DB::transaction(function () use (
                    $existing,
                    $norm,
                    $isNew,
                    $class,
                    $rowSchoolYear,
                    $academicYear,
                    $batch,
                    &$created,
                    &$updated,
                    &$enrolled
                ) {
                    if ($isNew) {
                        $user = $this->createUser($norm);
                        $student = Student::create([
                            'user_id'                    => $user->id,
                            'student_id'                 => $norm['student_id'],
                            'serial_no'                  => $norm['serial_no'] ?? null,
                            'birth_date'                 => !empty($norm['birth_date']) ? $norm['birth_date'] : null,
                            'gender'                     => !empty($norm['gender']) ? $norm['gender'] : null,
                            'address'                    => !empty($norm['address']) ? $norm['address'] : null,
                            'emergency_contact_name'     => !empty($norm['emergency_contact_name']) ? $norm['emergency_contact_name'] : null,
                            'emergency_contact_number'   => !empty($norm['emergency_contact_number']) ? $norm['emergency_contact_number'] : null,
                            'course'                     => !empty($norm['course']) ? $norm['course'] : null,
                            'year_level'                 => !empty($norm['year_level']) ? (int) $norm['year_level'] : null,
                            'section'                    => !empty($norm['section']) ? $norm['section'] : null,
                            'nstp_component_selected'    => !empty($norm['component']) ? $norm['component'] : null,
                            'completion_status'          => 'pending',
                            'is_eligible_for_completion' => false,
                            'total_training_hours'       => 0,
                            'completed_training_hours'   => 0,
                            'imported_at'                => now(),
                            'import_batch'               => $batch,
                        ]);
                        $created++;
                    } else {
                        $student = $existing;
                        $this->updateUser($student->user, $norm);
                        $student->update([
                            'serial_no'                => !empty($norm['serial_no']) ? $norm['serial_no'] : $student->serial_no,
                            'birth_date'               => !empty($norm['birth_date']) ? $norm['birth_date'] : $student->birth_date,
                            'gender'                   => !empty($norm['gender']) ? $norm['gender'] : $student->gender,
                            'address'                  => !empty($norm['address']) ? $norm['address'] : $student->address,
                            'emergency_contact_name'   => !empty($norm['emergency_contact_name']) ? $norm['emergency_contact_name'] : $student->emergency_contact_name,
                            'emergency_contact_number' => !empty($norm['emergency_contact_number']) ? $norm['emergency_contact_number'] : $student->emergency_contact_number,
                            'course'                   => !empty($norm['course']) ? $norm['course'] : $student->course,
                            'year_level'               => !empty($norm['year_level']) ? (int) $norm['year_level'] : $student->year_level,
                            'section'                  => !empty($norm['section']) ? $norm['section'] : $student->section,
                            'nstp_component_selected'  => !empty($norm['component']) ? $norm['component'] : $student->nstp_component_selected,
                            'imported_at'              => now(),
                            'import_batch'             => $batch,
                        ]);
                        $updated++;
                    }

                    if ($class) {
                        $already = DB::table('class_students')
                            ->where('class_id', $class->id)
                            ->where('student_id', $student->id)
                            ->exists();

                        if (!$already) {
                            DB::table('class_students')->insert([
                                'class_id'         => $class->id,
                                'student_id'       => $student->id,
                                'joined_at'        => now(),
                                'status'           => 'active',
                                'school_year'      => $rowSchoolYear,
                                'academic_year_id' => $academicYear->id,
                                'created_at'       => now(),
                                'updated_at'       => now(),
                            ]);
                            $enrolled++;
                        }
                    }
                });
            } catch (\Throwable $e) {
                Log::error("Student import row {$lineNo} failed", [
                    'student_id' => $norm['student_id'] ?? null,
                    'class_code' => $norm['class_code'] ?? null,
                    'message'    => $e->getMessage(),
                    'file'       => $e->getFile(),
                    'line'       => $e->getLine(),
                ]);
                $errors[] = "Row {$lineNo}: " . $e->getMessage();
                $skipped++;
            }
        }

        return [
            'created'          => $created,
            'updated'          => $updated,
            'enrolled'         => $enrolled,
            'skipped'          => $skipped,
            'errors'           => $errors,
            'warnings'         => $this->warnings,
            'rows'             => $rowReport,
            'school_year'      => $schoolYear,
            'academic_year_id' => $academicYear->id,
            'batch'            => $batch,
            'mode'             => $mode,
            'dry_run'          => $dryRun,
        ];
    }

    private function createUser(array $norm): User
    {
        $email    = !empty($norm['email']) ? $norm['email'] : $this->generateEmail($norm['student_id']);
        $password = !empty($norm['password']) ? $norm['password'] : 'password123';

        return User::create([
            'first_name'           => $norm['first_name'],
            'last_name'            => $norm['last_name'],
            'email'                => $email,
            'password'             => Hash::make($password),
            'role'                 => 'student',
            'student_id'           => $norm['student_id'],
            'course'               => !empty($norm['course']) ? $norm['course'] : null,
            'year_level'           => !empty($norm['year_level']) ? (int) $norm['year_level'] : null,
            'section'              => !empty($norm['section']) ? $norm['section'] : null,
            'contact_number'       => !empty($norm['contact_number']) ? $norm['contact_number'] : null,
            'is_active'            => true,
            'must_change_password' => true,
        ]);
    }

    private function updateUser(?User $user, array $norm): void
    {
        if (!$user) return;

        $data = [];
        if (!empty($norm['first_name'])) $data['first_name'] = $norm['first_name'];
        if (!empty($norm['last_name']))  $data['last_name']  = $norm['last_name'];
        if (!empty($norm['email']) && $norm['email'] !== $user->email) {
            $data['email'] = $norm['email'];
        }
        if (!empty($norm['contact_number'])) $data['contact_number'] = $norm['contact_number'];
        if (!empty($norm['course']))     $data['course']     = $norm['course'];
        if (!empty($norm['year_level'])) $data['year_level'] = (int) $norm['year_level'];
        if (!empty($norm['section']))    $data['section']    = $norm['section'];
        if (!empty($norm['password']))   $data['password']   = Hash::make($norm['password']);

        if (!empty($data)) $user->update($data);
    }

    private function generateEmail(string $studentId): string
    {
        $base  = Str::slug($studentId, '.');
        $email = "{$base}@student.nstp.edu";
        $i = 1;
        while (User::where('email', $email)->exists()) {
            $email = "{$base}{$i}@student.nstp.edu";
            $i++;
        }
        return $email;
    }

    private function normalizeRow(array $row): array
    {
        $aliases = [
            'id'                       => 'student_id',
            'occ_id'                   => 'student_id',
            'nstp_component'           => 'component',
            'nstp_component_selected'  => 'component',
            'birthdate'                => 'birth_date',
            'dob'                      => 'birth_date',
            'mobile'                   => 'contact_number',
            'contact'                  => 'contact_number',
            'phone'                    => 'contact_number',
            'emergency_name'           => 'emergency_contact_name',
            'emergency_number'         => 'emergency_contact_number',
            'serial_number'            => 'serial_no',
            'serial'                   => 'serial_no',
            'class'                    => 'class_code',
            'section_code'             => 'class_code',
            'sy'                       => 'school_year',
        ];

        $allowed = [
            'student_id',
            'first_name',
            'last_name',
            'email',
            'password',
            'course',
            'year_level',
            'section',
            'component',
            'gender',
            'birth_date',
            'address',
            'contact_number',
            'emergency_contact_name',
            'emergency_contact_number',
            'serial_no',
            'class_code',
            'school_year',
        ];

        $out = [];
        foreach ($row as $k => $v) {
            $key = strtolower(trim((string) $k));
            $key = $aliases[$key] ?? $key;

            if (!in_array($key, $allowed, true)) {
                continue;
            }

            $out[$key] = is_string($v) ? trim($v) : $v;
        }

        if (!empty($out['component'])) {
            $out['component'] = strtolower($out['component']);
            if (!in_array($out['component'], ['cwts', 'rotc', 'lts'], true)) {
                $out['component'] = null;
            }
        }

        if (!empty($out['gender'])) {
            $out['gender'] = strtolower($out['gender']);
            if (!in_array($out['gender'], ['male', 'female', 'other'], true)) {
                $out['gender'] = null;
            }
        }

        return $out;
    }

    private function parseCsv(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if (!$path || !file_exists($path)) {
            return [
                'errors' => ['Uploaded file could not be read (path invalid)'],
                'header' => [],
                'rows'   => [],
            ];
        }

        $contents = file_get_contents($path);
        if ($contents === false || trim($contents) === '') {
            return [
                'errors' => ['Uploaded file is empty'],
                'header' => [],
                'rows'   => [],
            ];
        }

        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents);
        $contents = str_replace(["\r\n", "\r"], "\n", $contents);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $contents);
        rewind($stream);

        $header = fgetcsv($stream);
        if (!$header) {
            fclose($stream);
            return [
                'errors' => ['CSV file has no header row'],
                'header' => [],
                'rows'   => [],
            ];
        }

        $header = array_map(function ($h) {
            $h = (string) $h;
            $h = preg_replace('/^\xEF\xBB\xBF/', '', $h);
            $h = trim($h);
            $h = trim($h, "\"'");
            return strtolower($h);
        }, $header);

        $rows = [];
        while (($row = fgetcsv($stream)) !== false) {
            if (empty(array_filter($row, fn($v) => $v !== null && $v !== ''))) {
                continue;
            }
            $assoc = [];
            foreach ($header as $idx => $key) {
                if ($key === '') continue;
                $assoc[$key] = $row[$idx] ?? null;
            }
            $rows[] = $assoc;
        }

        fclose($stream);

        if (empty($rows)) {
            return [
                'errors' => ['No data rows found in the CSV.'],
                'header' => $header,
                'rows'   => [],
            ];
        }

        return ['errors' => [], 'header' => $header, 'rows' => $rows];
    }

    private function guessCurrentSchoolYear(): string
    {
        $y = (int) date('Y');
        return (int) date('n') >= 8
            ? "{$y}-" . ($y + 1)
            : ($y - 1) . "-{$y}";
    }

    private function emptyResult(array $errors, bool $dryRun): array
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
            'batch'            => null,
            'mode'             => null,
            'dry_run'          => $dryRun,
        ];
    }

    /**
     * Parse the CSV, create an ImportBatch record. Does NOT process rows.
     */
    public function beginBatch(
        \Illuminate\Http\UploadedFile $file,
        string $mode = 'upsert',
        bool $dryRun = false,
        ?string $defaultSchoolYear = null,
        ?int $userId = null
    ): \App\Models\ImportBatch {
        $parsed = $this->parseCsv($file);
        if (!empty($parsed['errors'])) {
            throw new \RuntimeException(implode(' | ', $parsed['errors']));
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['student_id', 'first_name', 'last_name'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            throw new \RuntimeException(
                'Missing required columns: ' . implode(', ', $missing)
            );
        }

        // Normalize rows once
        $normalized = array_map(fn($r) => $this->normalizeRow($r), $rows);

        return \App\Models\ImportBatch::create([
            'batch_code'        => 'IMP-' . date('Ymd-His') . '-' . \Illuminate\Support\Str::random(4),
            'type'              => 'student',
            'status'            => 'pending',
            'total_rows'        => count($normalized),
            'processed_rows'    => 0,
            'created_count'     => 0,
            'updated_count'     => 0,
            'enrolled_count'    => 0,
            'skipped_count'     => 0,
            'mode'              => $mode,
            'school_year'       => $defaultSchoolYear,
            'rows_json'         => json_encode($normalized),
            'errors_json'       => json_encode([]),
            'warnings_json'     => json_encode([]),
            'user_id'           => $userId,
            'original_filename' => $file->getClientOriginalName(),
        ]);
    }

    /**
     * Process the next chunk of rows for a batch.
     * Returns a status array with current progress.
     */
    public function processChunk(\App\Models\ImportBatch $batch, int $chunkSize = 50): array
    {
        if ($batch->status === 'cancelled') {
            return $this->batchStatusPayload($batch);
        }

        if ($batch->status === 'pending') {
            $batch->update([
                'status'     => 'processing',
                'started_at' => now(),
            ]);
            $batch->refresh();
        }

        $rows      = json_decode($batch->rows_json ?? '[]', true) ?: [];
        $total     = count($rows);
        $processed = $batch->processed_rows;

        if ($processed >= $total) {
            if ($batch->status !== 'completed') {
                $batch->update([
                    'status'      => 'completed',
                    'finished_at' => now(),
                ]);
            }
            return $this->batchStatusPayload($batch->fresh());
        }

        $chunk = array_slice($rows, $processed, $chunkSize);

        $errors   = json_decode($batch->errors_json ?? '[]', true) ?: [];
        $warnings = json_decode($batch->warnings_json ?? '[]', true) ?: [];

        $schoolYear   = $batch->school_year ?: $this->guessCurrentSchoolYear();
        $academicYear = \App\Models\AcademicYear::findOrCreateByLabel($schoolYear);

        $created  = 0;
        $updated  = 0;
        $enrolled = 0;
        $skipped  = 0;

        foreach ($chunk as $i => $norm) {
            $lineNo = $processed + $i + 2;

            if (empty($norm['student_id']) || empty($norm['first_name']) || empty($norm['last_name'])) {
                $errors[] = "Row {$lineNo}: missing required fields";
                $skipped++;
                continue;
            }

            $existing = \App\Models\Student::with('user')
                ->where('student_id', $norm['student_id'])
                ->first();

            $mode = $batch->mode;
            if ($mode === 'create' && $existing) {
                $skipped++;
                continue;
            }
            if ($mode === 'update' && !$existing) {
                $skipped++;
                continue;
            }

            $isNew = !$existing;

            $class = null;
            if (!empty($norm['class_code'])) {
                $class = \App\Models\ClassGroup::where('class_code', $norm['class_code'])->first();
                if (!$class) {
                    $warnings[] = "Row {$lineNo}: class '{$norm['class_code']}' not found";
                }
            }

            $rowSchoolYear = !empty($norm['school_year']) ? $norm['school_year'] : $schoolYear;

            try {
                \Illuminate\Support\Facades\DB::transaction(function () use (
                    $existing,
                    $norm,
                    $isNew,
                    $class,
                    $rowSchoolYear,
                    $academicYear,
                    $batch,
                    &$created,
                    &$updated,
                    &$enrolled
                ) {
                    if ($isNew) {
                        $user = $this->createUser($norm);
                        $student = \App\Models\Student::create([
                            'user_id'                    => $user->id,
                            'student_id'                 => $norm['student_id'],
                            'serial_no'                  => $norm['serial_no'] ?? null,
                            'birth_date'                 => !empty($norm['birth_date']) ? $norm['birth_date'] : null,
                            'gender'                     => !empty($norm['gender']) ? $norm['gender'] : null,
                            'address'                    => !empty($norm['address']) ? $norm['address'] : null,
                            'emergency_contact_name'     => !empty($norm['emergency_contact_name']) ? $norm['emergency_contact_name'] : null,
                            'emergency_contact_number'   => !empty($norm['emergency_contact_number']) ? $norm['emergency_contact_number'] : null,
                            'course'                     => !empty($norm['course']) ? $norm['course'] : null,
                            'year_level'                 => !empty($norm['year_level']) ? (int) $norm['year_level'] : null,
                            'section'                    => !empty($norm['section']) ? $norm['section'] : null,
                            'nstp_component_selected'    => !empty($norm['component']) ? $norm['component'] : null,
                            'completion_status'          => 'pending',
                            'is_eligible_for_completion' => false,
                            'total_training_hours'       => 0,
                            'completed_training_hours'   => 0,
                            'imported_at'                => now(),
                            'import_batch'               => $batch->batch_code,
                        ]);
                        $created++;
                    } else {
                        $student = $existing;
                        $this->updateUser($student->user, $norm);
                        $student->update([
                            'serial_no'                => !empty($norm['serial_no']) ? $norm['serial_no'] : $student->serial_no,
                            'birth_date'               => !empty($norm['birth_date']) ? $norm['birth_date'] : $student->birth_date,
                            'gender'                   => !empty($norm['gender']) ? $norm['gender'] : $student->gender,
                            'address'                  => !empty($norm['address']) ? $norm['address'] : $student->address,
                            'emergency_contact_name'   => !empty($norm['emergency_contact_name']) ? $norm['emergency_contact_name'] : $student->emergency_contact_name,
                            'emergency_contact_number' => !empty($norm['emergency_contact_number']) ? $norm['emergency_contact_number'] : $student->emergency_contact_number,
                            'course'                   => !empty($norm['course']) ? $norm['course'] : $student->course,
                            'year_level'               => !empty($norm['year_level']) ? (int) $norm['year_level'] : $student->year_level,
                            'section'                  => !empty($norm['section']) ? $norm['section'] : $student->section,
                            'nstp_component_selected'  => !empty($norm['component']) ? $norm['component'] : $student->nstp_component_selected,
                            'imported_at'              => now(),
                            'import_batch'             => $batch->batch_code,
                        ]);
                        $updated++;
                    }

                    if ($class) {
                        $already = \Illuminate\Support\Facades\DB::table('class_students')
                            ->where('class_id', $class->id)
                            ->where('student_id', $student->id)
                            ->exists();
                        if (!$already) {
                            \Illuminate\Support\Facades\DB::table('class_students')->insert([
                                'class_id'         => $class->id,
                                'student_id'       => $student->id,
                                'joined_at'        => now(),
                                'status'           => 'active',
                                'school_year'      => $rowSchoolYear,
                                'academic_year_id' => $academicYear->id,
                                'created_at'       => now(),
                                'updated_at'       => now(),
                            ]);
                            $enrolled++;
                        }
                    }
                });
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Student import row {$lineNo} failed", [
                    'student_id' => $norm['student_id'] ?? null,
                    'class_code' => $norm['class_code'] ?? null,
                    'message'    => $e->getMessage(),
                ]);
                $errors[] = "Row {$lineNo}: " . $e->getMessage();
                $skipped++;
            }
        }

        $batch->refresh();
        $newProcessed = min($total, $batch->processed_rows + count($chunk));
        $isDone = $newProcessed >= $total;

        $batch->update([
            'processed_rows' => $newProcessed,
            'created_count'  => $batch->created_count + $created,
            'updated_count'  => $batch->updated_count + $updated,
            'enrolled_count' => $batch->enrolled_count + $enrolled,
            'skipped_count'  => $batch->skipped_count + $skipped,
            'errors_json'    => json_encode(array_slice($errors, -500)),
            'warnings_json'  => json_encode(array_slice($warnings, -500)),
            'status'         => $isDone ? 'completed' : 'processing',
            'finished_at'    => $isDone ? now() : null,
        ]);

        return $this->batchStatusPayload($batch->fresh());
    }

    /**
     * Format batch for JSON response.
     */
    public function batchStatusPayload(\App\Models\ImportBatch $batch): array
    {
        $errors   = json_decode($batch->errors_json ?? '[]', true) ?: [];
        $warnings = json_decode($batch->warnings_json ?? '[]', true) ?: [];

        return [
            'id'                => $batch->id,
            'batch_code'        => $batch->batch_code,
            'status'            => $batch->status,
            'is_running'        => $batch->is_running,
            'progress_percent'  => $batch->progress_percent,
            'total_rows'        => $batch->total_rows,
            'processed_rows'    => $batch->processed_rows,
            'created_count'     => $batch->created_count,
            'updated_count'     => $batch->updated_count,
            'enrolled_count'    => $batch->enrolled_count,
            'skipped_count'     => $batch->skipped_count,
            'errors'            => array_slice($errors, -50),
            'warnings'          => array_slice($warnings, -50),
            'errors_count'      => count($errors),
            'warnings_count'    => count($warnings),
            'started_at'        => $batch->started_at?->toIso8601String(),
            'finished_at'       => $batch->finished_at?->toIso8601String(),
            'created_at'        => $batch->created_at->toIso8601String(),
            'original_filename' => $batch->original_filename,
        ];
    }
}
