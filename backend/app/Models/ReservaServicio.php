<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservaServicio extends Model
{
    protected $table    = 'reserva_servicios';
    protected $fillable = ['reserva_id', 'servicio_id', 'cantidad', 'precio_unitario', 'subtotal', 'registrado_por'];

    protected function casts(): array
    {
        return ['precio_unitario' => 'decimal:2', 'subtotal' => 'decimal:2'];
    }

    public function reserva(): BelongsTo   { return $this->belongsTo(Reserva::class); }
    public function servicio(): BelongsTo  { return $this->belongsTo(Servicio::class); }
    public function registrado(): BelongsTo { return $this->belongsTo(User::class, 'registrado_por'); }
}
