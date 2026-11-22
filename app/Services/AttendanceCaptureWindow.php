<?php
namespace App\Services;

use App\Models\AttendanceSession;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class AttendanceCaptureWindow
{
    /** Offline capture time is a client claim; face, enrollment and location are rechecked separately. */
    public function time(AttendanceSession $session, bool $offline, ?string $capturedAt): Carbon
    {
        $time = $offline && $capturedAt ? Carbon::parse($capturedAt) : now();
        if ($offline && (!$capturedAt || $time->gt(now()->addMinutes(2)) || $time->lt(now()->subDays(7)))) {
            throw ValidationException::withMessages(['captured_at' => 'Capture time must be within the last seven days.']);
        }
        $start = $session->scheduled_start ?? $session->start_time;
        if ($session->status === 'cancelled' || ($start && $time->lt($start))) {
            throw ValidationException::withMessages(['session_id' => 'The session is cancelled or has not started yet.']);
        }
        return $time->copy()->setTimezone(config('app.timezone'));
    }
}
