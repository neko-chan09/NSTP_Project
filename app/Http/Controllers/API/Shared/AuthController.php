<?php
// app/Http/Controllers/API/Shared/AuthController.php

namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Admin login endpoint.
     * Authenticates an admin/super_admin/faculty user via email and password.
     * POST /api/admin/login
     */
    public function adminLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Check if user is admin / super_admin / faculty
        if (!in_array($user->role, ['admin', 'super_admin', 'faculty'])) {
            return response()->json([
                'message' => 'Access denied. Admin access required.',
            ], 403);
        }

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'nstp_component' => $user->nstp_component,
                'class_code' => $user->class_code,
                'profile_photo' => $user->profile_photo,
                'profile_photo_url' => $user->profile_photo_url,
                'initials' => $user->initials,
                'full_name' => $user->full_name,
                'must_change_password' => (bool) $user->must_change_password,
            ],
        ]);
    }

    /**
     * Regular login for mobile - uses student_id instead of email.
     * POST /api/login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('student_id', $request->student_id)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'student_id' => $user->student_id,
                'nstp_component' => $user->nstp_component,
                'profile_photo' => $user->profile_photo,
                'profile_photo_url' => $user->profile_photo_url,
                'initials' => $user->initials,
                'full_name' => $user->full_name,
                'must_change_password' => (bool) $user->must_change_password,
            ],
        ]);
    }

    /**
     * Log out the current user by revoking their access token.
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get the authenticated user's profile.
     * GET /api/me
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Change the authenticated user's password.
     * POST /api/change-password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect',
            ], 401);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Change password on first login (forced).
     * POST /api/change-password-first-login
     */
    public function changePasswordFirstLogin(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (!$user->must_change_password) {
            return response()->json([
                'success' => false,
                'message' => 'Password change is not required for this account.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 401);
        }

        if (Hash::check($request->new_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'New password must be different from the current password.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'data' => [
                'must_change_password' => false,
            ],
        ]);
    }

    /**
     * Register a new student user.
     * POST /api/register
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'student_id' => 'required|string|unique:students,student_id',
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
            'student_id' => $request->student_id,
            'contact_number' => $request->contact_number,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->role,
                'student_id' => $user->student_id,
                'contact_number' => $user->contact_number,
            ],
        ], 201);
    }

    /**
     * Check if an email address is available for registration.
     * POST /api/check-email
     */
    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->email;
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'success' => true,
            'available' => !$exists,
            'message' => $exists ? 'Email is already taken' : 'Email is available',
        ]);
    }

    /**
     * Check if contact number is available.
     * POST /api/check-contact-number
     */
    public function checkContactNumber(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'contact_number' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $contactNumber = $request->contact_number;
        $exists = User::where('contact_number', $contactNumber)->exists();

        return response()->json([
            'success' => true,
            'available' => !$exists,
            'message' => $exists ? 'Contact number is already taken' : 'Contact number is available',
        ]);
    }

    // ============================================================
    // SELF-SERVICE PROFILE
    // ============================================================

    /**
     * Return the authenticated user's own profile.
     * GET /api/profile
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
                'role' => $user->role,
                'contact_number' => $user->contact_number,
                'nstp_component' => $user->nstp_component,
                'class_code' => $user->class_code,
                'course' => $user->course,
                'year_level' => $user->year_level,
                'section' => $user->section,
                'profile_photo' => $user->profile_photo,
                'profile_photo_url' => $user->profile_photo_url,
                'full_name' => $user->full_name,
                'initials' => $user->initials,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Update the authenticated user's own profile.
     * POST /api/profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = [];
        if ($request->filled('first_name')) $data['first_name'] = $request->first_name;
        if ($request->filled('last_name'))  $data['last_name']  = $request->last_name;
        if ($request->filled('email'))      $data['email']      = strtolower(trim($request->email));
        if ($request->has('contact_number')) {
            $data['contact_number'] = $request->contact_number ?: null;
        }

        if (!empty($data)) {
            $user->update($data);
        }

        // Refresh so accessors reflect the new values
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'profile_photo' => $user->profile_photo,
                'profile_photo_url' => $user->profile_photo_url,
                'full_name' => $user->full_name,
                'initials' => $user->initials,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Upload a new profile photo.
     * POST /api/profile/photo
     */
    public function uploadPhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            // Remove old photo if present
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $file = $request->file('photo');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'profile_photos/' . $user->id . '_' . time() . '.' . $ext;

            Storage::disk('public')->putFileAs(
                'profile_photos',
                $file,
                basename($filename)
            );

            $user->profile_photo = $filename;
            $user->save();

            $user->refresh();

            Log::info('Profile photo uploaded', [
                'user_id' => $user->id,
                'path' => $filename,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile photo updated',
                'data' => [
                    'profile_photo' => $user->profile_photo,
                    'profile_photo_url' => $user->profile_photo_url,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Profile photo upload failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload photo',
            ], 500);
        }
    }

    /**
     * Delete profile photo.
     * DELETE /api/profile/photo
     */
    public function deletePhoto(Request $request)
    {
        $user = $request->user();

        try {
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $user->profile_photo = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Profile photo removed',
            ]);
        } catch (\Throwable $e) {
            Log::error('Profile photo delete failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove photo',
            ], 500);
        }
    }
}