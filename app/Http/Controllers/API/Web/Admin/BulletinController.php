<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BulletinController extends Controller
{

public function show($id)
{
    $bulletin = DB::table('bulletin_board')
        ->where('id', $id)
        ->first();
    
    if (!$bulletin) {
        return response()->json([
            'success' => false,
            'message' => 'Bulletin not found'
        ], 404);
    }
    
    // Increment views
    DB::table('bulletin_board')
        ->where('id', $id)
        ->increment('views');
    
    // Get user who created it
    $user = DB::table('users')
        ->where('id', $bulletin->created_by)
        ->first();
    
    $bulletin->user = $user;
    
    return response()->json([
        'success' => true,
        'data' => $bulletin
    ]);
}
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DB::table('bulletin_board');

        // ── Dashboard date filter ──
        $date = $request->get('date');
        if ($date) {
            $query->whereDate('display_from', $date);
        } else {
            // Original logic: only show bulletins active now
            $query->where('display_from', '<=', now())
                  ->where(function ($q) {
                      $q->whereNull('display_until')
                        ->orWhere('display_until', '>=', now());
                  });
        }

        // Target audience filter based on user role
        if (in_array($user->role, ['admin', 'super_admin'])) {
            // Admin sees all
        } elseif ($user->role === 'student') {
            $component = $user->student?->nstp_component_selected;
            $query->where(function ($q) use ($component) {
                $q->where('target_audience', 'all')
                  ->orWhere('target_audience', 'students');
                if ($component) {
                    $q->orWhere('target_audience', $component);
                }
            });
        } elseif ($user->role === 'faculty') {
            $query->where(function ($q) {
                $q->where('target_audience', 'all')
                  ->orWhere('target_audience', 'faculty');
            });
        } else {
            $query->where('target_audience', 'all');
        }

        $bulletins = $query->orderBy('is_featured', 'desc')
                           ->orderBy('created_at', 'desc')
                           ->get();

        return response()->json([
            'success' => true,
            'data' => $bulletins,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'content' => 'required|string',
            'target_audience' => 'nullable|in:all,students,faculty,cwts,rotc,lts',
            'category' => 'nullable|string',
            'display_from' => 'nullable|date',
            'display_until' => 'nullable|date|after:display_from',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $id = DB::table('bulletin_board')->insertGetId([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category ?: 'general',
            'target_audience' => $request->target_audience ?: 'all',
            'display_from' => $request->display_from ?: now(),
            'display_until' => $request->display_until,
            'is_featured' => (bool) $request->is_featured,
            'views' => 0,
            'created_by' => $request->user()->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('bulletin_board')->find($id),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $post = DB::table('bulletin_board')->find($id);
        if (!$post) {
            return response()->json(['message' => 'Post not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string',
            'content' => 'required|string',
            'target_audience' => 'nullable|in:all,students,faculty,cwts,rotc,lts',
            'category' => 'nullable|string',
            'display_from' => 'nullable|date',
            'display_until' => 'nullable|date|after:display_from',
            'is_featured' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::table('bulletin_board')->where('id', $id)->update([
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category ?: 'general',
            'target_audience' => $request->target_audience ?: 'all',
            'display_from' => $request->display_from ?: now(),
            'display_until' => $request->display_until,
            'is_featured' => (bool) $request->is_featured,
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => DB::table('bulletin_board')->find($id),
        ]);
    }

    public function destroy($id)
    {
        DB::table('bulletin_board')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }
}