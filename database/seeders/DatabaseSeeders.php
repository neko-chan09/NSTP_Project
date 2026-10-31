<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Seeds ONLY:
     *  - 1 Super Admin
     *  - 3 Admins
     *  - 6 Faculty (2 per NSTP component: CWTS / ROTC / LTS)
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting NSTP Database Seeder...');
        $this->command->info('');

        // ============================================================
        // USERS
        // ============================================================
        $this->command->info('📝 Seeding Users...');
        $this->seedUsers();
        $this->command->info('✅ Users seeded successfully');
        $this->command->info('');

        // ============================================================
        // SUMMARY
        // ============================================================
        $this->command->info('========================================');
        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('========================================');
        $this->command->info('');
        $this->printLoginCredentials();
    }

    /**
     * Seed the 10 users.
     */
    private function seedUsers(): void
    {
        $now = now();

        $users = [
            // ─────────────────────────────────────────────────────
            // 1 SUPER ADMIN
            // ─────────────────────────────────────────────────────
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
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // ─────────────────────────────────────────────────────
            // 3 ADMINS
            // ─────────────────────────────────────────────────────
            [
                'id' => 2,
                'first_name' => 'Admin',
                'last_name' => 'One',
                'middle_name' => null,
                'email' => 'admin1@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'student_id' => null,
                'nstp_component' => null,
                'class_code' => null,
                'course' => null,
                'year_level' => null,
                'section' => null,
                'contact_number' => '09172345671',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 3,
                'first_name' => 'Admin',
                'last_name' => 'Two',
                'middle_name' => null,
                'email' => 'admin2@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'student_id' => null,
                'nstp_component' => null,
                'class_code' => null,
                'course' => null,
                'year_level' => null,
                'section' => null,
                'contact_number' => '09172345672',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 4,
                'first_name' => 'Admin',
                'last_name' => 'Three',
                'middle_name' => null,
                'email' => 'admin3@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'student_id' => null,
                'nstp_component' => null,
                'class_code' => null,
                'course' => null,
                'year_level' => null,
                'section' => null,
                'contact_number' => '09172345673',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // ─────────────────────────────────────────────────────
            // 6 FACULTY (2 CWTS, 2 ROTC, 2 LTS)
            // ─────────────────────────────────────────────────────
            // CWTS #1
            [
                'id' => 5,
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => 'Cruz',
                'email' => 'faculty.cwts1@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'cwts',
                'class_code' => 'CWTS-A1',
                'course' => 'BSIT',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09173456781',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // CWTS #2
            [
                'id' => 6,
                'first_name' => 'Andrea',
                'last_name' => 'Reyes',
                'middle_name' => 'Lopez',
                'email' => 'faculty.cwts2@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'cwts',
                'class_code' => 'CWTS-A2',
                'course' => 'BSBA',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09173456782',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // ROTC #1
            [
                'id' => 7,
                'first_name' => 'Jose',
                'last_name' => 'Reyes',
                'middle_name' => 'Mendoza',
                'email' => 'faculty.rotc1@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'rotc',
                'class_code' => 'ROTC-A1',
                'course' => 'BEED',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09174567891',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // ROTC #2
            [
                'id' => 8,
                'first_name' => 'Ramon',
                'last_name' => 'Cruz',
                'middle_name' => 'Vega',
                'email' => 'faculty.rotc2@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'rotc',
                'class_code' => 'ROTC-A2',
                'course' => 'BSIT',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09174567892',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // LTS #1
            [
                'id' => 9,
                'first_name' => 'Ana',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'email' => 'faculty.lts1@nstp.edu',
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
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // LTS #2
            [
                'id' => 10,
                'first_name' => 'Lucia',
                'last_name' => 'Fernandez',
                'middle_name' => 'Ramos',
                'email' => 'faculty.lts2@nstp.edu',
                'password' => Hash::make('password'),
                'role' => 'faculty',
                'student_id' => null,
                'nstp_component' => 'lts',
                'class_code' => 'LTS-A2',
                'course' => 'BEED',
                'year_level' => null,
                'section' => null,
                'contact_number' => '09175678902',
                'is_active' => true,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('users')->insert($users);
    }

    /**
     * Print login credentials.
     */
    private function printLoginCredentials(): void
    {
        $this->command->info('🔑 Login Credentials (password: "password" for all):');
        $this->command->info('========================================');
        $this->command->info('');
        $this->command->info('👑 SUPER ADMIN:');
        $this->command->info('   Email: superadmin@nstp.edu');
        $this->command->info('');
        $this->command->info('👤 ADMINS:');
        $this->command->info('   admin1@nstp.edu');
        $this->command->info('   admin2@nstp.edu');
        $this->command->info('   admin3@nstp.edu');
        $this->command->info('');
        $this->command->info('👨‍🏫 FACULTY (with class codes):');
        $this->command->info('   CWTS 1: faculty.cwts1@nstp.edu   → CWTS-A1');
        $this->command->info('   CWTS 2: faculty.cwts2@nstp.edu   → CWTS-A2');
        $this->command->info('   ROTC 1: faculty.rotc1@nstp.edu   → ROTC-A1');
        $this->command->info('   ROTC 2: faculty.rotc2@nstp.edu   → ROTC-A2');
        $this->command->info('   LTS 1:  faculty.lts1@nstp.edu    → LTS-A1');
        $this->command->info('   LTS 2:  faculty.lts2@nstp.edu    → LTS-A2');
        $this->command->info('');
        $this->command->info('========================================');
        $this->command->info('📌 Total users seeded: 10');
        $this->command->info('   1 Super Admin • 3 Admins • 6 Faculty');
        $this->command->info('========================================');
    }
}
