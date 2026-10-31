<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\BulletinBoard;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $student = $user->student;
        $studentComponent = $student->nstp_component_selected; // 'cwts', 'rotc', 'lts', or null

        // Fetch announcements that target 'all', 'students', or the student's component
        $announcements = BulletinBoard::where(function ($query) use ($studentComponent) {
            $query->where('target_audience', 'all')
                ->orWhere('target_audience', 'students')
                ->orWhere('target_audience', $studentComponent);
        })
        ->where(function ($query) {
            // Only show if display_from <= now and (display_until is null or >= now)
            $query->where('display_from', '<=', now())
                ->where(function ($sub) {
                    $sub->whereNull('display_until')
                        ->orWhere('display_until', '>=', now());
                });
        })
        ->orderBy('is_featured', 'desc')
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json(['success' => true, 'data' => $announcements]);
    }
}