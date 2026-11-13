<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $table) {
            $table->string('reset_token_hash', 64)->nullable();
            $table->timestamp('reset_expires_at')->nullable();
            $table->unsignedTinyInteger('otp_attempts')->default(0);
        });
    }
    public function down(): void
    {
        Schema::table('password_reset_otps', fn(Blueprint $table) => $table->dropColumn(['reset_token_hash', 'reset_expires_at', 'otp_attempts']));
    }
};
