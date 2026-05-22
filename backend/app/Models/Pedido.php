<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    protected $fillable = ['user_id', 'codigo', 'estado', 'metodo_pago', 'pagado', 'total', 'notas'];

    protected $casts = ['pagado' => 'boolean', 'total' => 'decimal:2'];

    public function items()
    {
        return $this->hasMany(PedidoItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
