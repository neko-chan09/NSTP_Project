<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('academic_year');
            $table->index('is_current');
        });

        Schema::create('graduation_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name');
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->date('graduation_date');
            $table->string('venue')->nullable();
            $table->integer('total_students')->default(0);
            $table->enum('status', ['upcoming', 'ongoing', 'completed'])->default('upcoming');
            $table->timestamps();
            $table->index('academic_year');
            $table->index('status');
        });

        Schema::create('year_level_progressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->integer('from_year_level');
            $table->integer('to_year_level');
            $table->string('academic_year');
            $table->enum('status', ['pending', 'approved', 'completed'])->default('pending');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('year_level_progressions');
        Schema::dropIfExists('graduation_batches');
        Schema::dropIfExists('academic_years');
    }
};