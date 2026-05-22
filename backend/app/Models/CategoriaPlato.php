<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaPlato extends Model
{
    protected $table = 'categorias_plato';

    protected $fillable = ['nombre', 'descripcion', 'orden', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public function platos()
    {
        return $this->hasMany(Plato::class, 'categoria_id');
    }
}
