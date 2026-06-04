<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
// ReservaServicio resolved at runtime — avoid circular import at model level

class Reserva extends Model
{
    protected $fillable = [
        'grupo_id',
        'user_id', 'habitacion_id', 'sede_id', 'created_by',
        'fecha_entrada', 'fecha_salida', 'hora_checkin', 'hora_checkout', 'num_huespedes',
        'precio_noche', 'precio_total', 'precio_original',
        'descuento_porcentaje', 'descuento_motivo',
        'origen', 'estado', 'codigo', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_entrada' => 'date',
            'fecha_salida'  => 'date',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function habitacion(): BelongsTo
    {
        return $this->belongsTo(Habitacion::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function servicios(): HasMany
    {
        return $this->hasMany(ReservaServicio::class);
    }

    public function huespedes(): HasMany
    {
        return $this->hasMany(ReservaHuesped::class);
    }

    public function getNochesAttribute(): int
    {
        return $this->fecha_entrada->diffInDays($this->fecha_salida);
    }
}
