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
use Illuminate\Support\Facades\DB;

class PasswordResetController extends Controller
{
    /**
     * Send OTP to user's email
     */
    public function sendOtp(Request $request)
    {
        $request->merge(['email'=>mb_strtolower(trim((string)$request->email))]);
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $email = $request->email;
            $user = User::whereRaw('LOWER(email) = ?',[$email])->first();

            if (!$user) {
                return response()->json(['success'=>true,'message'=>'If the email matches an account, an OTP will be sent. If you cannot access it, contact Super Admin.','data'=>['email'=>$email,'expires_in'=>10]]);
            }

            $key='password-otp:'.hash('sha256',$email);
            if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key,1)) {
                return response()->json(['message'=>'Please wait before requesting another OTP.','retry_after'=>\Illuminate\Support\Facades\RateLimiter::availableIn($key)],429);
            }
            \Illuminate\Support\Facades\RateLimiter::hit($key,60);
            // Create OTP
            $otp=PasswordResetOtp::generateOtp();
            $otpRecord = PasswordResetOtp::createOtp($email,$otp);

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
                'message' => 'Email delivery is unavailable. Retry later or ask Super Admin to verify your identity and reset your password.',
            ], 500);
        }
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->merge(['email'=>mb_strtolower(trim((string)$request->email))]);
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|max:255',
            'otp' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
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

        $secret = bin2hex(random_bytes(32));
        $otpRecord->update(['reset_token_hash' => hash('sha256', $secret), 'reset_expires_at' => now()->addMinutes(10)]);
        $resetToken = $otpRecord->id . '|' . $secret;

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
        $request->merge(['email'=>mb_strtolower(trim((string)$request->email))]);
        $request->validate([
            'email' => 'required|email', 'reset_token' => 'required|string|max:200',
            'new_password' => 'required|string|min:8|max:128|confirmed',
        ]);
        $parts = explode('|', $request->reset_token);
        if (count($parts) !== 2 || !ctype_digit($parts[0]) || !preg_match('/^[a-f0-9]{64}$/D', $parts[1])) {
            return response()->json(['success' => false, 'message' => 'Invalid or expired reset token.'], 400);
        }
        $reset = DB::transaction(function () use ($request, $parts) {
            $otp = PasswordResetOtp::where('id', $parts[0])->lockForUpdate()->first();
            if (!$otp || $otp->email !== $request->email || !$otp->is_used || !$otp->reset_token_hash ||
                !$otp->reset_expires_at || !$otp->reset_expires_at->isFuture() ||
                !hash_equals($otp->reset_token_hash, hash('sha256', $parts[1]))) return false;
            $user = User::whereRaw('LOWER(email) = ?',[$request->email])->lockForUpdate()->first();
            if (!$user) return false;
            app(\App\Services\PasswordRecoveryService::class)->replace($user,$request->new_password,false,$user->id,'Email OTP recovery');
            return true;
        });
        return $reset
            ? response()->json(['success' => true, 'message' => 'Password reset successfully. Please sign in again.'])
            : response()->json(['success' => false, 'message' => 'Invalid or expired reset token.'], 400);
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request)
    {
        return $this->sendOtp($request);
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
            'new_password' => 'required|string|min:8|max:128|confirmed',
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