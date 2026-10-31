<?php

namespace App\Http\Controllers\API\Mobile\Faculty;

use App\Http\Controllers\Controller;
use App\Models\BulletinBoard;   // <-- critical: correct namespace
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    /**
     * List announcements created by this faculty (for management)
     */
    public function index(Request $request)
{
    try {
        $faculty = $request->user();
        $announcements = BulletinBoard::where('created_by', $faculty->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $announcements]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function store(Request $request)
{
    try {
        $faculty = $request->user();
        if (!$faculty || $faculty->role !== 'faculty') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $component = $faculty->nstp_component;

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'target_audience' => 'nullable|in:all,students,faculty,cwts,rotc,lts',
            'display_from' => 'nullable|date',
            'display_until' => 'nullable|date|after:display_from',
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $targetAudience = $request->input('target_audience', $component ?? 'all');
        if (!in_array($targetAudience, ['all', 'students', 'faculty', $component])) {
            return response()->json(['message' => 'Invalid target audience for your component'], 403);
        }

        $announcement = BulletinBoard::create([
            'title' => $request->title,
            'content' => $request->content,
            'category' => 'general',
            'target_audience' => $targetAudience,
            'display_from' => $request->input('display_from', now()),
            'display_until' => $request->input('display_until'),
            'is_featured' => $request->input('is_featured', false),
            'created_by' => $faculty->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Announcement posted',
            'data' => $announcement
        ], 201);

    } catch (\Exception $e) {
        // Log the error for your reference
        \Log::error('Faculty announcement store error: ' . $e->getMessage());

        // Return the actual error message to the frontend
        return response()->json([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString() // optional, for debugging
        ], 500);
    }
}

    /**
     * Update an announcement (only if created by this faculty)
     */
    public function update(Request $request, $id)
    {
        $faculty = $request->user();
        $announcement = BulletinBoard::where('id', $id)
            ->where('created_by', $faculty->id)
            ->first();

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found or not yours'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'target_audience' => 'nullable|in:all,students,faculty,cwts,rotc,lts',
            'display_from' => 'nullable|date',
            'display_until' => 'nullable|date|after:display_from',
            'is_featured' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Enforce component restriction
        $targetAudience = $request->input('target_audience');
        if ($targetAudience && !in_array($targetAudience, ['all', 'students', 'faculty', $faculty->nstp_component])) {
            return response()->json(['message' => 'Invalid target audience for your component'], 403);
        }

        $announcement->update($request->only(['title', 'content', 'target_audience', 'display_from', 'display_until', 'is_featured']));

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated',
            'data' => $announcement->fresh()
        ]);
    }

    /**
     * Delete an announcement
     */
    public function destroy(Request $request, $id)
    {
        $faculty = $request->user();
        $announcement = BulletinBoard::where('id', $id)
            ->where('created_by', $faculty->id)
            ->first();

        if (!$announcement) {
            return response()->json(['message' => 'Announcement not found or not yours'], 404);
        }

        $announcement->delete();

        return response()->json(['success' => true, 'message' => 'Announcement deleted']);
    }
}