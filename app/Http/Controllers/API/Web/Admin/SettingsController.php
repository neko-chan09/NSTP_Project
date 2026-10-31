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
        foreach ($request->all() as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                [
                    'value' => is_scalar($value) ? (string) $value : json_encode($value),
                    'updated_at' => now(),
                    'created_at' => now()
                ]
            );
        }
        return response()->json(['success' => true, 'message' => 'Settings saved']);
    }
}