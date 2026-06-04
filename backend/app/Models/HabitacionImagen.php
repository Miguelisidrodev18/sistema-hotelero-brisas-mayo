<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class HabitacionImagen extends Model
{
    public $timestamps = false;
    const CREATED_AT   = 'created_at';

    protected $table = 'habitacion_imagenes';

    protected $fillable = ['habitacion_id', 'path', 'orden'];

    protected $appends = ['url'];

    public function habitacion(): BelongsTo
    {
        return $this->belongsTo(Habitacion::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
