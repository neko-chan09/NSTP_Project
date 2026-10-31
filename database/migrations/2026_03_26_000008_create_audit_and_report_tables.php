<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action');
            $table->string('module');
            $table->text('description');
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('action');
            $table->index('module');
        });

        Schema::create('admin_action_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('action_type');
            $table->string('module');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
            $table->index('admin_id');
            $table->index('action_type');
            $table->index('module');
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_name');
            $table->enum('report_type', ['compliance', 'deficiency', 'certificate', 'attendance', 'summary']);
            $table->json('filters')->nullable();
            $table->string('file_path')->nullable();
            $table->enum('status', ['pending', 'generating', 'completed', 'failed'])->default('pending');
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->index('report_type');
            $table->index('status');
        });

        Schema::create('sis_integration', function (Blueprint $table) {
            $table->id();
            $table->string('sis_student_id')->unique();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->json('sis_data')->nullable();
            $table->dateTime('last_sync_at')->nullable();
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('pending');
            $table->text('sync_error')->nullable();
            $table->timestamps();
            $table->index('sis_student_id');
            $table->index('sync_status');
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index('key');
        });

        Schema::create('system_backups', function (Blueprint $table) {
            $table->id();
            $table->string('backup_name');
            $table->string('file_path');
            $table->string('disk')->default('local');
            $table->integer('file_size')->nullable();
            $table->enum('type', ['auto', 'manual'])->default('manual');
            $table->integer('tables_count')->nullable();
            $table->integer('storage_files_count')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_backups');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('sis_integration');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('admin_action_logs');
        Schema::dropIfExists('activity_logs');
    }
};