<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarifaTemporada extends Model
{
    protected $table    = 'tarifas_temporada';
    protected $fillable = ['nombre', 'sede_id', 'fecha_inicio', 'fecha_fin', 'factor', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin'    => 'date',
            'factor'       => 'decimal:2',
            'activo'       => 'boolean',
        ];
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }
}
