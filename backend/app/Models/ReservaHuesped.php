<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservaHuesped extends Model
{
    public $timestamps   = false;
    const CREATED_AT     = 'created_at';

    protected $table = 'reserva_huespedes';

    protected $fillable = ['reserva_id', 'nombre', 'dni'];

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }
}
