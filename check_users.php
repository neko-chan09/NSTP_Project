<?php
// check_users.php
require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Check user table structure
$users = \Illuminate\Support\Facades\DB::table('users')->limit(5)->get();
foreach ($users as $u) {
    echo 'ID: ' . $u->id . ' | Email: ' . $u->email . ' | Role: ' . ($u->role ?? 'NULL') . PHP_EOL;
}
echo PHP_EOL . 'Checking role distribution:' . PHP_EOL;
$roles = \Illuminate\Support\Facades\DB::table('users')->select('role')->distinct()->pluck('role');
foreach ($roles as $role) {
    $count = \Illuminate\Support\Facades\DB::table('users')->where('role', $role)->count();
    echo 'Role: ' . $role . ' -> ' . $count . ' users' . PHP_EOL;
}