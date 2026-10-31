<?php
// app/Http/Controllers/API/Shared/OptionsController.php

namespace App\Http\Controllers\API\Shared;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;

class OptionsController extends Controller
{
    /**
     * Get all unique courses
     */
    public function getCourses(Request $request)
    {
        try {
            $courses = Student::whereNotNull('course')
                ->distinct()
                ->orderBy('course')
                ->pluck('course')
                ->toArray();

            if (empty($courses)) {
                $courses = User::whereNotNull('course')
                    ->distinct()
                    ->orderBy('course')
                    ->pluck('course')
                    ->toArray();
            }

            if (empty($courses)) {
                $courses = ['BSIT', 'BSCS', 'BSN', 'BSCE', 'BSBA', 'BSIS', 'BSA', 'BSEd', 'BSPsych', 'BSMath'];
            }

            return response()->json([
                'success' => true,
                'data' => $courses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch courses'
            ], 500);
        }
    }

    /**
     * Get all unique sections
     */
    public function getSections(Request $request)
    {
        try {
            $sections = Student::whereNotNull('section')
                ->distinct()
                ->orderBy('section')
                ->pluck('section')
                ->toArray();

            if (empty($sections)) {
                $sections = User::whereNotNull('section')
                    ->distinct()
                    ->orderBy('section')
                    ->pluck('section')
                    ->toArray();
            }

            if (empty($sections)) {
                $sections = ['A', 'B', 'C', 'D', 'E'];
            }

            return response()->json([
                'success' => true,
                'data' => $sections
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch sections'
            ], 500);
        }
    }

    /**
     * Get all unique year levels
     */
    public function getYearLevels(Request $request)
    {
        try {
            $yearLevels = Student::whereNotNull('year_level')
                ->distinct()
                ->orderBy('year_level')
                ->pluck('year_level')
                ->toArray();

            if (empty($yearLevels)) {
                $yearLevels = User::whereNotNull('year_level')
                    ->distinct()
                    ->orderBy('year_level')
                    ->pluck('year_level')
                    ->toArray();
            }

            sort($yearLevels);
            $yearLevels = array_map('intval', $yearLevels);

            if (empty($yearLevels)) {
                $yearLevels = [1, 2, 3, 4];
            }

            return response()->json([
                'success' => true,
                'data' => $yearLevels
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch year levels'
            ], 500);
        }
    }

    /**
     * Get all unique components
     */
    public function getComponents(Request $request)
    {
        try {
            $components = Student::whereNotNull('nstp_component_selected')
                ->distinct()
                ->orderBy('nstp_component_selected')
                ->pluck('nstp_component_selected')
                ->toArray();

            $userComponents = User::whereNotNull('nstp_component')
                ->distinct()
                ->orderBy('nstp_component')
                ->pluck('nstp_component')
                ->toArray();

            $allComponents = array_unique(array_merge($components, $userComponents));
            sort($allComponents);

            $componentLabels = [
                'cwts' => 'CWTS',
                'rotc' => 'ROTC',
                'lts' => 'LTS',
            ];

            $formattedComponents = array_map(function($comp) use ($componentLabels) {
                return [
                    'value' => $comp,
                    'label' => $componentLabels[$comp] ?? strtoupper($comp)
                ];
            }, $allComponents);

            if (empty($formattedComponents)) {
                $formattedComponents = [
                    ['value' => 'cwts', 'label' => 'CWTS'],
                    ['value' => 'rotc', 'label' => 'ROTC'],
                    ['value' => 'lts', 'label' => 'LTS'],
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedComponents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch components'
            ], 500);
        }
    }
}