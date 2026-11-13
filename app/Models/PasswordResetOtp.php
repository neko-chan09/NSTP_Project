<?php
// app/Models/PasswordResetOtp.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PasswordResetOtp extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'otp',
        'expires_at',
        'is_used', 'reset_token_hash', 'reset_expires_at', 'otp_attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean', 'reset_expires_at' => 'datetime', 'otp_attempts' => 'integer',
    ];

    /**
     * Check if OTP is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if OTP is valid
     */
    public function isValid(): bool
    {
        return !$this->is_used && !$this->isExpired();
    }

    /**
     * Generate a new OTP
     */
    public static function generateOtp(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create a new OTP record
     */
    public static function createOtp(string $email): self
    {
        // Delete existing OTPs for this email
        self::where('email', $email)->delete();

        return self::create([
            'email' => $email,
            'otp' => self::generateOtp(),
            'expires_at' => now()->addMinutes(10),
            'is_used' => false,
        ]);
    }

    /**
     * Verify OTP
     */
    public static function verifyOtp(string $email, string $otp): ?self
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($email, $otp) {
            $record = self::where('email', $email)->where('is_used', false)->latest('id')->lockForUpdate()->first();
            if (!$record || $record->isExpired() || $record->otp_attempts >= 5) return null;
            if (!hash_equals($record->otp, $otp)) {
                $record->increment('otp_attempts');
                return null;
            }
            $record->update(['is_used' => true]);
            return $record;
        });
    }
}