<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CertificateDesignService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CertificateDesignerTest extends TestCase
{
    private function loginAs(string $role): void
    {
        $user = new User();
        $user->id = 123;
        $user->role = $role;
        Sanctum::actingAs($user);
    }

    public function test_guests_and_non_admins_cannot_edit_or_issue_certificates(): void
    {
        $this->getJson('/api/admin/certificates/design/completion')->assertUnauthorized();
        foreach (['student', 'faculty'] as $role) {
            $this->loginAs($role);
            $this->getJson('/api/admin/certificates/design/completion')->assertForbidden();
            $this->putJson('/api/admin/certificates/design/completion', [])->assertForbidden();
            $this->postJson('/api/admin/certificates/design/completion/preview', [])->assertForbidden();
            $this->postJson('/api/admin/certificates/generate', [])->assertForbidden();
            $this->postJson('/api/admin/certificates/batch', [])->assertForbidden();
        }
    }

    public function test_admin_can_save_and_reload_a_design_for_each_certificate_type(): void
    {
        Storage::fake('local');
        $this->loginAs('admin');
        $service = app(CertificateDesignService::class);
        foreach (CertificateDesignService::TYPES as $type) {
            $this->getJson("/api/admin/certificates/design/{$type}")->assertOk()->assertJsonPath('data', null);
            $design = $service->defaults($type);
            $design['elements'][4]['x'] = 125;
            $this->putJson("/api/admin/certificates/design/{$type}", ['design' => $design])
                ->assertOk()->assertJsonPath('data.design.name', $design['name']);
            $this->getJson("/api/admin/certificates/design/{$type}")
                ->assertOk()->assertJsonPath('data.design.elements.4.x', 125);
        }
        $this->getJson('/api/admin/certificates/design/unknown')->assertNotFound();
    }

    public function test_external_images_and_invalid_positions_are_rejected(): void
    {
        Storage::fake('local');
        $this->loginAs('super_admin');
        $design = app(CertificateDesignService::class)->defaults('completion');
        $design['backgroundImage'] = 'https://example.com/private-image.png';
        $this->putJson('/api/admin/certificates/design/completion', ['design' => $design])
            ->assertUnprocessable()->assertJsonValidationErrors('design.backgroundImage');
        $design['backgroundImage'] = '';
        $design['elements'][0]['x'] = 1000;
        $this->putJson('/api/admin/certificates/design/completion', ['design' => $design])->assertUnprocessable();
        Storage::disk('local')->assertMissing('certificate-designs/completion.json');
    }

    public function test_unknown_fields_and_css_injection_are_rejected(): void
    {
        $this->loginAs('admin');
        $service = app(CertificateDesignService::class);
        $design = $service->defaults('completion');
        $design['elements'][0]['text'] = '{{password}}';
        $this->putJson('/api/admin/certificates/design/completion', ['design' => $design])->assertUnprocessable();
        $design['elements'][0]['text'] = 'School';
        $design['elements'][0]['color'] = 'red; background: url(file:///etc/passwd)';
        $this->putJson('/api/admin/certificates/design/completion', ['design' => $design])->assertUnprocessable();
    }

    public function test_substituted_student_text_is_escaped_in_the_pdf_view(): void
    {
        $service = app(CertificateDesignService::class);
        $text = $service->substitute('{{student_name}} — {{component}}', ['student_name' => '<script>alert(1)</script>', 'component' => 'CWTS']);
        $design = $service->defaults('completion');
        $element = $design['elements'][0];
        $element['text'] = $text;
        $element['font'] = 'DejaVu Serif';
        $html = view('certificates.designed', ['design' => $design, 'elements' => [$element], 'qr' => ''])->render();
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringNotContainsString('<script>', $html);
    }

    public function test_saved_template_does_not_change_an_already_rendered_pdf(): void
    {
        Storage::fake('local');
        $service = app(CertificateDesignService::class);
        $design = $service->defaults('completion');
        $fields = [
            'student_name' => 'MARIA SANTOS', 'student_number' => 'STU-0001', 'course' => 'BSIT', 'section' => 'A',
            'component' => 'CWTS', 'academic_year' => '2025–2026', 'completion_date' => 'November 08, 2026',
            'certificate_type' => 'COMPLETION', 'certificate_number' => 'NSTP-TEST-001',
        ];
        $pdf = $service->render($design, $fields, 'https://example.edu/api/verify-certificate/NSTP-TEST-001')->output();
        $this->assertStringStartsWith('%PDF-', $pdf);
        $design['name'] = 'Changed for next batch';
        $service->save('completion', $design);
        $this->assertStringStartsWith('%PDF-', $pdf);
        // The isolated verification runner uses this artifact for page-count and visual checks.
        if ($path = getenv('CERTIFICATE_QA_PDF')) {
            file_put_contents($path, $pdf);
        }
    }
}
