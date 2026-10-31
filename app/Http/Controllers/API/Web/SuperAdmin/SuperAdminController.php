<?php
// app/Http/Controllers/API/Web/SuperAdmin/SuperAdminController.php

namespace App\Http\Controllers\API\Web\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ImportBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Http\Requests\ImportFacultyRequest;
use App\Services\FacultyImportService;

class SuperAdminController extends Controller
{
    // ============================================================
    // INDEX — list all admins & faculty
    // ============================================================
    public function index()
    {
        try {
            $users = User::whereIn('role', ['admin', 'faculty'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id'                => $user->id,
                        'first_name'        => $user->first_name,
                        'last_name'         => $user->last_name,
                        'email'             => $user->email,
                        'profile_photo'     => $user->profile_photo,
                        'profile_photo_url' => $user->profile_photo_url,
                        'initials'          => $user->initials,
                        'full_name'         => $user->full_name,
                        'role'              => $user->role,
                        'nstp_component'    => $user->nstp_component,
                        'class_code'        => $user->class_code,   // ✅ new
                        'contact_number'    => $user->contact_number,
                        'is_active'         => (bool) $user->is_active,
                        'created_at'        => $user->created_at,
                        'updated_at'        => $user->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data'    => $users,
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // SHOW — single user details
    // ============================================================
    public function show($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if (!in_array($user->role, ['admin', 'faculty'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot view this user',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'                => $user->id,
                    'first_name'        => $user->first_name,
                    'last_name'         => $user->last_name,
                    'email'             => $user->email,
                    'profile_photo'     => $user->profile_photo,
                    'profile_photo_url' => $user->profile_photo_url,
                    'initials'          => $user->initials,
                    'full_name'         => $user->full_name,
                    'role'              => $user->role,
                    'nstp_component'    => $user->nstp_component,
                    'class_code'        => $user->class_code,   // ✅ new
                    'contact_number'    => $user->contact_number,
                    'is_active'         => (bool) $user->is_active,
                    'created_at'        => $user->created_at,
                    'updated_at'        => $user->updated_at,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin show error: ' . $e->getMessage(), [
                'id'    => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // STORE — create admin/faculty
    // ============================================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name'     => 'required|string|max:255',
            'last_name'      => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email',
            'password'       => 'required|string|min:6',
            'role'           => 'required|in:admin,faculty',
            'profile_photo'  => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number',
            'nstp_component' => 'nullable|in:cwts,rotc,lts',
            'class_code'     => 'nullable|string|max:50|unique:users,class_code',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $userData = [
                'first_name'     => $request->first_name,
                'last_name'      => $request->last_name,
                'email'          => $request->email,
                'password'       => Hash::make($request->password),
                'role'           => $request->role,
                'is_active'      => true,
                'contact_number' => $request->contact_number,
                'nstp_component' => $request->nstp_component,
                // ✅ Only faculty get a class_code
                'class_code'     => $request->role === 'faculty'
                    ? $this->normalizeClassCode($request->class_code)
                    : null,
                'must_change_password' => true,
            ];

            // Handle profile photo upload
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('profile_photos', $fileName, 'public');
                $userData['profile_photo'] = $filePath;
            }

            $user = User::create($userData);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data'    => [
                    'id'                => $user->id,
                    'first_name'        => $user->first_name,
                    'last_name'         => $user->last_name,
                    'email'             => $user->email,
                    'profile_photo'     => $user->profile_photo,
                    'profile_photo_url' => $user->profile_photo_url,
                    'role'              => $user->role,
                    'nstp_component'    => $user->nstp_component,
                    'class_code'        => $user->class_code,   // ✅ new
                    'is_active'         => (bool) $user->is_active,
                    'created_at'        => $user->created_at,
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin store error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // UPDATE — edit admin/faculty
    // ============================================================
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        if ($user->role === 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify super admin user',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'first_name'     => 'sometimes|string|max:255',
            'last_name'      => 'sometimes|string|max:255',
            'email'          => 'sometimes|email|unique:users,email,' . $id,
            'password'       => 'nullable|string|min:6',
            'role'           => 'sometimes|in:admin,faculty',
            'profile_photo'  => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number,' . $id,
            'nstp_component' => 'nullable|in:cwts,rotc,lts',
            'class_code'     => 'nullable|string|max:50|unique:users,class_code,' . $id,
            'is_active'      => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $data = [];

            if ($request->has('first_name')) {
                $data['first_name'] = $request->first_name;
            }
            if ($request->has('last_name')) {
                $data['last_name'] = $request->last_name;
            }
            if ($request->has('email')) {
                $data['email'] = $request->email;
            }
            if ($request->has('role')) {
                $data['role'] = $request->role;
            }
            if ($request->has('contact_number')) {
                $data['contact_number'] = $request->contact_number;
            }
            if ($request->has('nstp_component')) {
                $data['nstp_component'] = $request->nstp_component;
            }
            if ($request->has('is_active')) {
                $data['is_active'] = (bool) $request->is_active;
            }
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            // ✅ class_code logic: only for faculty
            if ($request->has('class_code') || $request->has('role')) {
                $newRole = $request->input('role', $user->role);

                if ($newRole === 'faculty') {
                    $data['class_code'] = $this->normalizeClassCode(
                        $request->input('class_code', $user->class_code)
                    );
                } else {
                    // Changing to non-faculty clears the class_code
                    $data['class_code'] = null;
                }
            }

            // Handle profile photo replacement
            if ($request->hasFile('profile_photo')) {
                if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                    Storage::disk('public')->delete($user->profile_photo);
                }

                $file = $request->file('profile_photo');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('profile_photos', $fileName, 'public');
                $data['profile_photo'] = $filePath;
            }

            if (!empty($data)) {
                $user->update($data);
            }

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data'    => [
                    'id'                => $user->id,
                    'first_name'        => $user->first_name,
                    'last_name'         => $user->last_name,
                    'email'             => $user->email,
                    'profile_photo'     => $user->profile_photo,
                    'profile_photo_url' => $user->profile_photo_url,
                    'role'              => $user->role,
                    'nstp_component'    => $user->nstp_component,
                    'class_code'        => $user->class_code,   // ✅ new
                    'contact_number'    => $user->contact_number,
                    'is_active'         => (bool) $user->is_active,
                    'created_at'        => $user->created_at,
                    'updated_at'        => $user->updated_at,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin update error: ' . $e->getMessage(), [
                'id'    => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // DESTROY — delete admin/faculty
    // ============================================================
    public function destroy($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if ($user->role === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete super admin user',
                ], 403);
            }

            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete your own account',
                ], 403);
            }

            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin destroy error: ' . $e->getMessage(), [
                'id'    => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // TOGGLE ACTIVE — activate / deactivate a user
    // ============================================================
    public function toggleActive(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            if ($user->role === 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify super admin user',
                ], 403);
            }

            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot modify your own account',
                ], 403);
            }

            $isActive = $request->has('is_active')
                ? (bool) $request->input('is_active')
                : !$user->is_active;

            $user->update(['is_active' => $isActive]);

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data'    => [
                    'id'        => $user->id,
                    'is_active' => (bool) $user->is_active,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin toggleActive error: ' . $e->getMessage(), [
                'id'    => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // STATS — dashboard counters for super admin
    // ============================================================
    public function stats()
    {
        try {
            $totalAdmins  = User::where('role', 'admin')->count();
            $totalFaculty = User::where('role', 'faculty')->count();

            $totalActive = User::whereIn('role', ['admin', 'faculty'])
                ->where('is_active', true)
                ->count();

            $totalInactive = User::whereIn('role', ['admin', 'faculty'])
                ->where('is_active', false)
                ->count();

            return response()->json([
                'success' => true,
                'data'    => [
                    'total_admins'   => $totalAdmins,
                    'total_faculty'  => $totalFaculty,
                    'total_active'   => $totalActive,
                    'total_inactive' => $totalInactive,
                    'total_users'    => $totalAdmins + $totalFaculty,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('SuperAdmin stats error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    /**
     * Class codes are always upper-case, no spaces, and a sensible default
     * is generated when the field is empty.
     *
     * e.g. "cwts-a1" → "CWTS-A1"
     *      ""        → "FAC-<random6>"
     */
    private function normalizeClassCode(?string $code): string
    {
        $code = $code ? trim($code) : '';

        if ($code === '') {
            // Fallback: auto-generate a code so faculty always have one
            do {
                $code = 'FAC-' . strtoupper(Str::random(6));
            } while (User::where('class_code', $code)->exists());
        }

        return strtoupper(preg_replace('/\s+/', '', $code));
    }

    // ============================================================
    // FACULTY CSV IMPORT
    // ============================================================

    public function templateCsv()
    {
        $headers = [
            'class_code',
            'component',
            'section',
            'last_name',
            'first_name',
            'email',
            'password',
            'school_year',
        ];

        $sample = [
            'CLS-000031',
            'cwts',
            'D',
            'Autida',
            'Daisy Mar',
            'daisy.autida@nstp.edu',
            'password',
            '2025-2026',
        ];

        $csv  = chr(239) . chr(187) . chr(191); // BOM
        $csv .= implode(',', $headers) . "\n";
        $csv .= implode(',', $sample) . "\n";

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="faculty_class_template.csv"');
    }

    public function exportCsv()
    {
        $faculty = User::where('role', 'faculty')
            ->orderBy('last_name')
            ->get();

        $headers = [
            'first_name',
            'last_name',
            'email',
            'nstp_component',
            'class_code',
            'contact_number',
            'is_active',
        ];

        $csv  = chr(239) . chr(187) . chr(191); // BOM
        $csv .= implode(',', $headers) . "\n";

        foreach ($faculty as $f) {
            $row = [
                $f->first_name,
                $f->last_name,
                $f->email,
                $f->nstp_component ?? '',
                $f->class_code ?? '',
                $f->contact_number ?? '',
                $f->is_active ? 'yes' : 'no',
            ];

            $csv .= implode(',', array_map(function ($v) {
                $v = (string) $v;
                return (str_contains($v, ',') || str_contains($v, '"'))
                    ? '"' . str_replace('"', '""', $v) . '"'
                    : $v;
            }, $row)) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="faculty_' . date('Y-m-d') . '.csv"');
    }

    public function importCsv(
        ImportFacultyRequest $request,
        FacultyImportService $importer
    ) {
        try {
            $result = $importer->import(
                $request->file('file'),
                $request->input('mode', 'upsert'),
                (bool) $request->input('dry_run', false)
            );

            return response()->json([
                'success' => true,
                'dry_run' => (bool) $request->input('dry_run', false),
                'message' => $request->input('dry_run')
                    ? 'Dry-run preview generated.'
                    : "Imported: {$result['created']} created, {$result['updated']} updated, {$result['skipped']} skipped.",
                'data'    => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Faculty import error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ============================================================
    // FACULTY IMPORT — CHUNKED (no queue)
    // ============================================================

    public function importStart(
        Request $request,
        FacultyImportService $service
    ) {
        $validator = Validator::make($request->all(), [
            'file'        => 'required|file|mimes:csv,txt|max:51200',
            'mode'        => 'nullable|in:create,update,upsert',
            'school_year' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $batch = $service->beginBatch(
                $request->file('file'),
                $request->input('mode', 'upsert'),
                $request->input('school_year'),
                $request->user()->id
            );

            return response()->json([
                'success'    => true,
                'batch_id'   => $batch->id,
                'batch_code' => $batch->batch_code,
                'total_rows' => $batch->total_rows,
                'message'    => "Parsed {$batch->total_rows} rows. Ready to process.",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start import: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function importProcessChunk(
        Request $request,
        $id,
        FacultyImportService $service
    ) {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }

        if (!$batch->is_running) {
            return response()->json([
                'success' => true,
                'data'    => $service->batchStatusPayload($batch),
                'message' => 'Batch already finished',
            ]);
        }

        $chunkSize = (int) $request->input('chunk_size', 25);
        $chunkSize = max(1, min($chunkSize, 100));

        try {
            $payload = $service->processChunk($batch, $chunkSize);
            return response()->json(['success' => true, 'data' => $payload]);
        } catch (\Throwable $e) {
            Log::error('Faculty processChunk failed', [
                'batch_id' => $batch->id,
                'error'    => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Chunk failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function importStatus(
        Request $request,
        $id,
        FacultyImportService $service
    ) {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }

        $user = $request->user();
        if ($batch->user_id && $batch->user_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $service->batchStatusPayload($batch),
        ]);
    }

    public function importCancel(Request $request, $id)
    {
        $batch = ImportBatch::find($id);
        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'Batch not found'], 404);
        }
        if (!$batch->is_running) {
            return response()->json(['success' => false, 'message' => 'Batch is not running'], 400);
        }

        $batch->update([
            'status'      => 'cancelled',
            'finished_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Batch cancelled']);
    }

    public function importHistory(Request $request)
    {
        $batches = ImportBatch::where('type', 'faculty')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($b) => [
                'id'                => $b->id,
                'batch_code'        => $b->batch_code,
                'status'            => $b->status,
                'progress_percent'  => $b->progress_percent,
                'total_rows'        => $b->total_rows,
                'processed_rows'    => $b->processed_rows,
                'created_count'     => $b->created_count,
                'updated_count'     => $b->updated_count,
                'skipped_count'     => $b->skipped_count,
                'original_filename' => $b->original_filename,
                'created_at'        => $b->created_at->toIso8601String(),
                'finished_at'       => $b->finished_at?->toIso8601String(),
            ]);

        return response()->json(['success' => true, 'data' => $batches]);
    }
}
