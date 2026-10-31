<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->enum('target_audience', ['all', 'students', 'faculty', 'cwts', 'rotc', 'lts', 'admin'])->default('all');
            $table->boolean('is_urgent')->default(false);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index('status');
            $table->index('target_audience');
        });

        Schema::create('bulletin_board', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('category')->default('general');
            $table->enum('target_audience', ['all', 'students', 'faculty', 'cwts', 'rotc', 'lts'])->default('all');
            $table->string('image_path')->nullable();
            $table->dateTime('display_from');
            $table->dateTime('display_until')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->integer('views')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->index('category');
            $table->index('is_featured');
            $table->index('display_from');
        });

        Schema::create('communication_dashboard', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('type')->default('announcement');
            $table->string('priority')->default('normal');
            $table->string('file_path')->nullable();
            $table->dateTime('display_from')->nullable();
            $table->dateTime('display_until')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->index('priority');
            $table->index('is_visible');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('announcement');
            $table->json('data')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('communication_dashboard');
        Schema::dropIfExists('bulletin_board');
        Schema::dropIfExists('memos');
    }
};