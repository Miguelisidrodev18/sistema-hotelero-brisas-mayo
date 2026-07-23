<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mesa extends Model
{
    protected $fillable = ['numero', 'capacidad', 'estado'];

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }
}
