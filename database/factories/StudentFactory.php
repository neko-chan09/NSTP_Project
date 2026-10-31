<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'student_id' => 'STU-' . fake()->unique()->numberBetween(1000, 9999),
            'birth_date' => fake()->date('Y-m-d', '-20 years'),
            'gender' => fake()->randomElement(['male', 'female', 'other']),
            'address' => fake()->address(),
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_number' => fake()->phoneNumber(),
            'course' => fake()->word(),
            'year_level' => fake()->randomElement(['1st', '2nd', '3rd', '4th']),
            'section' => fake()->randomElement(['A', 'B', 'C', 'D']),
            'nstp_component_selected' => fake()->randomElement(['cwts', 'rotc', 'lts']),
            'total_training_hours' => 0,
            'completed_training_hours' => 0,
            'is_eligible_for_completion' => false,
            'completion_status' => 'pending',
            'face_embedding' => null,
        ];
    }
}
