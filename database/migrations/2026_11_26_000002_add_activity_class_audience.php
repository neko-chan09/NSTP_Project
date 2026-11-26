<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {Schema::table('activities',fn(Blueprint $t)=>$t->unsignedBigInteger('class_id')->nullable()->index());}
 public function down():void {Schema::table('activities',fn(Blueprint $t)=>$t->dropColumn('class_id'));}
};
