<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PedidoItem extends Model
{
    public $timestamps = false;

    protected $fillable = ['pedido_id', 'plato_id', 'cantidad', 'precio_unitario', 'subtotal', 'notas'];

    protected $casts = ['precio_unitario' => 'decimal:2', 'subtotal' => 'decimal:2'];

    public function plato()
    {
        return $this->belongsTo(Plato::class);
    }
}
