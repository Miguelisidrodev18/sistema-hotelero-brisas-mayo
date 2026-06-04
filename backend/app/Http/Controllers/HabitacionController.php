<?php

namespace App\Http\Controllers;

use App\Models\Habitacion;
use App\Models\Sede;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabitacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Habitacion::with(['sede', 'imagenes'])
            ->when($request->sede_id,  fn($q, $v) => $q->where('sede_id', $v))
            ->when($request->estado,   fn($q, $v) => $q->where('estado', $v))
            ->when($request->piso,     fn($q, $v) => $q->where('piso', $v))
            ->orderBy('sede_id')
            ->orderBy('numero');

        return response()->json($query->get()->map(fn($h) => [
            'id'           => $h->id,
            'numero'       => $h->numero,
            'tipo'         => $h->tipo,
            'tipo_label'   => $h->tipoLabel(),
            'capacidad'    => $h->capacidad,
            'precio'       => $h->precio,
            'piso'         => $h->piso,
            'tiene_vista'  => $h->tiene_vista,
            'estado'       => $h->estado,
            'sede_id'      => $h->sede_id,
            'sede_nombre'  => $h->sede->nombre,
            'sede_slug'    => $h->sede->slug,
            'imagenes'     => $h->imagenes->map(fn($i) => ['id' => $i->id, 'url' => $i->url, 'orden' => $i->orden]),
        ]));
    }

    public function update(Request $request, Habitacion $habitacion): JsonResponse
    {
        $data = $request->validate([
            'estado'      => ['sometimes', 'in:disponible,ocupada,reservada,limpieza,mantenimiento'],
            'precio'      => ['sometimes', 'integer', 'min:50'],
            'descripcion' => ['sometimes', 'nullable', 'string'],
        ]);

        $habitacion->update($data);

        return response()->json($habitacion->fresh('sede'));
    }

    public function sedes(): JsonResponse
    {
        return response()->json(
            Sede::where('activo', true)
                ->withCount('habitaciones')
                ->get()
        );
    }

    // Endpoint público — no requiere auth
    public function disponibles(Request $request): JsonResponse
    {
        $query = Habitacion::with(['sede:id,nombre,slug,ciudad,descripcion,vista_principal', 'imagenes'])
            ->whereNotIn('estado', ['mantenimiento'])  // solo ocultar mantenimiento
            ->whereHas('sede', fn($q) => $q->where('activo', true));

        if ($request->filled('sede_id'))   $query->where('sede_id', $request->sede_id);
        if ($request->filled('sede'))      $query->whereHas('sede', fn($q) => $q->where('slug', $request->sede));
        if ($request->filled('tipo'))      $query->where('tipo', $request->tipo);
        if ($request->filled('capacidad')) $query->where('capacidad', '>=', $request->capacidad);
        if ($request->filled('precio_max')) $query->where('precio', '<=', $request->precio_max);

        $habitaciones = $query->orderBy('sede_id')->orderBy('precio')->get();

        // Fechas ocupadas por reservas activas (pendiente/confirmada/checkin) que aún no vencen
        $ids = $habitaciones->pluck('id');
        $reservasAgrupadas = \App\Models\Reserva::select('habitacion_id', 'fecha_entrada', 'fecha_salida')
            ->whereIn('habitacion_id', $ids)
            ->whereIn('estado', ['pendiente', 'confirmada', 'checkin'])
            ->where('fecha_salida', '>=', now()->toDateString())
            ->get()
            ->groupBy('habitacion_id');

        return response()->json($habitaciones->map(fn($h) => [
            'id'               => $h->id,
            'numero'           => $h->numero,
            'tipo'             => $h->tipo,
            'tipo_label'       => $h->tipoLabel(),
            'capacidad'        => $h->capacidad,
            'precio'           => $h->precio,
            'piso'             => $h->piso,
            'tiene_vista'      => $h->tiene_vista,
            'descripcion'      => $h->descripcion,
            'estado'           => $h->estado,
            'sede_id'          => $h->sede_id,
            'sede_nombre'      => $h->sede->nombre,
            'sede_slug'        => $h->sede->slug,
            'sede_ciudad'      => $h->sede->ciudad,
            'sede_imagen'      => $h->sede->vista_principal,
            'imagen_principal' => $h->imagenes->first()?->url,
            'imagenes'         => $h->imagenes->map(fn($i) => $i->url)->values(),
            'fechas_ocupadas'  => ($reservasAgrupadas[$h->id] ?? collect())->map(fn($r) => [
                'entrada' => $r->fecha_entrada->toDateString(),
                'salida'  => $r->fecha_salida->toDateString(),
            ])->values(),
        ]));
    }
}
