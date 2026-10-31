<?php

namespace App\Helpers;

use App\Models\Notification;
use App\Models\Student;

class NotificationHelper
{
    /**
     * Send a notification to a student.
     *
     * @param Student $student
     * @param string $title
     * @param string $message
     * @param string $type       e.g. 'document', 'activity', 'certificate', 'announcement'
     * @param array  $data       ['type' => 'document', 'id' => 123]
     */
    public static function sendToStudent($student, $title, $message, $type, $data = [])
    {
        // Ensure we store the type in data for frontend navigation
        $data['type'] = $type;

        return Notification::create([
            'user_id' => $student->user_id,
            'title'   => $title,
            'message' => $message,
            'type'    => $type,
            'data'    => $data,
            'is_read' => false,
        ]);
    }
}