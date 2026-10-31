<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BulletinBoard extends Model
{
    // Explicitly set the table name (singular)
    protected $table = 'bulletin_board';

    protected $fillable = [
        'title', 'content', 'category', 'target_audience', 'image_path',
        'display_from', 'display_until', 'is_featured', 'views', 'created_by'
    ];

    protected $casts = [
        'display_from' => 'datetime',
        'display_until' => 'datetime',
        'is_featured' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}