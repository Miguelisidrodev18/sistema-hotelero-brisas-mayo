<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cochera extends Model
{
    protected $fillable = [
        'sede_id', 'numero', 'tipo', 'estado',
        'precio_noche', 'descripcion', 'activo',
    ];

    protected function casts(): array
    {
        return ['precio_noche' => 'decimal:2', 'activo' => 'boolean'];
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function cocheraReservas(): HasMany
    {
        return $this->hasMany(CocheraReserva::class);
    }
}
