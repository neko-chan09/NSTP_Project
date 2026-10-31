<?php
// app/Models/AcademicYear.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'academic_year',
        'semester',
        'start_date',
        'end_date',
        'is_current',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_current' => 'boolean',
        'is_active'  => 'boolean',
    ];

    /**
     * Find or create an academic year by its "YYYY-YYYY" label.
     * Used during CSV imports.
     */
    public static function findOrCreateByLabel(string $label, string $semester = '1st'): self
    {
        $label = trim($label);

        $existing = self::where('academic_year', $label)->first();
        if ($existing) {
            return $existing;
        }

        // Derive start/end dates from "2025-2026" style
        $startYear = (int) substr($label, 0, 4);
        $endYear   = (int) substr($label, 5, 4) ?: $startYear + 1;

        return self::create([
            'academic_year' => $label,
            'semester'      => $semester,
            'start_date'    => "{$startYear}-08-01",
            'end_date'      => "{$endYear}-07-31",
            'is_current'    => false,
            'is_active'     => true,
        ]);
    }
}