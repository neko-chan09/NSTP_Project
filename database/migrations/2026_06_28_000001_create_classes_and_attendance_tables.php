<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('component_type', ['cwts', 'rotc', 'lts', 'all'])->default('all');
            $table->string('join_code');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamps();
            $table->index('join_code');
        });

        Schema::create('class_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();
            $table->enum('status', ['active', 'removed'])->default('active');
            $table->timestamps();
            $table->unique(['class_id', 'student_id']);
        });

        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('faculty_id')->nullable();
            $table->foreign('faculty_id')->references('id')->on('users')->onDelete('set null');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->string('component')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamp('scheduled_start')->nullable();
            $table->timestamp('scheduled_end')->nullable();
            $table->integer('grace_period_minutes')->default(15);
            $table->boolean('is_scheduled')->default(false);
            $table->time('session_time')->nullable();
            $table->string('day_of_week')->nullable();
            $table->boolean('require_location')->default(false);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('geofence_radius')->default(100);
            $table->enum('status', ['active', 'closed', 'cancelled'])->default('active');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('component');
            $table->index('start_time');
            $table->index('scheduled_start');
            $table->index('scheduled_end');
            $table->index('faculty_id');
            $table->index('class_id');
            $table->index('is_scheduled');
            $table->index('require_location');
            $table->index(['latitude', 'longitude']);
        });

        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('student_id');
            $table->timestamp('check_in_at')->useCurrent();
            $table->enum('status', ['present', 'late', 'absent'])->default('present');
            $table->float('face_confidence')->nullable();
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            $table->integer('minutes_late')->default(0)->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->foreign('session_id')->references('id')->on('attendance_sessions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->index('session_id');
            $table->index('student_id');
            $table->index('status');
            $table->index('check_in_at');
            $table->unique(['session_id', 'student_id']);
        });

        Schema::create('learning_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type')->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->string('topic')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('face_embeddings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->enum('pose', ['front', 'left', 'right']);
            $table->longText('embedding');
            $table->float('confidence')->default(1.0);
            $table->timestamps();
            $table->unique(['student_id', 'pose']);
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('face_embeddings');
        Schema::dropIfExists('learning_materials');
        Schema::dropIfExists('attendance_logs');
        Schema::dropIfExists('attendance_sessions');
        Schema::dropIfExists('class_students');
        Schema::dropIfExists('classes');
    }
};