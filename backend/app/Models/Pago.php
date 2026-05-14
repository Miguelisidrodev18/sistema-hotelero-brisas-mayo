<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $fillable = [
        'reserva_id', 'user_id', 'registrado_por',
        'monto', 'metodo_pago', 'estado',
        'referencia', 'comprobante_url', 'notas', 'fecha_pago',
    ];

    protected function casts(): array
    {
        return [
            'monto'      => 'decimal:2',
            'fecha_pago' => 'datetime',
        ];
    }

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
