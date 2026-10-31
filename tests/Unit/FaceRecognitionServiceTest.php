<?php

namespace Tests\Unit;

use App\Services\FaceRecognitionService;
use PHPUnit\Framework\TestCase;

class FaceRecognitionServiceTest extends TestCase
{
    protected function generateMockDescriptor($seed = 0): array
    {
        mt_srand($seed);
        return array_map(fn() => (float)(mt_rand(0, 1000) / 1000), range(1, 512));
    }

    public function test_euclidean_distance_identical_descriptors()
    {
        $descriptor = $this->generateMockDescriptor(1);
        $distance = FaceRecognitionService::euclideanDistance($descriptor, $descriptor);
        $this->assertEquals(0.0, $distance, 'Distance should be 0 for identical descriptors', 0.0001);
    }

    public function test_euclidean_distance_different_descriptors()
    {
        $descriptor1 = $this->generateMockDescriptor(1);
        $descriptor2 = $this->generateMockDescriptor(2);
        $distance = FaceRecognitionService::euclideanDistance($descriptor1, $descriptor2);
        $this->assertGreaterThan(0, $distance, 'Distance should be > 0 for different descriptors');
        $this->assertLessThan(512, $distance, 'Distance should be < sqrt(512*1) = 22.6 for normalized values');
    }

    public function test_euclidean_distance_dimension_mismatch()
    {
        $descriptor1 = array_fill(0, 512, 0.5);
        $descriptor2 = array_fill(0, 256, 0.5);

        $this->expectException(\InvalidArgumentException::class);
        FaceRecognitionService::euclideanDistance($descriptor1, $descriptor2);
    }

    public function test_match_face_descriptor_matching_faces()
    {
        $descriptor1 = $this->generateMockDescriptor(1);
        $descriptor2 = array_map(fn($v) => $v + 0.001, $descriptor1);

        $result = FaceRecognitionService::matchFaceDescriptor($descriptor1, $descriptor2, 0.6);
        $this->assertTrue($result, 'Should match when distance < threshold');
    }

    public function test_match_face_descriptor_non_matching_faces()
    {
        $descriptor1 = $this->generateMockDescriptor(1);
        $descriptor2 = $this->generateMockDescriptor(2);

        $result = FaceRecognitionService::matchFaceDescriptor($descriptor1, $descriptor2, 0.1);
        $this->assertFalse($result, 'Should not match when distance > threshold');
    }

    public function test_confidence_score_identical_descriptors()
    {
        $descriptor = $this->generateMockDescriptor(1);
        $confidence = FaceRecognitionService::getConfidenceScore($descriptor, $descriptor);
        $this->assertEquals(1.0, $confidence, 'Confidence should be 1.0 for identical descriptors', 0.01);
    }

    public function test_confidence_score_different_descriptors()
    {
        $descriptor1 = $this->generateMockDescriptor(1);
        $descriptor2 = array_map(fn($v) => $v + 0.02, $descriptor1);
        $confidence = FaceRecognitionService::getConfidenceScore($descriptor1, $descriptor2);
        $this->assertGreaterThan(0, $confidence, 'Confidence should be > 0');
        $this->assertLessThan(1, $confidence, 'Confidence should be < 1 for different descriptors');
    }

    public function test_validate_descriptor_valid()
    {
        $descriptor = array_fill(0, 512, 0.5);
        $result = FaceRecognitionService::isValidDescriptor($descriptor);
        $this->assertTrue($result, 'Should validate correct 512-dim array');
    }

    public function test_validate_descriptor_wrong_dimension()
    {
        $descriptor = array_fill(0, 256, 0.5);
        $result = FaceRecognitionService::isValidDescriptor($descriptor);
        $this->assertFalse($result, 'Should reject 256-dim array');
    }

    public function test_validate_descriptor_not_array()
    {
        $result = FaceRecognitionService::isValidDescriptor('not-an-array');
        $this->assertFalse($result, 'Should reject non-array');
    }

    public function test_validate_descriptor_non_numeric_values()
    {
        $descriptor = array_fill(0, 512, 'invalid');
        $result = FaceRecognitionService::isValidDescriptor($descriptor);
        $this->assertFalse($result, 'Should reject non-numeric values');
    }

    public function test_validate_descriptor_with_nan()
    {
        $descriptor = array_fill(0, 512, 0.5);
        $descriptor[256] = NAN;
        $result = FaceRecognitionService::isValidDescriptor($descriptor);
        $this->assertFalse($result, 'Should reject descriptors containing NaN');
    }
}
