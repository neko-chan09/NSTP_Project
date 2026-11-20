<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('password_reset_otps',fn(Blueprint $t)=>$t->string('otp_hash')->nullable());
        Schema::create('audit_events', function(Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('actor_id')->nullable()->index(); $t->string('event',80)->index();
            $t->string('subject_type',80); $t->unsignedBigInteger('subject_id')->nullable()->index();
            $t->string('reason',500)->nullable(); $t->json('details')->nullable(); $t->timestamp('created_at')->useCurrent();
        });
        Schema::table('students', fn(Blueprint $t)=>$t->decimal('completed_training_hours',8,2)->default(0)->change());
        Schema::table('attendance_logs', function(Blueprint $t) {
            $t->timestamp('check_in_at')->nullable()->change();
            $t->timestamp('check_out_at')->nullable(); $t->string('review_status',30)->default('approved');
            $t->string('attendance_mark',20)->nullable(); $t->decimal('credited_hours',8,2)->default(0);
            $t->unsignedBigInteger('recorded_by')->nullable(); $t->unsignedBigInteger('reviewed_by')->nullable();
        });
        \Illuminate\Support\Facades\DB::table('attendance_logs')->whereIn('status',['present','late'])->update(['credited_hours'=>1]);
    }
    public function down(): void {
        Schema::table('password_reset_otps',fn(Blueprint $t)=>$t->dropColumn('otp_hash'));
        Schema::table('attendance_logs', fn(Blueprint $t) => $t->dropColumn(['check_out_at','review_status','attendance_mark','credited_hours','recorded_by','reviewed_by']));
        Schema::dropIfExists('audit_events');
    }
};
