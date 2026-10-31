<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AcademicYearController extends Controller
{
    public function index()
    {
        $years = AcademicYear::orderBy('start_year', 'desc')->orderBy('semester', 'desc')->get();
        return response()->json(['success' => true, 'data' => $years]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_year' => 'required|integer|min:2000',
            'end_year' => 'required|integer|gt:start_year',
            'semester' => 'required|in:first,second,summer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->is_current) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $year = AcademicYear::create($request->all());
        return response()->json(['success' => true, 'data' => $year], 201);
    }

    public function update(Request $request, $id)
    {
        $year = AcademicYear::find($id);
        if (!$year) {
            return response()->json(['message' => 'Not found'], 404);
        }
        
        if ($request->is_current) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }
        
        $year->update($request->all());
        return response()->json(['success' => true, 'data' => $year]);
    }

    public function destroy($id)
    {
        $year = AcademicYear::find($id);
        if (!$year) {
            return response()->json(['message' => 'Not found'], 404);
        }
        
        if ($year->is_current) {
            return response()->json(['message' => 'Cannot delete current academic year'], 400);
        }
        
        $year->delete();
        return response()->json(['success' => true, 'message' => 'Deleted']);
    }

    public function current()
    {
        $current = AcademicYear::where('is_current', true)->first();
        return response()->json(['success' => true, 'data' => $current]);
    }
}