<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('document_type');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->boolean('ocr_processed')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('document_type');
        });

        Schema::create('ocr_texts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->longText('extracted_text');
            $table->float('confidence')->default(0);
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->string('document_type')->default('student');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->index('document_id');
            $table->index('document_type');
            $table->index('created_at');
        });

        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['completion', 'participation', 'training']);
            $table->text('html_content');
            $table->text('css_styles')->nullable();
            $table->string('background_image')->nullable();
            $table->json('placeholders')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->index('type');
            $table->index('is_active');
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->string('certificate_number')->unique();
            $table->enum('certificate_type', ['completion', 'participation', 'training']);
            $table->foreignId('activity_id')->nullable()->constrained('activities')->onDelete('set null');
            $table->string('file_path');
            $table->string('qr_code_path')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'issued', 'revoked'])->default('draft');
            $table->foreignId('issued_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('issued_at')->nullable();
            $table->timestamps();
            $table->index('certificate_number');
            $table->index('status');
        });

        Schema::create('batch_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('batch_name');
            $table->string('school_year');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->enum('certificate_type', ['completion', 'participation']);
            $table->integer('total_students');
            $table->integer('generated_count')->default(0);
            $table->string('file_path')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
            $table->index('school_year');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_certificates');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('certificate_templates');
        Schema::dropIfExists('ocr_texts');
        Schema::dropIfExists('documents');
    }
};