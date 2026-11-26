<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityParticipation;
use Illuminate\Http\Request;
use App\Helpers\NotificationHelper;

class ActivityController extends Controller
{

public function show($id)
{
    $student=auth()->user()->student;
    abort_unless($student,404,'Student profile not found');
    $activity=app(\App\Services\ActivityAudience::class)->forStudent(Activity::with('creator'),$student)->find($id);
    
    if (!$activity) {
        return response()->json(['message' => 'Activity not found'], 404);
    }
    
    // Check if student is registered
    $isRegistered = false;
    if (auth()->user() && auth()->user()->role === 'student') {
        $student = auth()->user()->student;
        if ($student) {
            $isRegistered = ActivityParticipation::where('activity_id', $id)
                ->where('student_id', $student->id)
                ->exists();
        }
    }
    
    $activity->is_registered = $isRegistered;
    
    return response()->json([
        'success' => true,
        'data' => $activity
    ]);
}
    public function studentActivities(Request $request)
    {
        // Status is time-based now, so don't rely on the stored column.
        // Shows upcoming + ongoing (not cancelled, not yet ended).
        $student=$request->user()->student;
        abort_unless($student,404,'Student profile not found');
        $activities=app(\App\Services\ActivityAudience::class)->forStudent(Activity::query(),$student)
            ->whereNotIn('status',['cancelled','completed'])->where('end_datetime','>',now())
            ->orderBy('start_datetime', 'asc')
            ->get();

        $student = $request->user()->student;
        foreach ($activities as $activity) {
            $activity->is_registered = ActivityParticipation::where('activity_id', $activity->id)
                ->where('student_id', $student->id)
                ->exists();
        }

        return response()->json(['success' => true, 'data' => $activities]);
    }

    public function register(Request $request, $id)
{
    $student=$request->user()->student;
    abort_unless($student,404,'Student profile not found');
    $activity=app(\App\Services\ActivityAudience::class)->forStudent(Activity::query(),$student)->find($id);
    if (!$activity) {
        return response()->json(['message' => 'Activity not found'], 404);
    }

    $activity->assertEditable();
    $student = $request->user()->student;
    
    $exists = ActivityParticipation::where('activity_id', $id)
        ->where('student_id', $student->id)
        ->exists();
    
    if ($exists) {
        return response()->json(['message' => 'Already registered'], 400);
    }
    
    $participation = ActivityParticipation::create([
        'activity_id' => $id,
        'student_id' => $student->id,
        'attendance_status' => 'registered',
    ]);

    // --- Add notification ---
    NotificationHelper::sendToStudent(
        $student,
        'Registered for Activity',
        "You are registered for \"{$activity->title}\".",
        'activity',
        ['id' => $activity->id]
    );

    return response()->json([
        'success' => true,
        'message' => 'Registered successfully',
        'data' => $participation
    ]);
}
}