<?php

namespace App\Http\Controllers\API\Web\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = DB::table('settings')->pluck('value', 'key')->toArray();
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        abort_unless(in_array($request->user()?->role, ['admin', 'super_admin'], true), 403);
        $rules = [
            'app_name' => 'sometimes|required|string|max:150',
            'training_hours_required' => 'sometimes|integer|min:1|max:10000', 'required_hours' => 'sometimes|integer|min:1|max:10000',
            'max_activity_registrations' => 'sometimes|integer|min:1|max:1000',
            'default_grace_period' => 'sometimes|integer|min:0|max:120',
            'face_confidence_threshold' => 'sometimes|numeric|between:0,1', 'face_threshold' => 'sometimes|numeric|between:0,1',
            'allow_component_change' => 'sometimes|boolean',
            'academic_year' => 'sometimes|string|max:40', 'school_year' => 'sometimes|string|max:40',
            'current_semester' => 'sometimes|in:1st,2nd,summer',
            'latitude' => 'sometimes|numeric|between:-90,90', 'longitude' => 'sometimes|numeric|between:-180,180',
            'geofence_radius' => 'sometimes|integer|min:10|max:1000',
        ];
        if (array_diff(array_keys($request->all()), array_keys($rules))) {
            throw \Illuminate\Validation\ValidationException::withMessages(['settings' => 'Unknown setting.']);
        }
        $data = $request->validate($rules);
        DB::transaction(function () use ($data) {
            foreach ($data as $key => $value) {
                $stored = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
                $query = DB::table('settings')->where('key', $key);
                if ($query->exists()) $query->update(['value' => $stored, 'updated_at' => now()]);
                else DB::table('settings')->insert(['key' => $key, 'value' => $stored, 'created_at' => now(), 'updated_at' => now()]);
            }
        });
        return response()->json(['success' => true, 'message' => 'Settings saved']);
    }
}
