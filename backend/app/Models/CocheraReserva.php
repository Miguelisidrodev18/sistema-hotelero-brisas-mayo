<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CocheraReserva extends Model
{
    protected $fillable = [
        'cochera_id', 'user_id', 'reserva_id', 'codigo',
        'fecha_entrada', 'fecha_salida', 'precio_noche', 'precio_total',
        'estado', 'placa', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_entrada' => 'date',
            'fecha_salida'  => 'date',
            'precio_noche'  => 'decimal:2',
            'precio_total'  => 'decimal:2',
        ];
    }

    public function cochera(): BelongsTo
    {
        return $this->belongsTo(Cochera::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reservaHabitacion(): BelongsTo
    {
        return $this->belongsTo(Reserva::class, 'reserva_id');
    }

    public function getNochesAttribute(): int
    {
        return $this->fecha_entrada->diffInDays($this->fecha_salida);
    }
}
