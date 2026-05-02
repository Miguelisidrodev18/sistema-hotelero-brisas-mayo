<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Habitacion extends Model
{
    protected $table = 'habitaciones';

    protected $fillable = [
        'sede_id', 'numero', 'tipo', 'capacidad', 'precio',
        'piso', 'tiene_vista', 'estado', 'descripcion',
    ];

    protected function casts(): array
    {
        return ['tiene_vista' => 'boolean'];
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function tipoLabel(): string
    {
        return match($this->tipo) {
            'matrimonial'          => 'Matrimonial',
            'matrimonial_king'     => 'Matrimonial KIN',
            'matrimonial_queen'    => 'Matrimonial Queen',
            'matrimonial_adicional'=> 'Matrimonial + Adicional',
            'doble'                => 'Doble',
            'triple'               => 'Triple',
            default                => ucfirst($this->tipo),
        };
    }
}
