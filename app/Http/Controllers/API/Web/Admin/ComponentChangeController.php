<?php
// app/Http/Controllers/API/Web/Admin/ComponentChangeController.php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\ComponentChangeRequest;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Helpers\NotificationHelper;

class ComponentChangeController extends Controller
{
    /**
     * Get all component change requests
     */
    public function index(Request $request)
{
    $query = ComponentChangeRequest::with(['student.user'])
        ->orderBy('created_at', 'desc');

    // Filter by status
    if ($request->has('status') && $request->status !== 'all') {
        $query->where('status', $request->status);
    }

    $requests = $query->get();

    return response()->json([
        'success' => true,
        'data' => $requests
    ]);
}

    /**
     * Update a component change request (approve/reject)
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected',
            'admin_remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $componentRequest = ComponentChangeRequest::find($id);
        
        if (!$componentRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Request not found'
            ], 404);
        }

        // Update the request
        $componentRequest->update([
            'status' => $request->status,
            'admin_remarks' => $request->admin_remarks,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        // If approved, update the student's component
        if ($request->status === 'approved') {
            $student = $componentRequest->student;
            if ($student) {
                $student->update([
                    'nstp_component_selected' => $componentRequest->to_component,
                ]);
                
                // Send notification to student
                NotificationHelper::sendToStudent(
                    $student,
                    'Component Change Approved',
                    "Your component change request from {$componentRequest->from_component} to {$componentRequest->to_component} has been approved.",
                    'component_change',
                    ['id' => $componentRequest->id]
                );
            }
        } else {
            // Send notification for rejection
            $student = $componentRequest->student;
            if ($student) {
                NotificationHelper::sendToStudent(
                    $student,
                    'Component Change Rejected',
                    "Your component change request from {$componentRequest->from_component} to {$componentRequest->to_component} has been rejected. Reason: " . ($request->admin_remarks ?? 'No reason provided'),
                    'component_change',
                    ['id' => $componentRequest->id]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Request updated successfully',
            'data' => $componentRequest->load(['student.user'])
        ]);
    }
}