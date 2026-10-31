<?php
// reset_passwords.php
require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the User model
$userClass = 'App\\Http\\Models\\User'; // Try common namespace

// Or get it from the auth facade
$auth = new class {
    public function getProvider() {
        return new class {
            public function getModel() {
                return 'App\\Models\\User';
            }
        };
    }
};

echo "Trying User class: App\Models\User" . PHP_EOL;

// Reset passwords for super_admin, admin, faculty
$roles = ['super_admin', 'admin', 'faculty'];

foreach ($roles as $role) {
    $user = \App\Models\User::where('role', $role)->first();
    if ($user) {
        echo "Role: " . $user->role . " | Email: " . $user->email . " | ID: " . $user->id . PHP_EOL;
        // Set password to 'password' using Laravel's hash
        $user->password = bcrypt('password');
        $user->save();
        echo "  -> Reset to bcrypt password" . PHP_EOL;
        
        // Verify
        $isValid = password_verify('password', $user->password);
        echo "  -> Verify 'password': " . ($isValid ? 'YES' : 'NO') . PHP_EOL;
    } else {
        echo "Role: " . $role . " -> Not found" . PHP_EOL;
    }
}
echo "Done resetting passwords!" . PHP_EOL;