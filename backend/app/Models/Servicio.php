<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Servicio extends Model
{
    protected $fillable = ['nombre', 'categoria', 'descripcion', 'precio', 'activo'];

    protected function casts(): array
    {
        return ['precio' => 'decimal:2', 'activo' => 'boolean'];
    }
}
