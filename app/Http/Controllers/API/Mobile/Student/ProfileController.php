<?php
// app/Http/Controllers/API/Mobile/Student/ProfileController.php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Get student profile with user details
     */
    public function profile(Request $request)
    {
        $student = $request->user()->student;
        if (!$student) return response()->json(['message' => 'Student profile not found. Contact the NSTP office.'], 404);
        return response()->json(['success' => true, 'data' => $student->load('user')]);
    }

    /**
     * Get compliance status
     */
    public function complianceStatus(Request $request)
    {
        $student = $request->user()->student;
        return response()->json([
            'success' => true,
            'data' => [
                'student_id' => $student->student_id,
                'completed_hours' => $student->completed_training_hours,
                'required_hours' => 90,
                'completion_percentage' => round(($student->completed_training_hours / 90) * 100, 2),
                'status' => $student->completion_status,
            ]
        ]);
    }

    /**
     * Update student profile (email and contact number)
     * FIXED: Removed 'name' column reference
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        $validator = Validator::make($request->all(), [
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number,' . $user->id,
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user fields - REMOVED 'name' column
        $userData = [];
        
        if ($request->has('email')) {
            $userData['email'] = $request->email;
        }
        
        if ($request->has('contact_number')) {
            $userData['contact_number'] = $request->contact_number;
        }
        
        if ($request->has('first_name')) {
            $userData['first_name'] = $request->first_name;
        }
        
        if ($request->has('last_name')) {
            $userData['last_name'] = $request->last_name;
        }

        // Only update if there are changes
        if (!empty($userData)) {
            $user->update($userData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $student->fresh()->load('user')
        ]);
    }

    /**
     * Request OTP for password change
     */
    public function requestOtp(Request $request)
    {
        $user = $request->user();
        $email = $user->email;

        // Generate a 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store OTP in cache with 5-minute expiry
        Cache::put('password_reset_otp_' . $user->id, $otp, 300);

        // For development, return OTP in response (remove in production)
        return response()->json([
            'success' => true,
            'message' => 'OTP sent to your email',
            'otp' => $otp // remove this in production
        ]);
    }

    /**
     * Change password using OTP
     */
    public function changePasswordWithOtp(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'otp' => 'required|string|size:6',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $cachedOtp = Cache::get('password_reset_otp_' . $user->id);
        if (!$cachedOtp || $cachedOtp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP'
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Clear OTP after successful change
        Cache::forget('password_reset_otp_' . $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }
     public function uploadPhoto(Request $request)
    {
        return app(\App\Http\Controllers\API\Shared\AuthController::class)->uploadPhoto($request);
    }

    public function deletePhoto(Request $request)
    {
        return app(\App\Http\Controllers\API\Shared\AuthController::class)->deletePhoto($request);
    }
}