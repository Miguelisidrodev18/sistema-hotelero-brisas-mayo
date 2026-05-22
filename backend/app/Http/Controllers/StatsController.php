<?php

namespace App\Http\Controllers;

use App\Models\Habitacion;
use App\Models\Pago;
use App\Models\Reserva;
use App\Models\Sede;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function dashboard()
    {
        $hoy      = now();
        $inicioMes = $hoy->copy()->startOfMonth();
        $finMes    = $hoy->copy()->endOfMonth();
        $inicioMesAnterior = $hoy->copy()->subMonth()->startOfMonth();
        $finMesAnterior    = $hoy->copy()->subMonth()->endOfMonth();

        // ── KPIs ────────────────────────────────────────────────
        $ingresosMes = Pago::whereBetween('fecha_pago', [$inicioMes, $finMes])
            ->where('estado', 'verificado')
            ->sum('monto');

        $ingresosMesAnterior = Pago::whereBetween('fecha_pago', [$inicioMesAnterior, $finMesAnterior])
            ->where('estado', 'verificado')
            ->sum('monto');

        $reservasMes = Reserva::whereBetween('created_at', [$inicioMes, $finMes])
            ->whereNotIn('estado', ['cancelada', 'expirada'])
            ->count();

        $reservasMesAnterior = Reserva::whereBetween('created_at', [$inicioMesAnterior, $finMesAnterior])
            ->whereNotIn('estado', ['cancelada', 'expirada'])
            ->count();

        $totalHabitaciones = Habitacion::count();
        $ocupadas = Habitacion::where('estado', 'ocupada')->count();
        $tasaOcupacion = $totalHabitaciones > 0 ? round(($ocupadas / $totalHabitaciones) * 100) : 0;

        $pagosVerificadosHoy = Pago::whereDate('fecha_pago', today())
            ->where('estado', 'verificado')
            ->sum('monto');

        // ── Ingresos últimos 6 meses ─────────────────────────────
        $ingresosMensuales = collect(range(5, 0))->map(function ($n) use ($hoy) {
            $fecha  = $hoy->copy()->subMonths($n);
            $inicio = $fecha->copy()->startOfMonth();
            $fin    = $fecha->copy()->endOfMonth();
            $monto  = Pago::whereBetween('fecha_pago', [$inicio, $fin])
                ->where('estado', 'verificado')
                ->sum('monto');
            return [
                'mes'   => $fecha->locale('es')->isoFormat('MMM'),
                'year'  => $fecha->year,
                'monto' => (float) $monto,
            ];
        })->values();

        // ── Reservas por estado ──────────────────────────────────
        $reservasPorEstado = Reserva::select('estado', DB::raw('count(*) as total'))
            ->groupBy('estado')
            ->get()
            ->map(fn ($r) => ['estado' => $r->estado, 'total' => $r->total]);

        // ── Ocupación por sede ───────────────────────────────────
        $sedes = Sede::withCount([
            'habitaciones',
            'habitaciones as ocupadas_count' => fn ($q) => $q->where('estado', 'ocupada'),
            'habitaciones as disponibles_count' => fn ($q) => $q->where('estado', 'disponible'),
            'habitaciones as reservadas_count' => fn ($q) => $q->where('estado', 'reservada'),
        ])->get()->map(fn ($s) => [
            'id'          => $s->id,
            'nombre'      => $s->nombre,
            'total'       => $s->habitaciones_count,
            'ocupadas'    => $s->ocupadas_count,
            'disponibles' => $s->disponibles_count,
            'reservadas'  => $s->reservadas_count,
            'tasa'        => $s->habitaciones_count > 0
                ? round(($s->ocupadas_count / $s->habitaciones_count) * 100) : 0,
        ]);

        // ── Últimas 8 reservas ───────────────────────────────────
        $ultimasReservas = Reserva::with(['cliente:id,name', 'habitacion:id,numero', 'sede:id,nombre'])
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($r) => [
                'id'           => $r->id,
                'codigo'       => $r->codigo,
                'cliente'      => $r->cliente?->name,
                'habitacion'   => $r->habitacion?->numero,
                'sede'         => $r->sede?->nombre,
                'fecha_entrada'=> $r->fecha_entrada->format('Y-m-d'),
                'estado'       => $r->estado,
                'total'        => $r->precio_total,
            ]);

        // ── Métodos de pago del mes ──────────────────────────────
        $metodosPago = Pago::whereBetween('fecha_pago', [$inicioMes, $finMes])
            ->select('metodo_pago', DB::raw('count(*) as total'), DB::raw('sum(monto) as monto'))
            ->groupBy('metodo_pago')
            ->get()
            ->map(fn ($m) => [
                'metodo' => $m->metodo_pago,
                'total'  => $m->total,
                'monto'  => (float) $m->monto,
            ]);

        return response()->json([
            'kpis' => [
                'ingresos_mes'          => (float) $ingresosMes,
                'ingresos_mes_anterior' => (float) $ingresosMesAnterior,
                'reservas_mes'          => $reservasMes,
                'reservas_mes_anterior' => $reservasMesAnterior,
                'tasa_ocupacion'        => $tasaOcupacion,
                'total_habitaciones'    => $totalHabitaciones,
                'ingresos_hoy'          => (float) $pagosVerificadosHoy,
            ],
            'ingresos_mensuales' => $ingresosMensuales,
            'reservas_por_estado' => $reservasPorEstado,
            'ocupacion_sedes'    => $sedes,
            'ultimas_reservas'   => $ultimasReservas,
            'metodos_pago'       => $metodosPago,
        ]);
    }
}
