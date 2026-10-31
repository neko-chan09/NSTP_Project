<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code', 64)->unique();
            $table->string('type', 30)->default('student');

            // pending | processing | completed | failed | cancelled
            $table->string('status', 20)->default('pending');

            // Progress counters
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('processed_rows')->default(0);
            $table->unsignedInteger('created_count')->default(0);
            $table->unsignedInteger('updated_count')->default(0);
            $table->unsignedInteger('enrolled_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);

            // Config
            $table->string('mode', 20)->default('upsert');
            $table->string('school_year', 20)->nullable();

            // State
            $table->longText('rows_json')->nullable();
            $table->longText('errors_json')->nullable();
            $table->longText('warnings_json')->nullable();

            // Ownership / metadata
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('original_filename')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_batches');
    }
};