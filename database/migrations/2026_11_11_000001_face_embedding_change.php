<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('face_embeddings', function (Blueprint $table) {
            // One row per pose per student: blocks duplicate/concurrent registration.
            $table->unique(['student_id', 'pose'], 'face_embeddings_student_pose_unique');
        });
    }

    public function down(): void
    {
        Schema::table('face_embeddings', function (Blueprint $table) {
            $table->dropUnique('face_embeddings_student_pose_unique');
        });
    }
};