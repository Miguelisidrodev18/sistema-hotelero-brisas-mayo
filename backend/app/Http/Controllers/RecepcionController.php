<?php

namespace App\Http\Controllers;

use App\Models\Habitacion;
use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Support\Carbon;

class RecepcionController extends Controller
{
    public function hoy()
    {
        $hoy = Carbon::today();

        $llegadas = Reserva::with([
            'cliente:id,name,email,telefono,dni',
            'habitacion:id,numero,tipo,piso',
            'sede:id,nombre',
        ])
        ->withSum(['pagos as total_pagado' => fn($q) => $q->where('estado', 'verificado')], 'monto')
        ->where('estado', 'confirmada')
        ->whereDate('fecha_entrada', $hoy)
        ->orderBy('fecha_entrada')
        ->get()
        ->map(function ($r) {
            $r->saldo_pendiente = max(0, round($r->precio_total - ($r->total_pagado ?? 0), 2));
            return $r;
        });

        $salidas = Reserva::with([
            'cliente:id,name,email,telefono,dni',
            'habitacion:id,numero,tipo,piso',
            'sede:id,nombre',
        ])
        ->where('estado', 'checkin')
        ->whereDate('fecha_salida', $hoy)
        ->orderBy('fecha_salida')
        ->get();

        $enHotel    = Reserva::where('estado', 'checkin')->count();
        $disponibles = Habitacion::where('estado', 'disponible')->count();
        $ocupadas    = Habitacion::where('estado', 'ocupada')->count();
        $limpieza    = Habitacion::where('estado', 'limpieza')->count();

        $ingresosDia = Pago::whereDate('fecha_pago', $hoy)
            ->where('estado', 'verificado')
            ->sum('monto');

        return response()->json([
            'llegadas'    => $llegadas,
            'salidas'     => $salidas,
            'stats' => [
                'llegadas'    => $llegadas->count(),
                'salidas'     => $salidas->count(),
                'en_hotel'    => $enHotel,
                'disponibles' => $disponibles,
                'ocupadas'    => $ocupadas,
                'limpieza'    => $limpieza,
                'ingresos_dia' => $ingresosDia,
            ],
        ]);
    }

    public function cajaDiaria()
    {
        $fecha = request('fecha', now()->toDateString());

        $pagos = Pago::with([
            'reserva:id,codigo,habitacion_id,sede_id',
            'reserva.habitacion:id,numero,tipo',
            'reserva.sede:id,nombre',
            'cliente:id,name',
        ])
        ->whereDate('fecha_pago', $fecha)
        ->where('estado', 'verificado')
        ->orderBy('fecha_pago')
        ->get();

        $totalPorMetodo = $pagos->groupBy('metodo_pago')->map(fn ($g) => [
            'cantidad' => $g->count(),
            'total'    => $g->sum('monto'),
        ]);

        return response()->json([
            'fecha'           => $fecha,
            'pagos'           => $pagos,
            'total_general'   => $pagos->sum('monto'),
            'total_por_metodo'=> $totalPorMetodo,
        ]);
    }
}
