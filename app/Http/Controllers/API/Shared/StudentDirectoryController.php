<?php
namespace App\Http\Controllers\API\Shared;
use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
class StudentDirectoryController extends Controller {
    public function options(Request $request) {
        $q=Student::query();
        if($request->user()->role==='faculty') $q->whereHas('classes',fn($c)=>$c->where('teacher_id',$request->user()->id)->where('class_students.status','active'));
        return response()->json(['data'=>['courses'=>(clone $q)->whereNotNull('course')->where('course','!=','')->distinct()->orderBy('course')->pluck('course'),'sections'=>(clone $q)->whereNotNull('section')->where('section','!=','')->distinct()->orderBy('section')->pluck('section')]]);
    }
}
