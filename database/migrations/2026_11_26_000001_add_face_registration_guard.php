<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\{DB,Schema};
return new class extends Migration {
    public function up():void {
        Schema::create('face_registration_guards',function(Blueprint $t){$t->unsignedTinyInteger('id')->primary();});
        DB::table('face_registration_guards')->insert(['id'=>1]);
    }
    public function down():void {Schema::dropIfExists('face_registration_guards');}
};
