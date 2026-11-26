<?php
namespace App\Services;
use App\Models\{Activity,ClassGroup,Student,User};
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;
class ActivityAudience {
 public function sections(User $user):Builder {
  $q=ClassGroup::where('status','active')->whereIn('component_type',['cwts','rotc','lts']);
  if($user->role==='faculty')$q->where('teacher_id',$user->id);
  return $q;
 }
 public function target(User $user,?int $id,string $component,bool $required=false):?int {
  if(!$id){
   if($required)throw ValidationException::withMessages(['class_id'=>'Select an assigned class section for this activity.']);
   if($user->role==='faculty')abort_unless($component===$user->nstp_component,403,'Select a class assigned to you for this component.');
   return null;
  }
  $class=$this->sections($user)->find($id);
  abort_unless($class,403,'This section is not active or assigned to your account.');
  if($class->component_type!==$component)throw ValidationException::withMessages(['component_type'=>'The component must match the selected class section.']);
  return $class->id;
 }
 public function forStudent(Builder $q,Student $student):Builder {
  $classes=$student->classes()->wherePivot('status','active')->pluck('classes.id');
  $components=$student->classes()->wherePivot('status','active')->pluck('classes.component_type')->filter(fn($v)=>in_array($v,['cwts','rotc','lts']))->all();
  $selected=$student->nstp_component_selected ?: $student->user?->nstp_component;
  if(in_array($selected,['cwts','rotc','lts']))$components[]=$selected;
  return $q->where(function($q)use($classes,$components){
   $q->whereIn('class_id',$classes)->orWhere(function($q)use($components){$q->whereNull('class_id')->where(fn($q)=>$q->where('component_type','all')->orWhereIn('component_type',array_unique($components)));});
  });
 }
 public function forFaculty(Builder $q,User $user):Builder {
  if($user->role!=='faculty')return $q;
  return $q->where(function($q)use($user){$q->where('created_by',$user->id)->orWhereHas('classGroup',fn($c)=>$c->where('teacher_id',$user->id))->orWhere(fn($legacy)=>$legacy->whereNull('class_id')->where('component_type',$user->nstp_component));});
 }
}
