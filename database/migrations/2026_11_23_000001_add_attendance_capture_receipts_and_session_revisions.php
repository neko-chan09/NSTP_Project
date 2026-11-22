<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::table('attendance_sessions',fn(Blueprint $t)=>$t->unsignedInteger('rules_version')->default(1));
  Schema::create('attendance_session_revisions',function(Blueprint $t){$t->id();$t->unsignedBigInteger('session_id');$t->unsignedInteger('version');$t->json('rules');$t->unique(['session_id','version']);$t->timestamp('created_at')->useCurrent();});
  Schema::table('attendance_logs',function(Blueprint $t){foreach(['time_in','time_out'] as $event){$t->timestamp($event.'_received_at')->nullable();$t->unsignedInteger($event.'_session_version')->nullable();$t->string($event.'_client_id',100)->nullable();}});
 }
 public function down():void {Schema::table('attendance_logs',function(Blueprint $t){foreach(['time_in','time_out'] as $e)$t->dropColumn([$e.'_received_at',$e.'_session_version',$e.'_client_id']);});Schema::dropIfExists('attendance_session_revisions');Schema::table('attendance_sessions',fn(Blueprint $t)=>$t->dropColumn('rules_version'));}
};
