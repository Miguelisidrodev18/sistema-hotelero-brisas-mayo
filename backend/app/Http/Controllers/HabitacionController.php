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
        $query = Habitacion::with('sede')
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
}
