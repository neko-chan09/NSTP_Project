<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            // Per-section class code (e.g. CLS-000031). Distinct from join_code.
            $table->string('class_code', 50)->nullable()->unique()->after('join_code');

            // School year string (e.g. "2025-2026")
            $table->string('school_year', 20)->nullable()->after('class_code');

            // Optional link to academic_years table
            $table->foreignId('academic_year_id')
                ->nullable()
                ->after('school_year')
                ->constrained('academic_years')
                ->nullOnDelete();

            $table->index('school_year');
            $table->index('academic_year_id');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['class_code', 'school_year', 'academic_year_id']);
        });
    }
};