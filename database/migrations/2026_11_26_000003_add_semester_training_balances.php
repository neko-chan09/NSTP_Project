<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\{DB,Schema};
return new class extends Migration {
 public function up():void {
  Schema::table('attendance_logs',function(Blueprint $t){$t->unsignedBigInteger('academic_year_id')->nullable()->index();$t->decimal('approved_hours',12,2)->default(0);});
  Schema::table('students',fn(Blueprint $t)=>$t->unsignedBigInteger('training_academic_year_id')->nullable()->index());
  Schema::create('student_semester_hours',function(Blueprint $t){$t->id();$t->unsignedBigInteger('student_id');$t->unsignedBigInteger('academic_year_id');$t->decimal('manual_hours',14,2)->default(0);$t->decimal('approved_hours',14,2)->default(0);$t->decimal('credited_hours',8,2)->default(0);$t->timestamps();$t->unique(['student_id','academic_year_id']);});
  Schema::create('student_training_legacy',function(Blueprint $t){$t->unsignedBigInteger('student_id')->primary();$t->decimal('original_hours',14,2)->default(0);$t->decimal('unassigned_hours',14,2)->default(0);$t->longText('original_snapshot');$t->timestamp('created_at')->nullable();});
  Schema::create('training_period_guard',fn(Blueprint $t)=>$t->unsignedTinyInteger('id')->primary());DB::table('training_period_guard')->insert(['id'=>1]);
  // Copy original aggregates before projecting semester totals. Do not guess missing semesters.
  DB::table('students')->orderBy('id')->chunkById(200,function($students){foreach($students as $student){$logged=(float)DB::table('attendance_logs')->where('student_id',$student->id)->sum('credited_hours');DB::table('student_training_legacy')->insert(['student_id'=>$student->id,'original_hours'=>$student->completed_training_hours??0,'unassigned_hours'=>max(0,(float)($student->completed_training_hours??0)-$logged),'original_snapshot'=>json_encode($student),'created_at'=>now()]);}});
  DB::table('attendance_logs')->update(['approved_hours'=>DB::raw('credited_hours')]);
  if(Schema::hasColumn('classes','academic_year_id'))DB::table('attendance_logs')->orderBy('id')->chunkById(200,function($logs){foreach($logs as $log){$period=DB::table('attendance_sessions as s')->join('classes as c','c.id','=','s.class_id')->where('s.id',$log->session_id)->value('c.academic_year_id');if($period && DB::table('academic_years')->where('id',$period)->exists())DB::table('attendance_logs')->where('id',$log->id)->update(['academic_year_id'=>$period]);}});
  $service=app(\App\Services\SemesterTraining::class);
  \App\Models\Student::orderBy('id')->chunkById(100,function($students)use($service){foreach($students as $student){DB::transaction(function()use($student,$service){$locked=\App\Models\Student::whereKey($student->id)->lockForUpdate()->first();$periods=DB::table('attendance_logs')->where('student_id',$student->id)->whereNotNull('academic_year_id')->distinct()->pluck('academic_year_id');foreach($periods as $period)$service->rebuild($locked,(int)$period);$service->projectCurrent($locked);});}});
 }
 public function down():void {
  // Restoring aggregates automatically could overwrite attendance accrued after deployment.
  throw new \RuntimeException('Export semester balances and restore a verified backup to reverse this data migration.');
 }
};
