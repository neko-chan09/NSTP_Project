<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nstp_component_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->enum('component_type', ['cwts', 'rotc', 'lts']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('component_type');
        });

        Schema::create('component_change_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->enum('from_component', ['cwts', 'rotc', 'lts']);
            $table->enum('to_component', ['cwts', 'rotc', 'lts']);
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_remarks')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });

        Schema::create('training_hours_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('set null');
            $table->integer('hours_earned');
            $table->date('date_logged');
            $table->string('description')->nullable();
            $table->enum('type', ['activity', 'training', 'community_service'])->default('activity');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('student_id');
            $table->index('date_logged');
        });

        Schema::create('eligibility_monitoring', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->boolean('hours_requirement_met')->default(false);
            $table->boolean('documents_requirement_met')->default(false);
            $table->boolean('activities_requirement_met')->default(false);
            $table->boolean('overall_eligible')->default(false);
            $table->date('eligibility_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('checked_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('checked_at')->nullable();
            $table->timestamps();
            $table->unique(['student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eligibility_monitoring');
        Schema::dropIfExists('training_hours_logs');
        Schema::dropIfExists('component_change_requests');
        Schema::dropIfExists('nstp_component_selections');
    }
};