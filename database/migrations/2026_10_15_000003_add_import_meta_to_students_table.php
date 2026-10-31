<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'imported_at')) {
                $table->timestamp('imported_at')->nullable()->after('completed_at');
            }
            if (!Schema::hasColumn('students', 'import_batch')) {
                $table->string('import_batch', 50)->nullable()->after('imported_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'must_change_password')) {
                $table->boolean('must_change_password')->default(false)->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'import_batch')) {
                $table->dropColumn('import_batch');
            }
            if (Schema::hasColumn('students', 'imported_at')) {
                $table->dropColumn('imported_at');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'must_change_password')) {
                $table->dropColumn('must_change_password');
            }
        });
    }
};