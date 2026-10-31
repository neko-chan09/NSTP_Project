<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('student_id')->unique();
            $table->string('serial_no')->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_number')->nullable();
            $table->string('course')->nullable();
            $table->integer('year_level')->nullable();
            $table->string('section')->nullable();
            $table->enum('nstp_component_selected', ['cwts', 'rotc', 'lts'])->nullable();
            $table->integer('total_training_hours')->default(0);
            $table->integer('completed_training_hours')->default(0);
            $table->decimal('training_grade', 3, 2)->nullable();
            $table->decimal('training_grade_percentage', 5, 2)->nullable();
            $table->string('training_grade_remarks')->nullable();
            $table->timestamp('grade_updated_at')->nullable();
            $table->boolean('is_eligible_for_completion')->default(false);
            $table->enum('completion_status', ['pending', 'in_progress', 'completed', 'deficient'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('student_id');
            $table->index('completion_status');
            $table->index('training_grade_percentage');
            $table->index('grade_updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};