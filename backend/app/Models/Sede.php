<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sede extends Model
{
    protected $fillable = [
        'nombre', 'slug', 'descripcion', 'direccion', 'ciudad',
        'telefono', 'email', 'logo_url', 'vista_principal', 'activo',
    ];

    protected function casts(): array
    {
        return ['activo' => 'boolean'];
    }

    public function habitaciones(): HasMany
    {
        return $this->hasMany(Habitacion::class);
    }
}
