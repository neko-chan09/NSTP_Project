<?php

namespace App\Http\Controllers\API\Mobile\Student;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data'   => $notifications->items(),
            'unread_count' => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
            'meta'   => [
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
                'total'        => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead($id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        if (!$notification->is_read) {
            $notification->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Notification marked as read',
        ]);
    }

    public function markAllAsRead()
    {
        $user = Auth::user();
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'All notifications marked as read',
        ]);
    }

    public function unreadCount()
    {
        $user = Auth::user();
        $count = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'status' => 'success',
            'unread_count' => $count,
        ]);
    }

    public function markAsUnread($id)
    {
        $user = Auth::user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Notification marked as unread',
        ]);
    }
}