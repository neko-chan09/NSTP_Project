<?php
// app/Models/ComponentChangeRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComponentChangeRequest extends Model
{

protected $table = 'component_change_requests';
    protected $fillable = [
        'student_id',
        'from_component',
        'to_component',
        'reason',
        'status',
        'admin_remarks',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Helper methods
    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }
}