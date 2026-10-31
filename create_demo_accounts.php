<?php
// Create demo accounts for all user types
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$exitCode = $kernel->bootstrap();
if ($exitCode !== 0) {
    echo "Failed to bootstrap\n";
    exit(1);
}

use App\Models\User;
use Illuminate\Support\Hash;

// Create all demo accounts
$accounts = [
    // Super Admin
    [
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'email' => 'superadmin@nstp.edu',
        'password' => 'password',
        'role' => 'super_admin',
        'student_id' => 'SA001',
    ],
    // Admin
    [
        'first_name' => 'Admin',
        'last_name' => 'User',
        'email' => 'admin@nstp.edu',
        'password' => 'password',
        'role' => 'admin',
        'student_id' => 'ADM001',
    ],
    // Faculty CWTS
    [
        'first_name' => 'Faculty',
        'last_name' => 'CWTS',
        'email' => 'faculty.cwts@nstp.edu',
        'password' => 'password',
        'role' => 'faculty',
        'student_id' => 'FAC001',
    ],
    // Faculty ROTC
    [
        'first_name' => 'Faculty',
        'last_name' => 'ROTC',
        'email' => 'faculty.rotc@nstp.edu',
        'password' => 'password',
        'role' => 'faculty',
        'student_id' => 'FAC002',
    ],
    // Faculty LTS
    [
        'first_name' => 'Faculty',
        'last_name' => 'LTS',
        'email' => 'faculty.lts@nstp.edu',
        'password' => 'password',
        'role' => 'faculty',
        'student_id' => 'FAC003',
    ],
    // Student 1
    [
        'first_name' => 'Student',
        'last_name' => 'One',
        'email' => 'student1@nstp.edu',
        'password' => 'password',
        'role' => 'student',
        'student_id' => 'STD001',
    ],
    // Student 2
    [
        'first_name' => 'Student',
        'last_name' => 'Two',
        'email' => 'student2@nstp.edu',
        'password' => 'password',
        'role' => 'student',
        'student_id' => 'STD002',
    ],
];

foreach ($accounts as $account) {
    // Check if user already exists
    $exists = User::where('email', $account['email'])->exists();
    if ($exists) {
        echo "Skipping {$account['email']} - already exists\n";
        continue;
    }
    
    $user = User::create([
        'first_name' => $account['first_name'],
        'last_name' => $account['last_name'],
        'email' => $account['email'],
        'password' => Hash::make($account['password']),
        'role' => $account['role'],
        'student_id' => $account['student_id'],
        'contact_number' => '09123456789',
    ]);
    
    echo "Created: {$account['email']} ({$account['role']}) - ID: {$user->id}\n";
}

echo "\nAll demo accounts created successfully!\n";