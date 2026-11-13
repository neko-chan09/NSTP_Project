<?php
namespace App\Services;

use App\Models\AttendanceSession;
use App\Models\ClassGroup;
use App\Models\User;

class AttendanceAccess
{
    public function class(User $user, int $classId, bool $manage = false): ClassGroup
    {
        $class = ClassGroup::findOrFail($classId);
        if (in_array($user->role, ['admin', 'super_admin'], true)) return $class;
        if ($user->role === 'faculty' && (int) $class->teacher_id === (int) $user->id) return $class;
        if (!$manage && $user->role === 'student' && $user->student && $class->students()->where('students.id', $user->student->id)->exists()) return $class;
        abort(403, 'This attendance class is not assigned to your account.');
    }

    public function session(User $user, int $id, bool $manage = false): AttendanceSession
    {
        $session = AttendanceSession::findOrFail($id);
        if (in_array($user->role, ['admin', 'super_admin'], true)) return $session;
        if ($user->role === 'faculty' && (int) $session->faculty_id === (int) $user->id) return $session;
        $this->class($user, (int) $session->class_id, $manage);
        return $session;
    }
}
