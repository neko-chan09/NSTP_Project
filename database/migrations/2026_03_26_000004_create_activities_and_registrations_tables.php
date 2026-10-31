<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('component_type', ['cwts', 'rotc', 'lts', 'all'])->default('all');
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->string('venue')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('geofence_radius')->default(100);
            $table->integer('training_hours')->default(0);
            $table->integer('max_participants')->nullable();
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled'])->default('upcoming');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->index('component_type');
            $table->index('status');
        });

        Schema::create('activity_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->dateTime('registration_date');
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'waitlisted'])->default('pending');
            $table->text('cancellation_reason')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();
            $table->unique(['activity_id', 'student_id']);
            $table->index('status');
        });

        Schema::create('activity_participations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('attendance_status', 50)->default('pending_verification');
            $table->integer('hours_earned')->default(0);
            $table->text('feedback')->nullable();
            $table->timestamp('attended_at')->nullable();
            $table->timestamp('check_in_at')->nullable();
            $table->decimal('checkin_latitude', 10, 8)->nullable();
            $table->decimal('checkin_longitude', 11, 8)->nullable();
            $table->boolean('is_within_geofence')->default(false);
            $table->decimal('distance_from_venue', 10, 2)->nullable();
            $table->boolean('is_tracking_location')->default(false);
            $table->timestamp('tracking_started_at')->nullable();
            $table->timestamp('tracking_ended_at')->nullable();
            $table->string('face_image_path')->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->timestamps();
            $table->unique(['activity_id', 'student_id']);
            $table->index('attendance_status');
        });

        Schema::create('activity_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->integer('rating')->unsigned();
            $table->text('comment')->nullable();
            $table->text('suggestions')->nullable();
            $table->timestamps();
            $table->unique(['activity_id', 'student_id']);
        });

        Schema::create('student_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('set null');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->decimal('accuracy', 10, 2)->nullable();
            $table->decimal('distance_from_venue', 10, 2)->nullable();
            $table->boolean('is_within_geofence')->default(false);
            $table->string('location_source')->default('gps');
            $table->timestamp('tracked_at');
            $table->timestamps();
            $table->index(['student_id', 'activity_id']);
            $table->index('tracked_at');
            $table->index('is_within_geofence');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_locations');
        Schema::dropIfExists('activity_feedback');
        Schema::dropIfExists('activity_participations');
        Schema::dropIfExists('activity_registrations');
        Schema::dropIfExists('activities');
    }
};