<?php
// app/Models/Student.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_id',
        'serial_no',
        'birth_date',
        'gender',
        'address',
        'emergency_contact_name',
        'emergency_contact_number',
        'course',
        'year_level',
        'section',
        'nstp_component_selected',
        'total_training_hours',
        'completed_training_hours',
        'is_eligible_for_completion',
        'completion_status',
        'completed_at',
        // Grade fields
        'training_grade',
        'training_grade_percentage',
        'training_grade_remarks',
        'grade_updated_at',
    ];

    protected $casts = [
        'is_eligible_for_completion' => 'boolean',
        'total_training_hours' => 'integer',
        'completed_training_hours' => 'integer',
        'birth_date' => 'date',
        'completed_at' => 'datetime',
        'training_grade' => 'float',
        'training_grade_percentage' => 'float',
        'grade_updated_at' => 'datetime',
        'serial_no' => 'string',
    ];

    // ============================================================
    // GRADE SYSTEM METHODS
    // ============================================================

    /**
     * Calculate training grade based on completed hours
     */
    public function calculateTrainingGrade(): array
    {
        $required = $this->total_training_hours ?? 90;
        $completed = $this->completed_training_hours ?? 0;

        // Calculate percentage
        $percentage = $required > 0 ? round(($completed / $required) * 100, 2) : 0;

        // Determine grade based on percentage
        $grade = $this->getGradeFromPercentage($percentage);

        return [
            'percentage' => $percentage,
            'grade' => $grade['grade'],
            'grade_label' => $grade['label'],
            'grade_description' => $grade['description'],
            'is_passing' => $percentage >= 60,
            'is_excellent' => $percentage >= 90,
            'is_good' => $percentage >= 75,
        ];
    }

    /**
     * Get grade based on percentage
     */
    public function getGradeFromPercentage(float $percentage): array
    {
        $grades = $this->getGradeScale();

        foreach ($grades as $grade) {
            if ($percentage >= $grade['threshold']) {
                return $grade;
            }
        }

        return [
            'grade' => 5.0,
            'label' => 'F',
            'threshold' => 0,
            'description' => 'Failed',
        ];
    }

    /**
     * Get grade scale configuration
     */
    public function getGradeScale(): array
    {
        return [
            ['grade' => 1.0, 'label' => 'A+', 'threshold' => 96, 'description' => 'Excellent'],
            ['grade' => 1.25, 'label' => 'A', 'threshold' => 91, 'description' => 'Superior'],
            ['grade' => 1.5, 'label' => 'A-', 'threshold' => 88, 'description' => 'Very Good'],
            ['grade' => 1.75, 'label' => 'B+', 'threshold' => 84, 'description' => 'Good'],
            ['grade' => 2.0, 'label' => 'B', 'threshold' => 80, 'description' => 'Satisfactory'],
            ['grade' => 2.25, 'label' => 'B-', 'threshold' => 76, 'description' => 'Fairly Satisfactory'],
            ['grade' => 2.5, 'label' => 'C+', 'threshold' => 72, 'description' => 'Fair'],
            ['grade' => 2.75, 'label' => 'C', 'threshold' => 68, 'description' => 'Passing'],
            ['grade' => 3.0, 'label' => 'C-', 'threshold' => 64, 'description' => 'Minimal Passing'],
            ['grade' => 3.5, 'label' => 'D+', 'threshold' => 60, 'description' => 'Low Passing'],
            ['grade' => 4.0, 'label' => 'D', 'threshold' => 55, 'description' => 'Deficient'],
            ['grade' => 5.0, 'label' => 'F', 'threshold' => 0, 'description' => 'Failed'],
        ];
    }

    /**
     * Update training grade
     */
    public function updateTrainingGrade(): void
    {
        $gradeData = $this->calculateTrainingGrade();

        $this->update([
            'training_grade' => $gradeData['grade'],
            'training_grade_percentage' => $gradeData['percentage'],
            'training_grade_remarks' => $gradeData['grade_description'],
            'grade_updated_at' => now(),
            'is_eligible_for_completion' => $gradeData['is_passing'],
            'completion_status' => $this->determineCompletionStatus($gradeData),
        ]);
    }

    /**
     * Determine completion status based on grade
     */
    private function determineCompletionStatus(array $gradeData): string
    {
        if ($gradeData['is_excellent']) {
            return 'completed';
        }

        if ($gradeData['is_passing']) {
            return 'in_progress';
        }

        return 'deficient';
    }

    // ============================================================
    // GRADE ACCESSORS
    // ============================================================

    /**
     * Get grade display
     */
    public function getGradeDisplayAttribute(): string
    {
        if ($this->training_grade === null) {
            return 'Not Graded';
        }

        $scale = $this->getGradeScale();
        foreach ($scale as $grade) {
            if ($grade['grade'] == $this->training_grade) {
                return $grade['label'] . ' (' . $this->training_grade . ')';
            }
        }

        return $this->training_grade . ' (No Label)';
    }

    /**
     * Get grade color for UI
     */
    public function getGradeColorAttribute(): string
    {
        $percentage = $this->training_grade_percentage ?? 0;

        if ($percentage >= 90) return 'green';
        if ($percentage >= 75) return 'blue';
        if ($percentage >= 60) return 'yellow';
        return 'red';
    }

    /**
     * Check if student passed
     */
    public function getHasPassedAttribute(): bool
    {
        return ($this->training_grade_percentage ?? 0) >= 60;
    }

    /**
     * Get grade label
     */
    public function getGradeLabelAttribute(): string
    {
        if ($this->training_grade === null) {
            return 'N/A';
        }

        $scale = $this->getGradeScale();
        foreach ($scale as $grade) {
            if ($grade['grade'] == $this->training_grade) {
                return $grade['label'];
            }
        }
        return (string) $this->training_grade;
    }

    // ============================================================
    // GRADE SCOPES
    // ============================================================

    /**
     * Scope to get students with passing grades
     */
    public function scopePassing($query)
    {
        return $query->where('training_grade_percentage', '>=', 60);
    }

    /**
     * Scope to get students with excellent grades
     */
    public function scopeExcellent($query)
    {
        return $query->where('training_grade_percentage', '>=', 90);
    }

    /**
     * Scope to get students with good grades
     */
    public function scopeGood($query)
    {
        return $query->whereBetween('training_grade_percentage', [75, 89]);
    }

    /**
     * Scope to get students with satisfactory grades
     */
    public function scopeSatisfactory($query)
    {
        return $query->whereBetween('training_grade_percentage', [60, 74]);
    }

    public function faceEmbeddings()
    {
        return $this->hasMany(\App\Models\FaceEmbedding::class);
    }

    /**
     * Scope to get students with failing grades
     */
    public function scopeFailing($query)
    {
        return $query->where('training_grade_percentage', '<', 60)
            ->whereNotNull('training_grade_percentage');
    }

    /**
     * Scope to get students without grades
     */
    public function scopeUngraded($query)
    {
        return $query->whereNull('training_grade_percentage');
    }

    // ============================================================
    // EXISTING RELATIONSHIPS
    // ============================================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function activityParticipations()
    {
        return $this->hasMany(ActivityParticipation::class);
    }

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class);
    }

    public function trainingHoursLogs()
    {
        return $this->hasMany(TrainingHoursLog::class);
    }

    public function classes()
    {
        return $this->belongsToMany(ClassGroup::class, 'class_students', 'student_id', 'class_id')
            ->withPivot('joined_at', 'status')
            ->withTimestamps();
    }

    /**
     * Get student's full name
     */
    public function getFullNameAttribute()
    {
        return $this->user->full_name ?? 'Unknown';
    }

    /**
     * Get student's email
     */
    public function getEmailAttribute()
    {
        return $this->user->email ?? null;
    }

    /**
     * Get student's profile photo
     */
    public function getProfilePhotoAttribute()
    {
        return $this->user->profile_photo_url ?? null;
    }

    /**
     * Check if student is eligible
     */
    public function isEligible()
    {
        return $this->is_eligible_for_completion;
    }

    /**
     * Get completion percentage
     */
    public function getCompletionPercentageAttribute()
    {
        if ($this->total_training_hours > 0) {
            return round(($this->completed_training_hours / $this->total_training_hours) * 100, 2);
        }
        return 0;
    }
}
