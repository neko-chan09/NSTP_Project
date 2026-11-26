<?php
namespace App\Http\Controllers\API\Web\Admin;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\{SemesterTraining,AuditTrail};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class AcademicYearController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>AcademicYear::orderByDesc('start_date')->get()]);}
 private function normalize(Request $r):void {
  $semester=['first'=>'1st','second'=>'2nd'][$r->input('semester')]??$r->input('semester');
  if($r->has('semester'))$r->merge(['semester'=>$semester]);
  if(!$r->filled('academic_year')&&$r->filled('start_year')&&$r->filled('end_year'))$r->merge(['academic_year'=>$r->start_year.'-'.$r->end_year]);
 }
 public function store(Request $r,SemesterTraining $service){
  $this->normalize($r);$data=$r->validate(['academic_year'=>'required|string|max:30','semester'=>'required|in:1st,2nd,summer','start_date'=>'required|date','end_date'=>'required|date|after_or_equal:start_date','is_current'=>'sometimes|boolean','is_active'=>'sometimes|boolean']);
  $period=DB::transaction(function()use($data){DB::table('training_period_guard')->where('id',1)->lockForUpdate()->first();if(AcademicYear::where('academic_year',$data['academic_year'])->where('semester',$data['semester'])->exists())throw ValidationException::withMessages(['semester'=>'This academic year and semester already exist.']);return AcademicYear::create(array_merge($data,['is_current'=>false,'is_active'=>$data['is_active']??true]));},3);
  if($data['is_current']??false)$service->activate($period->id);
  return response()->json(['success'=>true,'data'=>$period->fresh()],201);
 }
 public function update(Request $r,int $id,SemesterTraining $service){
  $period=AcademicYear::findOrFail($id);$this->normalize($r);$data=$r->validate(['academic_year'=>'sometimes|string|max:30','semester'=>'sometimes|in:1st,2nd,summer','start_date'=>'sometimes|date','end_date'=>'sometimes|date','is_current'=>'sometimes|boolean','is_active'=>'sometimes|boolean']);
  if(array_intersect(array_keys($data),['academic_year','semester','start_date','end_date']) && DB::table('student_semester_hours')->where('academic_year_id',$id)->exists())throw ValidationException::withMessages(['semester'=>'A semester with training records cannot be relabeled or redated.']);
  $start=\Carbon\Carbon::parse($data['start_date']??$period->start_date);$end=\Carbon\Carbon::parse($data['end_date']??$period->end_date);if($end->lt($start))throw ValidationException::withMessages(['end_date'=>'The end date must follow the start date.']);
  if(isset($data['is_active'])&&!$data['is_active']&&$period->is_current)throw ValidationException::withMessages(['semester'=>'Select another current semester before deactivating this one.']);
  if(array_key_exists('is_current',$data)&&!$data['is_current']&&$period->is_current)throw ValidationException::withMessages(['semester'=>'Select another current semester instead of clearing the current one.']);
  if(AcademicYear::where('academic_year',$data['academic_year']??$period->academic_year)->where('semester',$data['semester']??$period->semester)->where('id','!=',$id)->exists())throw ValidationException::withMessages(['semester'=>'This academic year and semester already exist.']);
  $activate=$data['is_current']??false;unset($data['is_current']);$period->update($data);
  if($activate){$service->activate($id);AuditTrail::record($r->user()->id,'training.semester_selected','academic_year',$id,'Selected current training semester');}
  return response()->json(['success'=>true,'data'=>$period->fresh()]);
 }
 public function destroy(int $id){$period=AcademicYear::findOrFail($id);abort_if($period->is_current||DB::table('student_semester_hours')->where('academic_year_id',$id)->exists()||DB::table('classes')->where('academic_year_id',$id)->exists(),409,'A current semester or a semester linked to records cannot be deleted.');$period->delete();return response()->json(['success'=>true]);}
 public function current(SemesterTraining $service){return response()->json(['success'=>true,'data'=>$service->current()]);}
}
