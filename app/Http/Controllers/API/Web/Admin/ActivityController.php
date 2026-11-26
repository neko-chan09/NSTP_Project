<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityParticipation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Activity::with('creator');

        app(\App\Services\ActivityAudience::class)->forFaculty($query,$user);

        $activities = $query->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'data' => $activities]);
    }

    public function sections(Request $request) {
        return response()->json(['data'=>app(\App\Services\ActivityAudience::class)->sections($request->user())->orderBy('name')->get(['id','name','component_type'])]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'class_id' => 'nullable|integer|exists:classes,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            // ✅ No "all" — component is required
            'component_type' => 'required|in:cwts,rotc,lts',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after:start_datetime',
            'venue' => 'nullable|string|max:255',
            'training_hours' => 'required|integer|min:1',
            'max_participants' => 'nullable|integer|min:0',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geofence_radius' => 'nullable|integer|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $componentType = $request->component_type;

        $target=app(\App\Services\ActivityAudience::class)->target($user,$request->filled('class_id')?(int)$request->class_id:null,$componentType,$user->role==='faculty');

        $activity = Activity::create([
            'class_id' => $target,
            'title' => $request->title,
            'description' => $request->description,
            'component_type' => $componentType,
            'start_datetime' => $request->start_datetime,
            'end_datetime' => $request->end_datetime,
            'venue' => $request->venue,
            'latitude' => $request->filled('latitude') ? (float) $request->latitude : null,
            'longitude' => $request->filled('longitude') ? (float) $request->longitude : null,
            'geofence_radius' => $request->filled('geofence_radius') ? (int) $request->geofence_radius : 100,
            'training_hours' => $request->training_hours,
            'max_participants' => $request->max_participants ?? 0,
            'status' => 'upcoming',
            'created_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activity created successfully',
            'data' => $activity->load('creator')
        ], 201);
    }

    public function show($id)
    {
        $activity = Activity::with('creator')->find($id);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }
        return response()->json(['success' => true, 'data' => $activity]);
    }

    public function update(Request $request, $id)
    {
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $activity->assertEditable();

        $user = $request->user();

        if ($user->role === 'faculty') {
            if ($activity->created_by !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit activities you created'
                ], 403);
            }

        }

        $validator = Validator::make($request->all(), [
            'class_id' => 'nullable|integer|exists:classes,id',
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:upcoming,ongoing,completed,cancelled',
            'description' => 'sometimes|string',
            // ✅ No "all" on update either
            'component_type' => 'sometimes|in:cwts,rotc,lts',
            'start_datetime' => 'sometimes|date',
            'end_datetime' => 'sometimes|date|after:start_datetime',
            'venue' => 'nullable|string',
            'training_hours' => 'sometimes|integer|min:1',
            'max_participants' => 'nullable|integer|min:0',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'geofence_radius' => 'nullable|integer|min:10|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $target=app(\App\Services\ActivityAudience::class)->target($user,$request->has('class_id')?($request->filled('class_id')?(int)$request->class_id:null):$activity->class_id,$request->input('component_type',$activity->component_type),$user->role==='faculty' && $activity->class_id!==null);
        $data = $request->only([
            'title',
            'description',
            'component_type',
            'start_datetime',
            'end_datetime',
            'venue',
            'training_hours',
            'max_participants',
            'status'
        ]);

        $data['class_id']=$target;
        if ($request->has('latitude')) {
            $data['latitude'] = $request->filled('latitude') ? (float) $request->latitude : null;
        }
        if ($request->has('longitude')) {
            $data['longitude'] = $request->filled('longitude') ? (float) $request->longitude : null;
        }
        if ($request->has('geofence_radius')) {
            $data['geofence_radius'] = $request->filled('geofence_radius') ? (int) $request->geofence_radius : 100;
        }

        $activity->update($data);

        return response()->json(['success' => true, 'message' => 'Updated successfully', 'data' => $activity]);
    }

    public function destroy(Request $request, $id)
    {
        $activity = Activity::find($id);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $activity->assertEditable();

        $user = $request->user();

        if ($user->role === 'faculty' && $activity->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete activities you created'
            ], 403);
        }

        $activity->delete();
        return response()->json(['success' => true, 'message' => 'Deleted successfully']);
    }

    public function participants(Request $request, $id)
    {
        $activity = Activity::with(['participations.student.user'])->find($id);

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $user = $request->user();

        if ($user->role === 'faculty' && $activity->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only view participants of activities you created'
            ], 403);
        }

        $participants = $activity->participations->map(function ($participation) {
            $student = $participation->student;
            return [
                'id' => $participation->id,
                'student_id' => $student->student_id ?? null,
                'user' => [
                    'first_name' => $student->user->first_name ?? '',
                    'last_name' => $student->user->last_name ?? '',
                    'email' => $student->user->email ?? '',
                ],
                'course' => $student->course ?? null,
                'year_level' => $student->year_level ?? null,
                'section' => $student->section ?? null,
                'attendance_status' => $participation->attendance_status,
                'hours_earned' => $participation->hours_earned ?? 0,
                'attended_at' => $participation->attended_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $participants
        ]);
    }

    public function updateParticipant(Request $request, $activityId, $participantId)
    {
        $validator = Validator::make($request->all(), [
            'attendance_status' => 'required|in:registered,present,absent,excused',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $activity = Activity::find($activityId);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $activity->assertEditable();

        $user = $request->user();

        if ($user->role === 'faculty' && $activity->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only update participants of activities you created'
            ], 403);
        }

        $participation = ActivityParticipation::where('activity_id', $activityId)
            ->where('id', $participantId)
            ->first();

        if (!$participation) {
            return response()->json(['success' => false, 'message' => 'Participant not found'], 404);
        }

        $participation->update([
            'attendance_status' => $request->attendance_status,
            'attended_at' => $request->attendance_status === 'present' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => $participation
        ]);
    }

    public function removeParticipant(Request $request, $activityId, $participantId)
    {
        $activity = Activity::find($activityId);
        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Activity not found'], 404);
        }

        $activity->assertEditable();

        $user = $request->user();

        if ($user->role === 'faculty' && $activity->created_by !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only remove participants of activities you created'
            ], 403);
        }

        $participation = ActivityParticipation::where('activity_id', $activityId)
            ->where('id', $participantId)
            ->first();

        if (!$participation) {
            return response()->json(['success' => false, 'message' => 'Participant not found'], 404);
        }

        $participation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Participant removed successfully'
        ]);
    }
}
