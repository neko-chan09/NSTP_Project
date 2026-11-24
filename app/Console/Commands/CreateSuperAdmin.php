<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AuditTrail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdmin extends Command
{
    protected $signature = 'nstp:create-superadmin {email} {--name=} {--contact=}';
    protected $description = 'Create a new Super Admin using a hidden temporary-password prompt';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $name = trim((string) $this->option('name'));
        $contact = trim((string) $this->option('contact'));
        $validator = Validator::make(compact('email', 'name', 'contact'), [
            'email' => 'required|email|max:255', 'name' => 'required|string|max:80',
            'contact' => ['required', 'regex:/^\+?[0-9]{7,20}$/'],
        ]);
        if ($validator->fails()) { $this->error($validator->errors()->first()); return self::FAILURE; }
        if (!Schema::hasTable('audit_events') || !Schema::hasColumn('users', 'must_change_password')) {
            $this->error('Apply the existing recovery and audit migrations before creating this account.');
            return self::FAILURE;
        }
        if (User::withTrashed()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
            $this->error('An account already uses this email. No account was changed or promoted.');
            return self::FAILURE;
        }
        if (!$this->input->isInteractive()) {
            $this->error('Run interactively to enter a temporary password securely.'); return self::FAILURE;
        }
        $password = $this->secret('Temporary password (at least 12 characters)', false);
        $confirmation = $this->secret('Confirm temporary password', false);
        if (!is_string($password) || strlen($password) < 12 || $password !== $confirmation) {
            $this->error('Passwords must match and contain at least 12 characters. No account was created.');
            return self::FAILURE;
        }
        DB::transaction(function () use ($email, $name, $contact, $password) {
            $user = User::create([
                'first_name' => $name, 'last_name' => '', 'email' => $email,
                'contact_number' => $contact, 'password' => Hash::make($password),
                'role' => 'super_admin', 'is_active' => true, 'must_change_password' => true,
            ]);
            AuditTrail::record(null, 'account.superadmin_created', 'user', $user->id,
                'Created from the authorized server console', ['role' => 'super_admin', 'must_change_password' => true]);
        });
        $this->info('Super Admin created. Sign in with the temporary password and change it immediately.');
        return self::SUCCESS;
    }
}
