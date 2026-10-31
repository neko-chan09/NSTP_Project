<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ------------------------------------------------------------
        // Extend existing system_backups with schedule metadata
        // ------------------------------------------------------------
        Schema::table('system_backups', function (Blueprint $table) {
            if (!Schema::hasColumn('system_backups', 'triggered_by')) {
                $table->string('triggered_by', 20)
                    ->default('manual')  // manual | scheduled | auto
                    ->after('type');
            }
            if (!Schema::hasColumn('system_backups', 'schedule_id')) {
                $table->unsignedBigInteger('schedule_id')->nullable()->after('triggered_by');
                $table->index('schedule_id');
            }
        });

        // ------------------------------------------------------------
        // New backup_schedules table
        // ------------------------------------------------------------
        Schema::create('backup_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('notes')->nullable();

            // Frequency: daily | weekly | monthly | custom
            $table->string('frequency', 20)->default('daily');

            // Time of day (HH:MM, 24h). Used by daily/weekly/monthly.
            $table->string('time', 5)->default('02:00');

            // Weekly: 0=Sun..6=Sat (Carbon::SUNDAY..SATURDAY)
            $table->unsignedTinyInteger('day_of_week')->nullable();

            // Monthly: 1..28
            $table->unsignedTinyInteger('day_of_month')->nullable();

            // Custom cron (optional). If set, frequency is ignored.
            $table->string('cron_expression', 120)->nullable();

            // Auto-delete backups older than N days. Null = keep forever.
            $table->unsignedInteger('retention_days')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamp('next_run_at')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('is_active');
            $table->index('next_run_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_schedules');

        Schema::table('system_backups', function (Blueprint $table) {
            if (Schema::hasColumn('system_backups', 'schedule_id')) {
                $table->dropIndex(['schedule_id']);
                $table->dropColumn('schedule_id');
            }
            if (Schema::hasColumn('system_backups', 'triggered_by')) {
                $table->dropColumn('triggered_by');
            }
        });
    }
};