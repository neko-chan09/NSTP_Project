<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\CertificateDesignService;
use Illuminate\Http\Request;

class CertificateDesignController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        // The existing 'admin' middleware also permits faculty. Certificate design is admin-only.
        abort_unless(in_array($request->user()?->role, ['admin', 'super_admin'], true), 403);
    }

    public function show(Request $request, string $type, CertificateDesignService $service)
    {
        $this->authorizeAdmin($request);
        return response()->json(['data' => $service->load($type)])->header('Cache-Control', 'no-store');
    }

    public function update(Request $request, string $type, CertificateDesignService $service)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate(['design' => 'required|array']);
        return response()->json(['data' => $service->save($type, $data['design'])]);
    }

    public function preview(Request $request, string $type, CertificateDesignService $service)
    {
        $this->authorizeAdmin($request);
        abort_unless(in_array($type, CertificateDesignService::TYPES, true), 404);
        $data = $request->validate(['design' => 'required|array', 'student_id' => 'nullable|integer|exists:students,id']);
        $student = isset($data['student_id']) ? Student::with('user')->findOrFail($data['student_id']) : null;
        $fields = $service->fields($student, $type, 'NSTP-PREVIEW-NOT-ISSUED');
        return $service->render($data['design'], $fields, url('/api/verify-certificate/NSTP-PREVIEW-NOT-ISSUED'))
            ->stream('certificate-preview.pdf', ['Attachment' => false]);
    }
}
