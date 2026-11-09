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
        $this->command->info('');
        $this->command->info('========================================');
        $this->command->info('   1 Super Admin • 3 Admins');
        $this->command->info('========================================');
    }
}
