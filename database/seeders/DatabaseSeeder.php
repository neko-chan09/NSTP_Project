<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting NSTP Database Seeder...');
        $this->command->info('');

        // ============================================================
        // 1. USERS
        // ============================================================
        $this->command->info('📝 Seeding Users...');
        $this->seedUsers();
        $this->command->info('✅ Users seeded successfully');
        $this->command->info('');

        // ============================================================
        // 2. STUDENTS
        // ============================================================
        $this->command->info('📝 Seeding Students...');
        $this->seedStudents();
        $this->command->info('✅ Students seeded successfully');
        $this->command->info('');

        // ============================================================
        // 3. ACADEMIC YEARS
        // ============================================================
        $this->command->info('📝 Seeding Academic Years...');
        $this->seedAcademicYears();
        $this->command->info('✅ Academic Years seeded successfully');
        $this->command->info('');

        // ============================================================
        // 4. ACTIVITIES
        // ============================================================
        $this->command->info('📝 Seeding Activities...');
        $this->seedActivities();
        $this->command->info('✅ Activities seeded successfully');
        $this->command->info('');

        // ============================================================
        // 5. ACTIVITY PARTICIPATIONS
        // ============================================================
        $this->command->info('📝 Seeding Activity Participations...');
        $this->seedActivityParticipations();
        $this->command->info('✅ Activity Participations seeded successfully');
        $this->command->info('');

        // ============================================================
        // 6. CLASSES
        // ============================================================
        $this->command->info('📝 Seeding Classes...');
        $this->seedClasses();
        $this->command->info('✅ Classes seeded successfully');
        $this->command->info('');

        // ============================================================
        // 7. ATTENDANCE SESSIONS
        // ============================================================
        $this->command->info('📝 Seeding Attendance Sessions...');
        $this->seedAttendanceSessions();
        $this->command->info('✅ Attendance Sessions seeded successfully');
        $this->command->info('');

        // ============================================================
        // 8. CLASS STUDENTS
        // ============================================================
        $this->command->info('📝 Seeding Class Students...');
        $this->seedClassStudents();
        $this->command->info('✅ Class Students seeded successfully');
        $this->command->info('');

        // ============================================================
        // 9. ATTENDANCE LOGS
        // ============================================================
        $this->command->info('📝 Seeding Attendance Logs...');
        $this->seedAttendanceLogs();
        $this->command->info('✅ Attendance Logs seeded successfully');
        $this->command->info('');

        // ============================================================
        // 10. LEARNING MATERIALS
        // ============================================================
        $this->command->info('📝 Seeding Learning Materials...');
        $this->seedLearningMaterials();
        $this->command->info('✅ Learning Materials seeded successfully');
        $this->command->info('');

        // ============================================================
        // 11. NOTIFICATIONS
        // ============================================================
        $this->command->info('📝 Seeding Notifications...');
        $this->seedNotifications();
        $this->command->info('✅ Notifications seeded successfully');
        $this->command->info('');

        // ============================================================
        // 12. SETTINGS
        // ============================================================
        $this->command->info('📝 Seeding Settings...');
        $this->seedSettings();
        $this->command->info('✅ Settings seeded successfully');
        $this->command->info('');

        // ============================================================
        // 13. COMPONENT CHANGE REQUESTS
        // ============================================================
        $this->command->info('📝 Seeding Component Change Requests...');
        $this->seedComponentChangeRequests();
        $this->command->info('✅ Component Change Requests seeded successfully');
        $this->command->info('');

        // ============================================================
        // 14. DOCUMENTS
        // ============================================================
        $this->command->info('📝 Seeding Documents...');
        $this->seedDocuments();
        $this->command->info('✅ Documents seeded successfully');
        $this->command->info('');

        // ============================================================
        // 15. CERTIFICATES
        // ============================================================
        $this->command->info('📝 Seeding Certificates...');
        $this->seedCertificates();
        $this->command->info('✅ Certificates seeded successfully');
        $this->command->info('');

        // ============================================================
        // 16. MEMOS (Office Documents)
        // ============================================================
        $this->command->info('📝 Seeding Memos...');
        $this->seedMemos();
        $this->command->info('✅ Memos seeded successfully');
        $this->command->info('');

        // ============================================================
        // FINAL SUMMARY
        // ============================================================
        $this->command->info('========================================');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('========================================');
        $this->command->info('');
        $this->printLoginCredentials();
    }

    /**
     * Clear existing data (optional)
     */
    private function clearExistingData(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'activity_participations',
            'attendance_logs',
            'attendance_sessions',
            'class_students',
            'learning_materials',
            'classes',
            'component_change_requests',
            'certificates',
            'documents',
            'activity_feedback',
            'activity_registrations',
            'activities',
            'notifications',
            'bulletin_board',
            'memos',
            'academic_years',
            'settings',
            'students',
            'users'
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * Seed Users
     * ✅ Faculty users now get a unique class_code
     */
    private function seedUsers(): void
    {
        $users = [
            // Super Admin
            [
                'id' => 1,
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'middle_name' => null,
                'email' => 'superadmin@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'student_id' => null,
                'nstp_component' => null,
                'class_code' => null,
                'course' => null,
                'year_level' => null,
                'section' => null,
                'contact_number' => '09171234567',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Admin
            [
                'id' => 2,
                'first_name' => 'Admin',
                'last_name' => 'User',
                'middle_name' => null,
                'email' => 'admin@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'student_id' => null,
                'nstp_component' => null,
                'class_code' => null,
                'course' => null,
                'year_level' => null,
                'section' => null,
                'contact_number' => '09172345678',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Faculty CWTS
            [
                'id' => 3,
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'email' => 'faculty.cwts@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'cwts',
                'class_code' => 'CWTS-A1',
                'course' => 'BSIT',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09173456789',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Faculty ROTC
            [
                'id' => 4,
                'first_name' => 'Jose',
                'last_name' => 'Reyes',
                'middle_name' => 'Mendoza',
                'email' => 'faculty.rotc@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'rotc',
                'class_code' => 'ROTC-A1',
                'course' => 'BEED',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09174567890',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Faculty LTS
            [
                'id' => 5,
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'email' => 'faculty.lts@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'lts',
                'class_code' => 'LTS-A1',
                'course' => 'BSBA',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09175678901',
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($users);
    }

    /**
     * Seed Students
     */
    private function seedStudents(): void
    {
        $firstNames = [
            'Juan',
            'Maria',
            'Jose',
            'Ana',
            'Pedro',
            'Luisa',
            'Carlos',
            'Elena',
            'Miguel',
            'Sofia',
            'Antonio',
            'Isabella',
            'Ramon',
            'Carmen',
            'Javier',
            'Patricia',
            'Fernando',
            'Teresa',
            'Emilio',
            'Gloria',
            'Manuel',
            'Luz',
            'Rogelio',
            'Nena',
            'Ricardo',
            'Alicia',
            'Rafael',
            'Lourdes',
            'Enrique',
            'Concepcion',
            'Andres',
            'Beatriz',
            'Cristina',
            'Domingo',
            'Esperanza'
        ];

        $lastNames = [
            'Santos',
            'Reyes',
            'Cruz',
            'Garcia',
            'Martinez',
            'Lopez',
            'Gonzalez',
            'Perez',
            'Rodriguez',
            'Fernandez',
            'Torres',
            'Rivera',
            'Morales',
            'Ortiz',
            'Castro',
            'Ramos',
            'Mendoza',
            'Flores',
            'Romero',
            'Gutierrez',
            'Molina',
            'Delgado',
            'Vega',
            'Rojas',
            'Aquino',
            'Castillo',
            'Diaz'
        ];

        $courses = ['BSIT', 'BEED', 'BSBA'];
        $sections = ['A', 'B', 'C', 'D', 'E'];
        $components = ['cwts', 'rotc', 'lts'];
        $genders = ['male', 'female'];

        $studentUsers = [];
        $studentRecords = [];
        $userId = 6; // Start after the 5 users above

        for ($i = 0; $i < 50; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $middleName = rand(0, 1) ? $lastNames[array_rand($lastNames)] : null;
            $gender = $genders[array_rand($genders)];
            $course = $courses[array_rand($courses)];
            $component = $components[array_rand($components)];
            $yearLevel = rand(1, 4);
            $section = $sections[array_rand($sections)];
            $completedHours = rand(0, 90);

            if ($completedHours >= 90) {
                $status = 'completed';
                $eligible = true;
                $completedAt = now()->subDays(rand(0, 30));
            } elseif ($completedHours >= 60) {
                $status = 'in_progress';
                $eligible = false;
                $completedAt = null;
            } elseif ($completedHours >= 30) {
                $status = 'pending';
                $eligible = false;
                $completedAt = null;
            } else {
                $status = 'deficient';
                $eligible = false;
                $completedAt = null;
            }

            $studentId = 'STU-' . str_pad($userId, 4, '0', STR_PAD_LEFT);

            $studentUsers[] = [
                'id' => $userId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $middleName,
                'email' => 'student' . $userId . '@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'student',
                'student_id' => $studentId,
                'nstp_component' => $component,
                'class_code' => null, // students don't have class codes
                'course' => $course,
                'year_level' => $yearLevel,
                'section' => $section,
                'contact_number' => '0917' . rand(1000000, 9999999),
                'is_active' => true,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $studentRecords[] = [
                'id' => $userId,
                'user_id' => $userId,
                'student_id' => $studentId,
                'birth_date' => Carbon::create(rand(2000, 2006), rand(1, 12), rand(1, 28))->format('Y-m-d'),
                'gender' => $gender,
                'address' => rand(1, 999) . ' ' . $lastName . ' St., ' . ['Manila', 'Quezon City', 'Pasig City', 'Makati City', 'Taguig City'][array_rand(['Manila', 'Quezon City', 'Pasig City', 'Makati City', 'Taguig City'])],
                'emergency_contact_name' => $firstName . ' ' . $lastName . ' Sr.',
                'emergency_contact_number' => '0917' . rand(1000000, 9999999),
                'course' => $course,
                'year_level' => $yearLevel,
                'section' => $section,
                'nstp_component_selected' => $component,
                'total_training_hours' => 90,
                'completed_training_hours' => $completedHours,
                'is_eligible_for_completion' => $eligible,
                'completion_status' => $status,
                'completed_at' => $completedAt,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $userId++;
        }

        DB::table('users')->insert($studentUsers);
        DB::table('students')->insert($studentRecords);
    }

    /**
     * Seed Academic Years
     */
    private function seedAcademicYears(): void
    {
        DB::table('academic_years')->insert([
            [
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'start_date' => '2024-06-01',
                'end_date' => '2024-10-31',
                'is_current' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'academic_year' => '2024-2025',
                'semester' => '2nd',
                'start_date' => '2024-11-01',
                'end_date' => '2025-03-31',
                'is_current' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'academic_year' => '2025-2026',
                'semester' => '1st',
                'start_date' => '2025-06-01',
                'end_date' => '2025-10-31',
                'is_current' => true,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'academic_year' => '2025-2026',
                'semester' => '2nd',
                'start_date' => '2025-11-01',
                'end_date' => '2026-03-31',
                'is_current' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed Activities
     */
    private function seedActivities(): void
    {
        $activities = [
            [
                'id' => 1,
                'title' => 'CWTS Community Cleanup Drive',
                'description' => 'Community cleanup and environmental awareness campaign for CWTS students. Join us in making our community cleaner and greener.',
                'component_type' => 'cwts',
                'start_datetime' => now()->addDays(5)->setTime(8, 0, 0),
                'end_datetime' => now()->addDays(5)->setTime(17, 0, 0),
                'venue' => 'Barangay Hall, Manila',
                'latitude' => 14.5995,
                'longitude' => 120.9842,
                'training_hours' => 8,
                'max_participants' => 50,
                'status' => 'upcoming',
                'created_by' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'title' => 'ROTC Basic Military Training',
                'description' => 'Basic military training for ROTC students. Learn discipline, leadership, and military skills.',
                'component_type' => 'rotc',
                'start_datetime' => now()->addDays(10)->setTime(6, 0, 0),
                'end_datetime' => now()->addDays(10)->setTime(18, 0, 0),
                'venue' => 'Camp Aguinaldo, QC',
                'latitude' => 14.6266,
                'longitude' => 121.0668,
                'training_hours' => 10,
                'max_participants' => 40,
                'status' => 'upcoming',
                'created_by' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'title' => 'LTS Literacy Program',
                'description' => 'Literacy training for community children by LTS students. Help children learn to read and write.',
                'component_type' => 'lts',
                'start_datetime' => now()->addDays(3)->setTime(9, 0, 0),
                'end_datetime' => now()->addDays(3)->setTime(16, 0, 0),
                'venue' => 'Community Learning Center',
                'latitude' => 14.6548,
                'longitude' => 121.0492,
                'training_hours' => 6,
                'max_participants' => 30,
                'status' => 'upcoming',
                'created_by' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'title' => 'All-Component General Assembly',
                'description' => 'General assembly for all NSTP components. Important announcements and updates for the semester.',
                'component_type' => 'all',
                'start_datetime' => now()->addDays(7)->setTime(10, 0, 0),
                'end_datetime' => now()->addDays(7)->setTime(12, 0, 0),
                'venue' => 'University Auditorium',
                'latitude' => 14.6762,
                'longitude' => 121.0102,
                'training_hours' => 2,
                'max_participants' => 100,
                'status' => 'upcoming',
                'created_by' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 5,
                'title' => 'CWTS Medical Mission',
                'description' => 'Medical mission for underserved communities. CWTS students will assist in medical outreach.',
                'component_type' => 'cwts',
                'start_datetime' => now()->addDays(15)->setTime(7, 0, 0),
                'end_datetime' => now()->addDays(15)->setTime(18, 0, 0),
                'venue' => 'Barangay Health Center',
                'latitude' => 14.5823,
                'longitude' => 120.9688,
                'training_hours' => 10,
                'max_participants' => 45,
                'status' => 'upcoming',
                'created_by' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 6,
                'title' => 'ROTC Field Training Exercise',
                'description' => 'Field training exercise for ROTC students. Practical application of military skills.',
                'component_type' => 'rotc',
                'start_datetime' => now()->addDays(20)->setTime(5, 0, 0),
                'end_datetime' => now()->addDays(20)->setTime(20, 0, 0),
                'venue' => 'Training Grounds, Rizal',
                'latitude' => 14.6092,
                'longitude' => 121.0344,
                'training_hours' => 12,
                'max_participants' => 35,
                'status' => 'upcoming',
                'created_by' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('activities')->insert($activities);
    }

    /**
     * Seed Activity Participations
     */
    private function seedActivityParticipations(): void
    {
        $students = DB::table('students')->get();
        $activities = DB::table('activities')->get();
        $participations = [];
        $usedPairs = [];

        if ($students->isEmpty() || $activities->isEmpty()) {
            return;
        }

        $activityHoursMap = $activities->pluck('training_hours', 'id')->toArray();

        foreach ($students as $student) {
            $numActivities = rand(1, min(3, $activities->count()));
            $selectedActivities = $activities->random($numActivities);

            foreach ($selectedActivities as $activity) {
                $pairKey = $activity->id . '-' . $student->id;

                if (!isset($usedPairs[$pairKey])) {
                    $usedPairs[$pairKey] = true;

                    $statuses = ['registered', 'present', 'absent', 'excused'];
                    $status = $statuses[array_rand($statuses)];
                    $hours = $activityHoursMap[$activity->id] ?? 0;

                    $participations[] = [
                        'activity_id' => $activity->id,
                        'student_id' => $student->id,
                        'attendance_status' => $status,
                        'hours_earned' => ($status === 'present') ? $hours : 0,
                        'attended_at' => ($status === 'present') ? now()->subDays(rand(0, 5)) : null,
                        'created_at' => now()->subDays(rand(0, 10)),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (!empty($participations)) {
            DB::table('activity_participations')->insert($participations);
        }
    }

    /**
     * Seed Classes
     */
    private function seedClasses(): void
    {
        DB::table('classes')->insert([
            // CWTS classes → CWTS-A1
            [
                'id' => 1,
                'teacher_id' => 3,
                'name' => 'CWTS Section A - 2025',
                'description' => 'CWTS class for BSIT students. Focus on community service and civic welfare training.',
                'component_type' => 'cwts',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'teacher_id' => 3,
                'name' => 'CWTS Section B - 2025',
                'description' => 'CWTS class for BSBA students. Focus on community service and civic welfare training.',
                'component_type' => 'cwts',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'teacher_id' => 3,
                'name' => 'CWTS Section C - 2025',
                'description' => 'CWTS class for BEED students. Focus on community service and civic welfare training.',
                'component_type' => 'cwts',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // ROTC classes → ROTC-A1
            [
                'id' => 4,
                'teacher_id' => 4,
                'name' => 'ROTC Basic Training - 2025',
                'description' => 'ROTC class for BSIT students. Focus on military training and discipline.',
                'component_type' => 'rotc',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 5,
                'teacher_id' => 4,
                'name' => 'ROTC Basic Training - Section B - 2025',
                'description' => 'ROTC class for BEED students. Focus on military training and discipline.',
                'component_type' => 'rotc',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // LTS classes → LTS-A1
            [
                'id' => 6,
                'teacher_id' => 5,
                'name' => 'LTS Literacy Program - 2025',
                'description' => 'LTS class for BSBA students. Focus on literacy training and community outreach.',
                'component_type' => 'lts',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 7,
                'teacher_id' => 5,
                'name' => 'LTS Literacy Program - Section B - 2025',
                'description' => 'LTS class for BSIT students. Focus on literacy training and community outreach.',
                'component_type' => 'lts',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed Class Students
     * Assign students to classes based on their component.
     */
    private function seedClassStudents(): void
    {
        $students = DB::table('students')->get();
        $classStudents = [];

        foreach ($students as $student) {
            // Map student's component to class ID
            $classMap = [
                'cwts' => 1, // CWTS Section A
                'rotc' => 4, // ROTC Basic Training
                'lts'  => 6, // LTS Literacy Program
            ];

            $classId = $classMap[$student->nstp_component_selected] ?? null;

            if ($classId && rand(0, 1)) { // 50% chance of being enrolled
                $classStudents[] = [
                    'class_id'   => $classId,
                    'student_id' => $student->id,
                    'status'     => 'active',
                    'joined_at'  => now()->subDays(rand(0, 30)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($classStudents)) {
            DB::table('class_students')->insert($classStudents);
        }
    }

    /**
     * Seed Attendance Sessions
     */
    private function seedAttendanceSessions(): void
    {
        $sessions = [
            [
                'id' => 1,
                'faculty_id' => 3,
                'component' => 'cwts',
                'class_id' => 1,
                'scheduled_start' => now()->addDays(1)->setTime(9, 0, 0),
                'scheduled_end' => now()->addDays(1)->setTime(12, 0, 0),
                'start_time' => now()->addDays(1)->setTime(9, 0, 0),
                'end_time' => now()->addDays(1)->setTime(12, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'active',
                'description' => 'CWTS Morning Session - Week 1',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'faculty_id' => 4,
                'component' => 'rotc',
                'class_id' => 4,
                'scheduled_start' => now()->addDays(2)->setTime(8, 0, 0),
                'scheduled_end' => now()->addDays(2)->setTime(11, 0, 0),
                'start_time' => now()->addDays(2)->setTime(8, 0, 0),
                'end_time' => now()->addDays(2)->setTime(11, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'active',
                'description' => 'ROTC Training Session - Basic Drills',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'faculty_id' => 5,
                'component' => 'lts',
                'class_id' => 6,
                'scheduled_start' => now()->addDays(3)->setTime(9, 0, 0),
                'scheduled_end' => now()->addDays(3)->setTime(12, 0, 0),
                'start_time' => now()->addDays(3)->setTime(9, 0, 0),
                'end_time' => now()->addDays(3)->setTime(12, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'active',
                'description' => 'LTS Literacy Session - Reading Program',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'faculty_id' => 3,
                'component' => 'cwts',
                'class_id' => 1,
                'scheduled_start' => now()->subDays(2)->setTime(9, 0, 0),
                'scheduled_end' => now()->subDays(2)->setTime(12, 0, 0),
                'start_time' => now()->subDays(2)->setTime(9, 0, 0),
                'end_time' => now()->subDays(2)->setTime(12, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'closed',
                'description' => 'CWTS Morning Session - Week 1 (Past)',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(2),
            ],
            [
                'id' => 5,
                'faculty_id' => 4,
                'component' => 'rotc',
                'class_id' => 4,
                'scheduled_start' => now()->subDays(3)->setTime(8, 0, 0),
                'scheduled_end' => now()->subDays(3)->setTime(11, 0, 0),
                'start_time' => now()->subDays(3)->setTime(8, 0, 0),
                'end_time' => now()->subDays(3)->setTime(11, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'closed',
                'description' => 'ROTC Training Session - Basic Drills (Past)',
                'created_at' => now()->subDays(6),
                'updated_at' => now()->subDays(3),
            ],
            [
                'id' => 6,
                'faculty_id' => 5,
                'component' => 'lts',
                'class_id' => 6,
                'scheduled_start' => now()->subDays(4)->setTime(9, 0, 0),
                'scheduled_end' => now()->subDays(4)->setTime(12, 0, 0),
                'start_time' => now()->subDays(4)->setTime(9, 0, 0),
                'end_time' => now()->subDays(4)->setTime(12, 0, 0),
                'grace_period_minutes' => 15,
                'is_scheduled' => true,
                'status' => 'closed',
                'description' => 'LTS Literacy Session - Reading Program (Past)',
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(4),
            ],
        ];

        DB::table('attendance_sessions')->insert($sessions);
    }

    /**
     * Seed Attendance Logs
     */
    private function seedAttendanceLogs(): void
    {
        $students = DB::table('students')->get();
        $sessions = DB::table('attendance_sessions')->where('status', 'closed')->get();
        $logs = [];
        $usedPairs = [];

        foreach ($sessions as $session) {
            $numStudents = rand(10, min(20, $students->count()));
            $selectedStudents = $students->random($numStudents);

            foreach ($selectedStudents as $student) {
                $pairKey = $session->id . '-' . $student->id;
                if (!in_array($pairKey, $usedPairs)) {
                    $usedPairs[] = $pairKey;

                    $isLate = rand(1, 100) <= 15;
                    $status = $isLate ? 'late' : 'present';
                    $minutesLate = $isLate ? rand(5, 30) : 0;

                    $startTime = Carbon::parse($session->scheduled_start);
                    if ($isLate) {
                        $graceMinutes = $session->grace_period_minutes ?? 15;
                        $checkInTime = $startTime->copy()->addMinutes($graceMinutes + rand(1, 20));
                    } else {
                        $graceMinutes = $session->grace_period_minutes ?? 15;
                        $checkInTime = $startTime->copy()->addMinutes(rand(0, $graceMinutes));
                    }

                    $logs[] = [
                        'session_id' => $session->id,
                        'student_id' => $student->id,
                        'check_in_at' => $checkInTime,
                        'status' => $status,
                        'face_confidence' => rand(85, 99) / 100,
                        'location_lat' => 14.5995 + (rand(-100, 100) / 10000),
                        'location_lng' => 120.9842 + (rand(-100, 100) / 10000),
                        'minutes_late' => $minutesLate,
                        'remarks' => $isLate ? "Late by {$minutesLate} minutes" : null,
                        'created_at' => $checkInTime,
                        'updated_at' => $checkInTime,
                    ];
                }
            }
        }

        if (!empty($logs)) {
            $chunks = array_chunk($logs, 100);
            foreach ($chunks as $chunk) {
                DB::table('attendance_logs')->insert($chunk);
            }
        }
    }

    /**
     * Seed Learning Materials
     */
    private function seedLearningMaterials(): void
    {
        $materials = [
            [
                'class_id' => 1,
                'title' => 'CWTS Module 1: Introduction',
                'description' => 'Introduction to CWTS program. Overview of community service and civic welfare training.',
                'file_path' => 'learning_materials/1/cwts_module1.pdf',
                'file_name' => 'cwts_module1.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 1024000,
                'topic' => 'Introduction',
                'created_by' => 3,
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10),
            ],
            [
                'class_id' => 1,
                'title' => 'CWTS Module 2: Community Engagement',
                'description' => 'Understanding community engagement and its importance in CWTS.',
                'file_path' => 'learning_materials/1/cwts_module2.pdf',
                'file_name' => 'cwts_module2.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 2048000,
                'topic' => 'Community Engagement',
                'created_by' => 3,
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(7),
            ],
            [
                'class_id' => 4,
                'title' => 'ROTC Manual: Basic Training',
                'description' => 'ROTC Basic Training Manual. Covers military drills and discipline.',
                'file_path' => 'learning_materials/4/rotc_manual.pdf',
                'file_name' => 'rotc_manual.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 3072000,
                'topic' => 'Basic Training',
                'created_by' => 4,
                'created_at' => now()->subDays(14),
                'updated_at' => now()->subDays(14),
            ],
            [
                'class_id' => 6,
                'title' => 'LTS Module 1: Literacy Basics',
                'description' => 'Introduction to literacy training and teaching techniques.',
                'file_path' => 'learning_materials/6/lts_module1.pdf',
                'file_name' => 'lts_module1.pdf',
                'file_type' => 'application/pdf',
                'file_size' => 1536000,
                'topic' => 'Literacy Basics',
                'created_by' => 5,
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(8),
            ],
        ];

        DB::table('learning_materials')->insert($materials);
    }

    /**
     * Seed Notifications
     */
    private function seedNotifications(): void
    {
        $notifications = [];
        $students = DB::table('students')->get();

        $notificationTemplates = [
            [
                'title' => 'Welcome to NSTP',
                'message' => 'Welcome to the NSTP program! Please complete your registration and face registration.',
                'type' => 'announcement',
            ],
            [
                'title' => 'Activity Reminder',
                'message' => 'Don\'t forget to attend your scheduled NSTP activity this week.',
                'type' => 'reminder',
            ],
            [
                'title' => 'Document Verification',
                'message' => 'Your document has been verified. Check your status in the app.',
                'type' => 'update',
            ],
        ];

        foreach ($students as $student) {
            $numNotifications = rand(1, 3);
            $selectedTemplates = array_rand($notificationTemplates, min($numNotifications, count($notificationTemplates)));

            if (!is_array($selectedTemplates)) {
                $selectedTemplates = [$selectedTemplates];
            }

            foreach ($selectedTemplates as $index) {
                $template = $notificationTemplates[$index];
                $notifications[] = [
                    'user_id' => $student->user_id,
                    'title' => $template['title'],
                    'message' => $template['message'],
                    'type' => $template['type'],
                    'data' => json_encode(['student_id' => $student->id]),
                    'is_read' => (bool) rand(0, 1),
                    'read_at' => rand(0, 1) ? now()->subDays(rand(0, 5)) : null,
                    'created_at' => now()->subDays(rand(0, 10)),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($notifications)) {
            $chunks = array_chunk($notifications, 100);
            foreach ($chunks as $chunk) {
                DB::table('notifications')->insert($chunk);
            }
        }
    }

    /**
     * Seed Settings
     */
    private function seedSettings(): void
    {
        DB::table('settings')->insert([
            [
                'key' => 'app_name',
                'value' => 'NSTP Management System',
                'type' => 'string',
                'description' => 'Application name',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'training_hours_required',
                'value' => '90',
                'type' => 'integer',
                'description' => 'Total training hours required for completion',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'max_activity_registrations',
                'value' => '5',
                'type' => 'integer',
                'description' => 'Maximum number of activities a student can register for',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'default_grace_period',
                'value' => '15',
                'type' => 'integer',
                'description' => 'Default grace period in minutes for attendance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'face_confidence_threshold',
                'value' => '0.85',
                'type' => 'float',
                'description' => 'Minimum face recognition confidence threshold',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'allow_component_change',
                'value' => 'true',
                'type' => 'boolean',
                'description' => 'Allow students to request component changes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Seed Component Change Requests
     */
    private function seedComponentChangeRequests(): void
    {
        $students = DB::table('students')->get();
        $components = ['cwts', 'rotc', 'lts'];
        $requests = [];

        foreach ($students as $student) {
            if (rand(0, 1)) {
                $from = $student->nstp_component_selected;
                $to = $components[array_rand($components)];

                while ($to === $from) {
                    $to = $components[array_rand($components)];
                }

                $statuses = ['pending', 'approved', 'rejected'];
                $status = $statuses[array_rand($statuses)];

                $requests[] = [
                    'student_id' => $student->id,
                    'from_component' => $from,
                    'to_component' => $to,
                    'reason' => 'Personal preference for component change. I believe this component better fits my interests and career goals.',
                    'status' => $status,
                    'admin_remarks' => $status !== 'pending' ? 'Request ' . $status . ' by admin' : null,
                    'approved_by' => $status !== 'pending' ? rand(1, 2) : null,
                    'approved_at' => $status !== 'pending' ? now()->subDays(rand(0, 10)) : null,
                    'created_at' => now()->subDays(rand(0, 15)),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($requests)) {
            $chunks = array_chunk($requests, 100);
            foreach ($chunks as $chunk) {
                DB::table('component_change_requests')->insert($chunk);
            }
        }
    }

    /**
     * Seed Documents
     */
    private function seedDocuments(): void
    {
        $documents = [];
        $students = DB::table('students')->get();
        $documentTypes = ['Certificate of Registration', 'Good Moral Certificate', 'Medical Certificate', 'NSTP Waiver', 'Parent Consent'];
        $statuses = ['pending', 'approved', 'rejected'];

        foreach ($students as $student) {
            $numDocs = rand(1, 3);
            $selectedTypes = array_rand($documentTypes, min($numDocs, count($documentTypes)));

            if (!is_array($selectedTypes)) {
                $selectedTypes = [$selectedTypes];
            }

            foreach ($selectedTypes as $index) {
                $type = $documentTypes[$index];
                $status = $statuses[array_rand($statuses)];

                $documents[] = [
                    'student_id' => $student->id,
                    'document_type' => $type,
                    'file_path' => 'documents/' . $student->student_id . '/' . Str::slug($type) . '.pdf',
                    'file_name' => Str::slug($type) . '.pdf',
                    'file_type' => 'application/pdf',
                    'file_size' => rand(50000, 200000),
                    'extracted_text' => null,
                    'ocr_processed' => false,
                    'status' => $status,
                    'rejection_reason' => $status === 'rejected' ? 'Document is incomplete. Please resubmit with complete information.' : null,
                    'verified_by' => $status !== 'pending' ? rand(1, 2) : null,
                    'verified_at' => $status !== 'pending' ? now()->subDays(rand(0, 5)) : null,
                    'created_at' => now()->subDays(rand(0, 10)),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($documents)) {
            $chunks = array_chunk($documents, 100);
            foreach ($chunks as $chunk) {
                DB::table('documents')->insert($chunk);
            }
        }
    }

    /**
     * Seed Certificates
     */
    private function seedCertificates(): void
    {
        $certificates = [];
        $students = DB::table('students')->get();
        $certTypes = ['completion', 'participation', 'training'];
        $statuses = ['issued', 'draft', 'revoked'];

        $adminUsers = DB::table('users')->whereIn('role', ['admin', 'super_admin'])->get();
        $adminIds = $adminUsers->pluck('id')->toArray();

        $defaultIssuerId = !empty($adminIds) ? $adminIds[0] : 1;

        foreach ($students as $student) {
            if ($student->completed_training_hours >= 90 && rand(0, 1)) {
                $certType = $certTypes[array_rand($certTypes)];
                $status = $statuses[array_rand($statuses)];
                $certNumber = 'NSTP-' . date('Y') . '-' . Str::upper(Str::random(8));

                $issuedBy = null;
                $issuedAt = null;

                if ($status === 'issued') {
                    $issuedBy = $defaultIssuerId;
                    $issuedAt = now()->subDays(rand(0, 10))->toDateTimeString();
                } elseif ($status === 'draft') {
                    $issuedBy = null;
                    $issuedAt = null;
                } else {
                    $issuedBy = $defaultIssuerId;
                    $issuedAt = now()->subDays(rand(0, 15))->toDateTimeString();
                }

                $certificates[] = [
                    'student_id' => $student->id,
                    'certificate_number' => $certNumber,
                    'certificate_type' => $certType,
                    'activity_id' => null,
                    'file_path' => 'certificates/' . $certNumber . '.pdf',
                    'qr_code_path' => 'certificates/qrcodes/' . $certNumber . '.png',
                    'description' => $certType . ' certificate for ' . $student->student_id,
                    'status' => $status,
                    'issued_by' => $issuedBy,
                    'issued_at' => $issuedAt,
                    'created_at' => now()->subDays(rand(0, 15)),
                    'updated_at' => now(),
                ];
            }
        }

        if (!empty($certificates)) {
            $chunks = array_chunk($certificates, 100);
            foreach ($chunks as $chunk) {
                DB::table('certificates')->insert($chunk);
            }
        }
    }

    /**
     * Seed Memos (Office Documents)
     */
    private function seedMemos(): void
    {
        DB::table('memos')->insert([
            [
                'title' => 'NSTP Office Memo: Schedule Changes',
                'content' => 'All NSTP schedules for the second semester have been updated. Please check the new schedule posted on the bulletin board.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'all',
                'is_urgent' => false,
                'status' => 'published',
                'created_by' => 2,
                'published_at' => now()->subDays(5),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
            [
                'title' => 'Memo: Face Registration Schedule',
                'content' => 'Face registration for students will be held from Monday to Friday, 9:00 AM to 4:00 PM at the NSTP office.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'students',
                'is_urgent' => true,
                'status' => 'published',
                'created_by' => 1,
                'published_at' => now()->subDays(3),
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3),
            ],
            [
                'title' => 'Memo: CWTS Activity Guidelines',
                'content' => 'Updated guidelines for CWTS community service activities. Please read carefully before starting your community service.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'cwts',
                'is_urgent' => false,
                'status' => 'published',
                'created_by' => 3,
                'published_at' => now()->subDays(7),
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(7),
            ],
            [
                'title' => 'Memo: ROTC Training Schedule',
                'content' => 'ROTC training schedule has been updated. Please check the new schedule for your section.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'rotc',
                'is_urgent' => false,
                'status' => 'published',
                'created_by' => 4,
                'published_at' => now()->subDays(4),
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(4),
            ],
            [
                'title' => 'Memo: LTS Community Outreach',
                'content' => 'LTS community outreach program will be held next week. All LTS students are required to attend.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'lts',
                'is_urgent' => true,
                'status' => 'published',
                'created_by' => 5,
                'published_at' => now()->subDays(2),
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'title' => 'Memo: Faculty Meeting',
                'content' => 'All NSTP faculty members are required to attend the monthly meeting on Friday at 3:00 PM.',
                'file_path' => null,
                'file_name' => null,
                'target_audience' => 'faculty',
                'is_urgent' => false,
                'status' => 'published',
                'created_by' => 1,
                'published_at' => now()->subDays(1),
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ],
        ]);
    }

    /**
     * Print login credentials for all users
     */
    private function printLoginCredentials(): void
    {
        $this->command->info('🔑 Login Credentials:');
        $this->command->info('========================================');
        $this->command->info('');
        $this->command->info('👑 SUPER ADMIN:');
        $this->command->info('   Email: superadmin@nstp.edu');
        $this->command->info('   Password: password');
        $this->command->info('');
        $this->command->info('👤 ADMIN:');
        $this->command->info('   Email: admin@nstp.edu');
        $this->command->info('   Password: password');
        $this->command->info('');
        $this->command->info('👨‍🏫 FACULTY (with class codes):');
        $this->command->info('   CWTS: faculty.cwts@nstp.edu / password  → Class Code: CWTS-A1');
        $this->command->info('   ROTC: faculty.rotc@nstp.edu / password  → Class Code: ROTC-A1');
        $this->command->info('   LTS:  faculty.lts@nstp.edu  / password  → Class Code: LTS-A1');
        $this->command->info('');
        $this->command->info('🎓 STUDENTS:');
        $this->command->info('   Format: studentX@nstp.edu (X = 6-55)');
        $this->command->info('   Password: password');
        $this->command->info('   Example: student6@nstp.edu / password');
        $this->command->info('   Example: student10@nstp.edu / password');
        $this->command->info('');
        $this->command->info('📱 First 5 Students:');
        $this->command->info('   1. student6@nstp.edu / password (STU-0006)');
        $this->command->info('   2. student7@nstp.edu / password (STU-0007)');
        $this->command->info('   3. student8@nstp.edu / password (STU-0008)');
        $this->command->info('   4. student9@nstp.edu / password (STU-0009)');
        $this->command->info('   5. student10@nstp.edu / password (STU-0010)');
        $this->command->info('');
        $this->command->info('📌 Class Codes are the join codes students use to enroll.');
        $this->command->info('   Every class created by a faculty shares the same code.');
        $this->command->info('========================================');
        $this->command->info('✅ All accounts use "password" as the default password.');
        $this->command->info('📌 Please change passwords after first login.');
        $this->command->info('========================================');
    }
}
