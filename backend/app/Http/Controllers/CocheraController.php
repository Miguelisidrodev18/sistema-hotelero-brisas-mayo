<?php

namespace App\Http\Controllers;

use App\Models\Cochera;
use App\Models\CocheraReserva;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CocheraController extends Controller
{
    // ── COCHERAS (espacios) ──────────────────────────────────

    // GET /cocheras — lista de espacios (admin/recepción)
    public function index(Request $request)
    {
        $q = Cochera::with('sede:id,nombre');
        if ($request->filled('sede_id')) $q->where('sede_id', $request->sede_id);
        if ($request->filled('estado'))  $q->where('estado', $request->estado);
        if ($request->filled('tipo'))    $q->where('tipo', $request->tipo);
        return response()->json($q->orderBy('sede_id')->orderBy('numero')->get());
    }

    // GET /cocheras/disponibles — pública, sin auth
    public function disponibles(Request $request)
    {
        $q = Cochera::with('sede:id,nombre,slug')
            ->where('activo', true)
            ->where('estado', 'disponible');
        if ($request->filled('sede_id')) $q->where('sede_id', $request->sede_id);
        if ($request->filled('tipo'))    $q->where('tipo', $request->tipo);
        return response()->json($q->orderBy('numero')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sede_id'      => 'required|exists:sedes,id',
            'numero'       => 'required|string|max:20',
            'tipo'         => 'required|in:auto,moto,discapacitado',
            'precio_noche' => 'required|numeric|min:0',
            'descripcion'  => 'nullable|string|max:255',
        ]);
        $cochera = Cochera::create($data);
        return response()->json($cochera->load('sede:id,nombre'), 201);
    }

    public function update(Request $request, Cochera $cochera)
    {
        $data = $request->validate([
            'numero'       => 'sometimes|string|max:20',
            'tipo'         => 'sometimes|in:auto,moto,discapacitado',
            'estado'       => 'sometimes|in:disponible,ocupada,reservada,mantenimiento',
            'precio_noche' => 'sometimes|numeric|min:0',
            'descripcion'  => 'nullable|string|max:255',
            'activo'       => 'sometimes|boolean',
        ]);
        $cochera->update($data);
        return response()->json($cochera->load('sede:id,nombre'));
    }

    public function destroy(Cochera $cochera)
    {
        $cochera->delete();
        return response()->json(null, 204);
    }

    // ── RESERVAS DE COCHERA ──────────────────────────────────

    // GET /cochera-reservas
    public function reservasIndex(Request $request)
    {
        $user = auth()->user();
        $q = CocheraReserva::with([
            'cochera:id,numero,tipo,sede_id',
            'cochera.sede:id,nombre',
            'cliente:id,name,email',
            'reservaHabitacion:id,codigo',
        ])->latest();

        if ($user->role === 'cliente') {
            $q->where('user_id', $user->id);
        }
        if ($request->filled('estado'))  $q->where('estado', $request->estado);
        if ($request->filled('sede_id')) $q->whereHas('cochera', fn ($c) => $c->where('sede_id', $request->sede_id));

        return response()->json($q->paginate(20));
    }

    // POST /cochera-reservas
    public function reservasStore(Request $request)
    {
        $user = auth()->user();
        $data = $request->validate([
            'cochera_id'    => 'required|exists:cocheras,id',
            'fecha_entrada' => 'required|date|after_or_equal:today',
            'fecha_salida'  => 'required|date|after:fecha_entrada',
            'placa'         => 'nullable|string|max:20',
            'reserva_id'    => 'nullable|exists:reservas,id',
            'notas'         => 'nullable|string|max:500',
        ]);

        $cochera = Cochera::findOrFail($data['cochera_id']);

        // Verificar solapamiento
        $solapada = CocheraReserva::where('cochera_id', $cochera->id)
            ->whereNotIn('estado', ['cancelada', 'finalizada'])
            ->where(fn ($q) =>
                $q->whereBetween('fecha_entrada', [$data['fecha_entrada'], $data['fecha_salida']])
                  ->orWhereBetween('fecha_salida', [$data['fecha_entrada'], $data['fecha_salida']])
                  ->orWhere(fn ($q2) =>
                      $q2->where('fecha_entrada', '<=', $data['fecha_entrada'])
                         ->where('fecha_salida', '>=', $data['fecha_salida'])
                  )
            )->exists();

        if ($solapada) {
            return response()->json(['message' => 'La cochera no está disponible en esas fechas.'], 422);
        }

        $noches = (new \DateTime($data['fecha_entrada']))->diff(new \DateTime($data['fecha_salida']))->days;
        $total  = $cochera->precio_noche * $noches;

        $reserva = CocheraReserva::create([
            'cochera_id'    => $cochera->id,
            'user_id'       => $user->id,
            'reserva_id'    => $data['reserva_id'] ?? null,
            'codigo'        => strtoupper(Str::random(8)),
            'fecha_entrada' => $data['fecha_entrada'],
            'fecha_salida'  => $data['fecha_salida'],
            'precio_noche'  => $cochera->precio_noche,
            'precio_total'  => $total,
            'estado'        => 'confirmada',
            'placa'         => $data['placa'] ?? null,
            'notas'         => $data['notas'] ?? null,
        ]);

        $cochera->update(['estado' => 'reservada']);

        return response()->json($reserva->load(['cochera.sede:id,nombre', 'cliente:id,name']), 201);
    }

    // PATCH /cochera-reservas/{id}/activar — check-in cochera
    public function activar(CocheraReserva $cocheraReserva)
    {
        $cocheraReserva->update(['estado' => 'activa']);
        $cocheraReserva->cochera->update(['estado' => 'ocupada']);
        return response()->json($cocheraReserva->load('cochera'));
    }

    // PATCH /cochera-reservas/{id}/finalizar — check-out cochera
    public function finalizar(CocheraReserva $cocheraReserva)
    {
        $cocheraReserva->update(['estado' => 'finalizada']);
        $cocheraReserva->cochera->update(['estado' => 'disponible']);
        return response()->json($cocheraReserva->load('cochera'));
    }

    // PATCH /cochera-reservas/{id}/cancelar
    public function cancelarReserva(CocheraReserva $cocheraReserva)
    {
        $cocheraReserva->update(['estado' => 'cancelada']);
        if (in_array($cocheraReserva->cochera->estado, ['reservada', 'ocupada'])) {
            $cocheraReserva->cochera->update(['estado' => 'disponible']);
        }
        return response()->json($cocheraReserva->load('cochera'));
    }
}
