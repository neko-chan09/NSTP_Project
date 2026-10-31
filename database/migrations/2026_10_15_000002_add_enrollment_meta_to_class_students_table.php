<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_students', function (Blueprint $table) {
            // Track which school_year this enrollment belongs to
            if (!Schema::hasColumn('class_students', 'school_year')) {
                $table->string('school_year', 20)->nullable()->after('joined_at');
            }
            if (!Schema::hasColumn('class_students', 'academic_year_id')) {
                $table->foreignId('academic_year_id')
                    ->nullable()
                    ->after('school_year')
                    ->constrained('academic_years')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('class_students', function (Blueprint $table) {
            if (Schema::hasColumn('class_students', 'academic_year_id')) {
                $table->dropForeign(['academic_year_id']);
                $table->dropColumn('academic_year_id');
            }
            if (Schema::hasColumn('class_students', 'school_year')) {
                $table->dropColumn('school_year');
            }
        });
    }
};