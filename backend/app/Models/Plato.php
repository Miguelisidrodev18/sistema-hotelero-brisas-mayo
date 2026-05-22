<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plato extends Model
{
    protected $fillable = ['categoria_id', 'nombre', 'descripcion', 'precio', 'imagen_url', 'disponible'];

    protected $casts = ['disponible' => 'boolean', 'precio' => 'decimal:2'];

    public function categoria()
    {
        return $this->belongsTo(CategoriaPlato::class, 'categoria_id');
    }
}
