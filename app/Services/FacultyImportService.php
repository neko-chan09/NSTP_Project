<?php
// app/Services/FacultyImportService.php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\ClassGroup;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FacultyImportService
{
    private array $warnings = [];

    // ============================================================
    // EXISTING synchronous import — kept for tinker / CLI use
    // ============================================================
    public function import(
        UploadedFile $file,
        string $mode = 'upsert',
        bool $dryRun = false,
        ?string $defaultSchoolYear = null,
    ): array {
        $this->warnings = [];

        $parsed = $this->parseCsv($file);
        if (!empty($parsed['errors'])) {
            return $this->emptySyncResult($parsed['errors'], $dryRun);
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['class_code', 'component', 'section', 'last_name', 'first_name'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            return $this->emptySyncResult([
                'Missing required columns: ' . implode(', ', $missing),
            ], $dryRun);
        }

        $schoolYear   = $defaultSchoolYear ?: $this->guessCurrentSchoolYear();
        $academicYear = AcademicYear::findOrCreateByLabel($schoolYear);

        $createdFaculty = 0;
        $updatedFaculty = 0;
        $skippedFaculty = 0;
        $createdClasses = 0;
        $updatedClasses = 0;
        $skippedClasses = 0;
        $errors = [];
        $facultyRows = [];
        $classRows = [];

        $facultyMap = [];
        $normalized = [];

        foreach ($rows as $i => $row) {
            $lineNo    = $i + 2;
            $norm      = $this->normalizeRow($row);
            $classCode = !empty($norm['class_code']) ? trim($norm['class_code']) : '';
            $component = !empty($norm['component']) ? strtolower(trim($norm['component'])) : '';
            $section   = !empty($norm['section']) ? trim($norm['section']) : '';
            $lastName  = !empty($norm['last_name']) ? trim($norm['last_name']) : '';
            $firstName = !empty($norm['first_name']) ? trim($norm['first_name']) : '';
            $email     = !empty($norm['email']) ? strtolower(trim($norm['email'])) : '';
            $password  = !empty($norm['password']) ? $norm['password'] : 'password123';
            $year      = !empty($norm['school_year']) ? $norm['school_year'] : $schoolYear;

            if ($classCode === '') { $errors[] = "Row {$lineNo}: missing class_code"; continue; }
            if (!in_array($component, ['cwts', 'rotc', 'lts'], true)) { $errors[] = "Row {$lineNo}: invalid component"; continue; }
            if ($section === '') { $errors[] = "Row {$lineNo}: missing section"; continue; }
            if ($lastName === '' || $firstName === '') { $errors[] = "Row {$lineNo}: missing instructor name"; continue; }

            $facKey = mb_strtolower($lastName) . '|' . mb_strtolower($firstName);

            if (!isset($facultyMap[$facKey])) {
                $facultyMap[$facKey] = [
                    'first_name'     => $firstName,
                    'last_name'      => $lastName,
                    'email'          => $email,
                    'password'       => $password,
                    'nstp_component' => $component,
                ];
            } elseif (!$facultyMap[$facKey]['email'] && $email) {
                $facultyMap[$facKey]['email'] = $email;
            }

            $normalized[] = [
                'line_no'     => $lineNo,
                'class_code'  => $classCode,
                'component'   => $component,
                'section'     => $section,
                'last_name'   => $lastName,
                'first_name'  => $firstName,
                'faculty_key' => $facKey,
                'school_year' => $year,
            ];
        }

        $facultyReport = [];
        foreach ($facultyMap as $key => $info) {
            $existing = null;
            if ($info['email']) $existing = User::where('email', $info['email'])->first();
            if (!$existing) {
                $existing = User::where('role', 'faculty')
                    ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($info['first_name'])])
                    ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($info['last_name'])])
                    ->first();
            }

            if ($existing && $mode === 'create') {
                $facultyReport[$key] = ['id' => $existing->id, 'action' => 'skip (exists)'];
                $skippedFaculty++;
                continue;
            }
            if (!$existing && $mode === 'update') {
                $facultyReport[$key] = ['id' => null, 'action' => 'skip (not found)'];
                $skippedFaculty++;
                continue;
            }

            $email = $info['email'] ?: $this->generateEmail($info['first_name'], $info['last_name']);

            if ($dryRun) {
                $facultyReport[$key] = ['id' => $existing?->id, 'action' => $existing ? 'update' : 'create'];
                $existing ? $updatedFaculty++ : $createdFaculty++;
                continue;
            }

            if ($existing) {
                $existing->update([
                    'first_name'     => $info['first_name'],
                    'last_name'      => $info['last_name'],
                    'nstp_component' => $info['nstp_component'],
                ]);
                $facultyReport[$key] = ['id' => $existing->id, 'action' => 'update'];
                $updatedFaculty++;
            } else {
                $u = User::create([
                    'first_name'     => $info['first_name'],
                    'last_name'      => $info['last_name'],
                    'email'          => $email,
                    'password'       => Hash::make($info['password']),
                    'role'           => 'faculty',
                    'nstp_component' => $info['nstp_component'],
                    'is_active'      => true,
                    'must_change_password' => true,
                ]);
                $facultyReport[$key] = ['id' => $u->id, 'action' => 'create'];
                $createdFaculty++;
            }
        }

        foreach ($normalized as $row) {
            $lineNo = $row['line_no'];
            $teacherId = $facultyReport[$row['faculty_key']]['id'] ?? null;
            if (!$teacherId) { $errors[] = "Row {$lineNo}: faculty not resolved"; continue; }

            $existing = ClassGroup::where('class_code', $row['class_code'])->first();
            if ($existing && $mode === 'create') { $skippedClasses++; continue; }

            $className = "Section {$row['section']} - {$row['school_year']}";
            $payload = [
                'teacher_id'       => $teacherId,
                'name'             => $className,
                'description'      => $existing?->description ?? 'Imported from CSV',
                'component_type'   => $row['component'],
                'class_code'       => $row['class_code'],
                'join_code'        => $row['class_code'],
                'school_year'      => $row['school_year'],
                'academic_year_id' => $academicYear->id,
                'status'           => $existing?->status ?? 'active',
            ];

            if ($dryRun) { $existing ? $updatedClasses++ : $createdClasses++; continue; }

            try {
                if ($existing) { $existing->update($payload); $updatedClasses++; }
                else { ClassGroup::create($payload); $createdClasses++; }
            } catch (\Throwable $e) {
                $errors[] = "Row {$lineNo}: " . $e->getMessage();
                $skippedClasses++;
            }
        }

        return [
            'faculty_created' => $createdFaculty,
            'faculty_updated' => $updatedFaculty,
            'faculty_skipped' => $skippedFaculty,
            'class_created'   => $createdClasses,
            'class_updated'   => $updatedClasses,
            'class_skipped'   => $skippedClasses,
            'created'         => $createdFaculty + $createdClasses,
            'updated'         => $updatedFaculty + $updatedClasses,
            'skipped'         => $skippedFaculty + $skippedClasses,
            'errors'          => $errors,
            'warnings'        => $this->warnings,
            'faculty_rows'    => [],
            'class_rows'      => [],
            'school_year'     => $schoolYear,
            'dry_run'         => $dryRun,
            'mode'            => $mode,
        ];
    }

    // ============================================================
    // NEW: Parse the CSV, create a batch. Does NOT process rows.
    // ============================================================
    public function beginBatch(
        UploadedFile $file,
        string $mode = 'upsert',
        ?string $defaultSchoolYear = null,
        ?int $userId = null
    ): ImportBatch {
        $parsed = $this->parseCsv($file);
        if (!empty($parsed['errors'])) {
            throw new \RuntimeException(implode(' | ', $parsed['errors']));
        }

        $header = $parsed['header'];
        $rows   = $parsed['rows'];

        $required = ['class_code', 'component', 'section', 'last_name', 'first_name'];
        $missing  = array_diff($required, $header);
        if (!empty($missing)) {
            throw new \RuntimeException(
                'Missing required columns: ' . implode(', ', $missing) .
                ' | Detected: ' . implode(', ', $header)
            );
        }

        $normalized = [];
        foreach ($rows as $r) {
            $normalized[] = $this->normalizeRow($r);
        }

        return ImportBatch::create([
            'batch_code'        => 'FAC-' . date('Ymd-His') . '-' . Str::random(4),
            'type'              => 'faculty',
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

    // ============================================================
    // NEW: Process one chunk of rows
    // ============================================================
    public function processChunk(ImportBatch $batch, int $chunkSize = 25): array
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
        $academicYear = AcademicYear::findOrCreateByLabel($schoolYear);

        $created = 0;
        $updated = 0;
        $skipped = 0;

        $usedClassCodes = [];
        $facultyCache = []; // facultyKey => user_id

        foreach ($chunk as $i => $norm) {
            $lineNo    = $processed + $i + 2;
            $classCode = !empty($norm['class_code']) ? trim($norm['class_code']) : '';
            $component = !empty($norm['component']) ? strtolower(trim($norm['component'])) : '';
            $section   = !empty($norm['section']) ? trim($norm['section']) : '';
            $lastName  = !empty($norm['last_name']) ? trim($norm['last_name']) : '';
            $firstName = !empty($norm['first_name']) ? trim($norm['first_name']) : '';
            $email     = !empty($norm['email']) ? strtolower(trim($norm['email'])) : '';
            $password  = !empty($norm['password']) ? $norm['password'] : 'password123';

            if ($classCode === '') { $errors[] = "Row {$lineNo}: missing class_code"; $skipped++; continue; }
            if (!in_array($component, ['cwts', 'rotc', 'lts'], true)) { $errors[] = "Row {$lineNo}: invalid component"; $skipped++; continue; }
            if ($section === '') { $errors[] = "Row {$lineNo}: missing section"; $skipped++; continue; }
            if ($lastName === '' || $firstName === '') { $errors[] = "Row {$lineNo}: missing instructor name"; $skipped++; continue; }

            if (isset($usedClassCodes[$classCode])) {
                $errors[] = "Row {$lineNo}: duplicate class_code '{$classCode}' in this chunk";
                $skipped++;
                continue;
            }
            $usedClassCodes[$classCode] = true;

            $facKey = mb_strtolower($lastName) . '|' . mb_strtolower($firstName);

            try {
                DB::beginTransaction();

                $teacherId = $facultyCache[$facKey] ?? null;
                $userWasCreated = false;
                $userWasUpdated = false;

                if (!$teacherId) {
                    $existingUser = null;
                    if ($email) {
                        $existingUser = User::where('email', $email)->first();
                    }
                    if (!$existingUser) {
                        $existingUser = User::where('role', 'faculty')
                            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($firstName)])
                            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($lastName)])
                            ->first();
                    }

                    if ($existingUser && $batch->mode === 'create') {
                        $teacherId = $existingUser->id;
                    } elseif (!$existingUser && $batch->mode === 'update') {
                        throw new \RuntimeException("Faculty not found (mode=update)");
                    } elseif ($existingUser) {
                        $updates = [
                            'first_name'     => $firstName,
                            'last_name'      => $lastName,
                            'nstp_component' => $component,
                        ];
                        if ($email && $email !== $existingUser->email) {
                            $updates['email'] = $email;
                        }
                        $existingUser->update($updates);
                        $teacherId = $existingUser->id;
                        $userWasUpdated = true;
                    } else {
                        if (!$email) {
                            $email = $this->generateEmail($firstName, $lastName);
                        }
                        $u = User::create([
                            'first_name'     => $firstName,
                            'last_name'      => $lastName,
                            'email'          => $email,
                            'password'       => Hash::make($password),
                            'role'           => 'faculty',
                            'nstp_component' => $component,
                            'is_active'      => true,
                            'must_change_password' => true,
                        ]);
                        $teacherId = $u->id;
                        $userWasCreated = true;
                    }

                    $facultyCache[$facKey] = $teacherId;
                }

                // Create or update class
                $existingClass = ClassGroup::where('class_code', $classCode)->first();
                $className = "Section {$section} - {$schoolYear}";

                $classPayload = [
                    'teacher_id'       => $teacherId,
                    'name'             => $className,
                    'description'      => $existingClass?->description ?? 'Imported from CSV',
                    'component_type'   => $component,
                    'class_code'       => $classCode,
                    'school_year'      => $schoolYear,
                    'academic_year_id' => $academicYear->id,
                    'status'           => $existingClass?->status ?? 'active',
                ];

                if ($existingClass) {
                    $existingClass->update($classPayload);
                } else {
                    ClassGroup::create($classPayload);
                }

                DB::commit();

                if ($userWasCreated) $created++;
                elseif ($userWasUpdated) $updated++;
            } catch (\Throwable $e) {
                DB::rollBack();
                Log::error("Faculty import row {$lineNo} failed", [
                    'class_code' => $classCode,
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
            'skipped_count'  => $batch->skipped_count + $skipped,
            'errors_json'    => json_encode(array_slice($errors, -500)),
            'warnings_json'  => json_encode(array_slice($warnings, -500)),
            'status'         => $isDone ? 'completed' : 'processing',
            'finished_at'    => $isDone ? now() : null,
        ]);

        return $this->batchStatusPayload($batch->fresh());
    }

    // ============================================================
    // NEW: format batch as JSON payload
    // ============================================================
    public function batchStatusPayload(ImportBatch $batch): array
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

    // ============================================================
    // HELPERS
    // ============================================================
    private function normalizeRow(array $row): array
    {
        $aliases = [
            'sy'              => 'school_year',
            'class'           => 'class_code',
            'section_code'    => 'class_code',
            'nstp_component'  => 'component',
        ];

        $allowed = [
            'class_code', 'component', 'section',
            'last_name', 'first_name', 'email', 'password',
            'school_year',
        ];

        $out = [];
        foreach ($row as $k => $v) {
            $key = strtolower(trim((string) $k));
            $key = $aliases[$key] ?? $key;
            if (!in_array($key, $allowed, true)) continue;
            $out[$key] = is_string($v) ? trim($v) : $v;
        }
        return $out;
    }

    private function parseCsv(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if (!$path || !file_exists($path)) {
            return ['errors' => ['Uploaded file could not be read'], 'header' => [], 'rows' => []];
        }
        $contents = file_get_contents($path);
        if ($contents === false || trim($contents) === '') {
            return ['errors' => ['Uploaded file is empty'], 'header' => [], 'rows' => []];
        }
        $contents = preg_replace('/^\xEF\xBB\xBF/', '', $contents);
        $contents = str_replace(["\r\n", "\r"], "\n", $contents);

        $stream = fopen('php://temp', 'r+');
        fwrite($stream, $contents);
        rewind($stream);

        $header = fgetcsv($stream);
        if (!$header) {
            fclose($stream);
            return ['errors' => ['CSV file has no header row'], 'header' => [], 'rows' => []];
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
            if (empty(array_filter($row, fn ($v) => $v !== null && $v !== ''))) continue;
            $assoc = [];
            foreach ($header as $idx => $key) {
                if ($key === '') continue;
                $assoc[$key] = $row[$idx] ?? null;
            }
            $rows[] = $assoc;
        }
        fclose($stream);

        if (empty($rows)) {
            return ['errors' => ['No data rows found in the CSV.'], 'header' => $header, 'rows' => []];
        }
        return ['errors' => [], 'header' => $header, 'rows' => $rows];
    }

    private function generateEmail(string $firstName, string $lastName): string
    {
        $base  = Str::slug(strtolower($firstName) . '.' . strtolower($lastName), '.');
        $email = "{$base}@nstp.edu";
        $i = 1;
        while (User::where('email', $email)->exists()) {
            $email = "{$base}{$i}@nstp.edu";
            $i++;
        }
        return $email;
    }

    private function guessCurrentSchoolYear(): string
    {
        $y = (int) date('Y');
        return (int) date('n') >= 8
            ? "{$y}-" . ($y + 1)
            : ($y - 1) . "-{$y}";
    }

    private function emptySyncResult(array $errors, bool $dryRun): array
    {
        return [
            'faculty_created' => 0,
            'faculty_updated' => 0,
            'faculty_skipped' => 0,
            'class_created'   => 0,
            'class_updated'   => 0,
            'class_skipped'   => 0,
            'created'         => 0,
            'updated'         => 0,
            'skipped'         => 0,
            'errors'          => $errors,
            'warnings'        => [],
            'faculty_rows'    => [],
            'class_rows'      => [],
            'school_year'     => null,
            'dry_run'         => $dryRun,
            'mode'            => null,
        ];
    }
}