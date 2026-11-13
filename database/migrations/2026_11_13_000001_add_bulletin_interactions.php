<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bulletin_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulletin_id')->constrained('bulletin_board')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('bulletin_comments')->cascadeOnDelete();
            $table->string('client_id', 80);
            $table->text('body');
            $table->timestamps();
            $table->unique(['user_id', 'client_id']);
            $table->index(['bulletin_id', 'id']);
        });
        foreach (['bulletin_likes', 'bulletin_follows'] as $name) {
            Schema::create($name, function (Blueprint $table) {
                $table->id();
                $table->foreignId('bulletin_id')->constrained('bulletin_board')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();
                $table->unique(['bulletin_id', 'user_id']);
            });
        }
        Schema::create('bulletin_notification_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulletin_id')->unique()->constrained('bulletin_board')->cascadeOnDelete();
            $table->string('kind', 12);
            $table->foreignId('actor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('due_at')->index();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletin_notification_events');
        Schema::dropIfExists('bulletin_follows');
        Schema::dropIfExists('bulletin_likes');
        Schema::dropIfExists('bulletin_comments');
    }
};
