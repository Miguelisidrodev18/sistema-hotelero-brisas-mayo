<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CodigoDescuento extends Model
{
    protected $table    = 'codigos_descuento';
    protected $fillable = ['codigo', 'descripcion', 'activo', 'fecha_vencimiento', 'created_by'];

    protected function casts(): array
    {
        return [
            'activo'            => 'boolean',
            'fecha_vencimiento' => 'date',
        ];
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reservas(): HasMany
    {
        return $this->hasMany(Reserva::class);
    }

    public function isValido(): bool
    {
        if (!$this->activo) return false;
        if ($this->fecha_vencimiento && $this->fecha_vencimiento->isPast()) return false;
        return true;
    }

    public function getEstadoAttribute(): string
    {
        if (!$this->activo) return 'inactivo';
        if ($this->fecha_vencimiento && $this->fecha_vencimiento->isPast()) return 'vencido';
        return 'activo';
    }
}
