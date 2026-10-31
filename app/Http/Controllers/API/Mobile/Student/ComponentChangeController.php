<?php
// app/Http/Controllers/API/Mobile/Student/ComponentChangeController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\ComponentChangeRequest;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ComponentChangeController extends Controller
{
    /**
     * Get all component change requests for the authenticated student
     */
    public function index(Request $request)
    {
        try {
            $student = $request->user()->student;
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $requests = ComponentChangeRequest::where('student_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching component requests: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new component change request
     */
     public function store(Request $request)
    {
        try {
            // Log the incoming request
            Log::info('📝 Component change request received', [
                'user_id' => $request->user()?->id,
                'request_data' => $request->all()
            ]);

            $student = $request->user()->student;
            
            if (!$student) {
                Log::error('❌ Student not found for user', ['user_id' => $request->user()?->id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            Log::info('✅ Student found', [
                'student_id' => $student->id,
                'current_component' => $student->nstp_component_selected
            ]);

            $validator = Validator::make($request->all(), [
                'to_component' => 'required|in:cwts,rotc,lts',
                'reason' => 'required|string|min:10',
            ]);

            if ($validator->fails()) {
                Log::error('❌ Validation failed', ['errors' => $validator->errors()->toArray()]);
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if there's already a pending request
            $existingPending = ComponentChangeRequest::where('student_id', $student->id)
                ->where('status', 'pending')
                ->first();

            if ($existingPending) {
                Log::warning('⚠️ Existing pending request found', ['request_id' => $existingPending->id]);
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending component change request'
                ], 400);
            }

            // Check if trying to change to the same component
            if ($student->nstp_component_selected === $request->to_component) {
                Log::warning('⚠️ Student already in this component', [
                    'current' => $student->nstp_component_selected,
                    'requested' => $request->to_component
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'You are already in this component'
                ], 400);
            }

            // Create the request
            Log::info('📝 Creating component change request', [
                'student_id' => $student->id,
                'from' => $student->nstp_component_selected,
                'to' => $request->to_component,
                'reason' => $request->reason
            ]);

            $componentRequest = ComponentChangeRequest::create([
                'student_id' => $student->id,
                'from_component' => $student->nstp_component_selected,
                'to_component' => $request->to_component,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            Log::info('✅ Component request created successfully', [
                'request_id' => $componentRequest->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Component change request submitted successfully',
                'data' => $componentRequest
            ], 201);

        } catch (\Exception $e) {
            Log::error('❌ Error submitting component request: ' . $e->getMessage());
            Log::error('❌ Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a pending component change request
     */
    public function cancel(Request $request, $id)
    {
        try {
            $student = $request->user()->student;
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student profile not found'
                ], 404);
            }

            $componentRequest = ComponentChangeRequest::where('id', $id)
                ->where('student_id', $student->id)
                ->where('status', 'pending')
                ->first();

            if (!$componentRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request not found or cannot be cancelled'
                ], 404);
            }

            $componentRequest->update([
                'status' => 'cancelled',
                'admin_remarks' => 'Cancelled by student'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Request cancelled successfully',
                'data' => $componentRequest
            ]);

        } catch (\Exception $e) {
            Log::error('Error cancelling component request: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel request: ' . $e->getMessage()
            ], 500);
        }
    }
}