<?php
// app/Http/Controllers/API/Shared/PasswordResetController.php

namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Mail\PasswordResetOtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    /**
     * Send OTP to user's email
     */
    public function sendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Create OTP
            $otpRecord = PasswordResetOtp::createOtp($email);
            $otp = $otpRecord->otp;

            // Send email
            Mail::to($email)->send(new PasswordResetOtpMail($otp, $user->first_name ?? 'User'));

            Log::info('OTP sent successfully', ['email' => $email]);

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your email address.',
                'data' => [
                    'email' => $email,
                    'expires_in' => 10, // minutes
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send OTP: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please try again later.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $otpRecord = PasswordResetOtp::verifyOtp($request->email, $request->otp);

        if (!$otpRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP. Please request a new one.'
            ], 400);
        }

        // Mark OTP as used
        $otpRecord->update(['is_used' => true]);

        // Generate a temporary token for password reset
        $resetToken = $otpRecord->id . '|' . hash('sha256', $request->email . now()->timestamp);

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully.',
            'data' => [
                'reset_token' => $resetToken,
                'email' => $request->email,
            ]
        ]);
    }

    /**
     * Reset password using OTP
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'reset_token' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verify reset token
            $parts = explode('|', $request->reset_token);
            if (count($parts) !== 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid reset token.'
                ], 400);
            }

            $otpId = $parts[0];
            $otpRecord = PasswordResetOtp::find($otpId);

            if (!$otpRecord || $otpRecord->email !== $request->email || !$otpRecord->is_used) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired reset token.'
                ], 400);
            }

            // Update password
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 404);
            }

            $user->password = Hash::make($request->new_password);
            $user->save();

            // Delete the OTP record
            $otpRecord->delete();

            Log::info('Password reset successful', ['email' => $request->email]);

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. You can now login with your new password.'
            ]);

        } catch (\Exception $e) {
            Log::error('Password reset failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to reset password. Please try again.'
            ], 500);
        }
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $user = User::where('email', $email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Delete old OTPs and create new one
            $otpRecord = PasswordResetOtp::createOtp($email);
            $otp = $otpRecord->otp;

            // Send email
            Mail::to($email)->send(new PasswordResetOtpMail($otp, $user->first_name ?? 'User'));

            Log::info('OTP resent successfully', ['email' => $email]);

            return response()->json([
                'success' => true,
                'message' => 'New OTP sent to your email address.',
                'data' => [
                    'email' => $email,
                    'expires_in' => 10,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to resend OTP: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to resend OTP. Please try again later.'
            ], 500);
        }
    }

    /**
     * Change password for authenticated users
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.'
            ], 401);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        Log::info('Password changed successfully', ['user_id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }
}