<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateDesignService
{
    public const TYPES = ['completion', 'participation', 'training'];
    public const FIELDS = ['student_name', 'student_number', 'course', 'section', 'component',
        'academic_year', 'completion_date', 'hours_completed', 'certificate_number', 'certificate_type'];

    public function validate(array $design): array
    {
        $validated = Validator::make(['design' => $design], [
            'design' => 'required|array:version,name,background,backgroundImage,border,accent,elements',
            'design.version' => 'required|integer|in:1',
            'design.name' => 'required|string|max:120',
            'design.background' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'design.backgroundImage' => 'present|nullable|string|max:2000000',
            'design.border' => 'required|in:classic,double,none',
            'design.accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'design.elements' => 'present|array|max:50',
            'design.elements.*' => 'required|array:id,kind,x,y,width,height,text,src,fontSize,fontFamily,color,bold,italic,align',
            'design.elements.*.id' => 'required|string|max:80|distinct',
            'design.elements.*.kind' => 'required|in:text,image,line,qr',
            'design.elements.*.x' => 'required|numeric|min:0|max:1120',
            'design.elements.*.y' => 'required|numeric|min:0|max:792',
            'design.elements.*.width' => 'required|numeric|min:20|max:1120',
            'design.elements.*.height' => 'required|numeric|min:1|max:792',
            'design.elements.*.text' => 'present|nullable|string|max:2000',
            'design.elements.*.src' => 'present|nullable|string|max:2000000',
            'design.elements.*.fontSize' => 'required|numeric|min:8|max:96',
            'design.elements.*.fontFamily' => 'required|in:serif,sans-serif,monospace',
            'design.elements.*.color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'design.elements.*.bold' => 'required|boolean',
            'design.elements.*.italic' => 'required|boolean',
            'design.elements.*.align' => 'required|in:left,center,right',
        ])->validate()['design'];

        if (strlen(json_encode($validated)) > 6000000) {
            throw ValidationException::withMessages(['design' => 'The design is too large. Use smaller images (6 MB total maximum).']);
        }
        $this->validateImage($validated['backgroundImage'] ?? '', 'design.backgroundImage');
        foreach ($validated['elements'] as $index => $element) {
            $key = "design.elements.{$index}";
            if ($element['x'] + $element['width'] > 1120.01 || $element['y'] + $element['height'] > 792.01) {
                throw ValidationException::withMessages([$key => 'Every element must stay inside the page.']);
            }
            if ($element['kind'] === 'image') {
                $this->validateImage($element['src'] ?? '', "{$key}.src", true);
            } elseif (!empty($element['src'])) {
                throw ValidationException::withMessages(["{$key}.src" => 'Only image elements may contain image data.']);
            }
            preg_match_all('/\{\{\s*([a-z_]+)\s*\}\}/', $element['text'] ?? '', $matches);
            foreach ($matches[1] as $field) {
                if (!in_array($field, self::FIELDS, true)) {
                    throw ValidationException::withMessages(["{$key}.text" => "Unknown student field: {$field}."]);
                }
            }
        }
        return $validated;
    }

    private function validateImage(string $value, string $key, bool $required = false): void
    {
        if ($value === '' && !$required) {
            return;
        }
        if (!preg_match('/^data:image\/(png|jpeg);base64,([A-Za-z0-9+\/=]+)$/D', $value, $matches)) {
            throw ValidationException::withMessages([$key => 'Only embedded PNG or JPG images are allowed.']);
        }
        $bytes = base64_decode($matches[2], true);
        $image = $bytes === false ? false : @getimagesizefromstring($bytes);
        if (!$image || !in_array($image[2], [IMAGETYPE_PNG, IMAGETYPE_JPEG], true)
            || $image[0] * $image[1] > 16000000
            || ($matches[1] === 'png' && $image[2] !== IMAGETYPE_PNG)
            || ($matches[1] === 'jpeg' && $image[2] !== IMAGETYPE_JPEG)) {
            throw ValidationException::withMessages([$key => 'The image is invalid or too large.']);
        }
    }

    private function path(string $type): string
    {
        abort_unless(in_array($type, self::TYPES, true), 404);
        return "certificate-designs/{$type}.json";
    }

    public function load(string $type): ?array
    {
        $path = $this->path($type);
        if (!Storage::disk('local')->exists($path)) {
            return null;
        }
        return json_decode(Storage::disk('local')->get($path), true, 512, JSON_THROW_ON_ERROR);
    }

    public function save(string $type, array $design): array
    {
        $path = $this->path($type);
        $payload = ['design' => $this->validate($design), 'saved_at' => now()->toIso8601String()];
        if (!Storage::disk('local')->put($path, json_encode($payload, JSON_THROW_ON_ERROR))) {
            throw new \RuntimeException('The certificate template could not be saved.');
        }
        return $payload;
    }

    public function defaults(string $type): array
    {
        $this->path($type);
        $design = json_decode(file_get_contents(resource_path('certificates/default-design.json')), true, 512, JSON_THROW_ON_ERROR);
        $design['name'] = 'NSTP ' . ucfirst($type) . ' Certificate';
        return $design;
    }

    public function fields(?Student $student, string $type, string $number): array
    {
        $year = AcademicYear::where('is_current', true)->first();
        return [
            'student_name' => $student ? trim(($student->user?->first_name ?? '') . ' ' . ($student->user?->last_name ?? '')) : 'MARIA SANTOS',
            'student_number' => $student?->student_id ?? 'STU-0001',
            'course' => $student?->course ?? 'BSIT',
            'section' => $student?->section ?? 'A',
            'component' => strtoupper($student?->nstp_component_selected ?? 'CWTS'),
            'academic_year' => $year?->academic_year ?? ((now()->year - 1) . '–' . now()->year),
            'completion_date' => ($student?->completed_at ?? now())->format('F d, Y'),
            'hours_completed' => (string) ($student?->completed_training_hours ?? 90),
            'certificate_number' => $number,
            'certificate_type' => strtoupper($type),
        ];
    }

    public function substitute(string $text, array $fields): string
    {
        // This substitutes data only. Blade escapes the resulting text; no template code is evaluated.
        return preg_replace_callback('/\{\{\s*([a-z_]+)\s*\}\}/', fn ($m) => (string) ($fields[$m[1]] ?? $m[0]), $text);
    }

    public function render(array $design, array $fields, string $verificationUrl)
    {
        $design = $this->validate($design);
        $qr = 'data:image/png;base64,' . base64_encode(QrCode::format('png')->size(240)->margin(1)->generate($verificationUrl));
        $fonts = ['serif' => 'DejaVu Serif', 'sans-serif' => 'DejaVu Sans', 'monospace' => 'DejaVu Sans Mono'];
        $elements = array_map(function ($item) use ($fields, $fonts) {
            $item['text'] = $this->substitute($item['text'] ?? '', $fields);
            $item['font'] = $fonts[$item['fontFamily']];
            return $item;
        }, $design['elements']);
        return Pdf::loadView('certificates.designed', compact('design', 'elements', 'qr'))
            ->setPaper('a4', 'landscape')->setOptions(['isRemoteEnabled' => false, 'isPhpEnabled' => false]);
    }
}
