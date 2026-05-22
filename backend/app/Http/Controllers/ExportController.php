<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Reserva;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function reservasPdf(Request $request)
    {
        $q = Reserva::with([
            'cliente:id,name,email',
            'habitacion:id,numero,tipo',
            'sede:id,nombre',
        ])->latest();

        if ($request->filled('estado'))      $q->where('estado', $request->estado);
        if ($request->filled('sede_id'))     $q->where('sede_id', $request->sede_id);
        if ($request->filled('fecha_desde')) $q->whereDate('fecha_entrada', '>=', $request->fecha_desde);
        if ($request->filled('fecha_hasta')) $q->whereDate('fecha_entrada', '<=', $request->fecha_hasta);

        $reservas = $q->limit(500)->get();
        $filtro   = $request->filled('estado') ? ucfirst($request->estado) : 'Todos los estados';

        $pdf = Pdf::loadView('exports.reservas', compact('reservas', 'filtro'))
            ->setPaper('a4', 'landscape');

        return $pdf->download("reservas-{$filtro}-" . now()->format('Ymd') . '.pdf');
    }

    public function pagosPdf(Request $request)
    {
        $q = Pago::with([
            'reserva:id,codigo,habitacion_id,sede_id',
            'reserva.cliente:id,name,email',
            'reserva.habitacion:id,numero',
            'reserva.sede:id,nombre',
        ])->latest('fecha_pago');

        if ($request->filled('estado'))      $q->where('estado', $request->estado);
        if ($request->filled('metodo_pago')) $q->where('metodo_pago', $request->metodo_pago);
        if ($request->filled('fecha_desde')) $q->whereDate('fecha_pago', '>=', $request->fecha_desde);
        if ($request->filled('fecha_hasta')) $q->whereDate('fecha_pago', '<=', $request->fecha_hasta);

        $pagos  = $q->limit(500)->get();
        $filtro = $request->filled('estado') ? ucfirst($request->estado) : 'Todos los estados';

        $resumen = $pagos->groupBy('metodo_pago')->map(fn ($g) => [
            'cantidad' => $g->count(),
            'total'    => $g->sum('monto'),
        ]);

        $pdf = Pdf::loadView('exports.pagos', compact('pagos', 'filtro', 'resumen'))
            ->setPaper('a4', 'landscape');

        return $pdf->download("pagos-{$filtro}-" . now()->format('Ymd') . '.pdf');
    }
}
