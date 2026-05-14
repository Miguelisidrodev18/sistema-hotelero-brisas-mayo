<?php

namespace App\Http\Controllers;

use App\Models\Habitacion;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ReservaController extends Controller
{
    public function index(Request $request)
    {
        $user  = auth()->user();
        $query = Reserva::with(['cliente:id,name,email,telefono,dni', 'habitacion:id,numero,tipo,piso', 'sede:id,nombre']);

        // Cliente solo ve sus propias reservas
        if ($user->role === 'cliente') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('estado'))      $query->where('estado', $request->estado);
        if ($request->filled('sede_id'))     $query->where('sede_id', $request->sede_id);
        if ($request->filled('habitacion_id')) $query->where('habitacion_id', $request->habitacion_id);
        if ($request->filled('fecha_desde')) $query->whereDate('fecha_entrada', '>=', $request->fecha_desde);
        if ($request->filled('fecha_hasta')) $query->whereDate('fecha_entrada', '<=', $request->fecha_hasta);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('codigo', 'like', "%$s%")
                  ->orWhereHas('cliente', fn($q2) => $q2->where('name', 'like', "%$s%")->orWhere('dni', 'like', "%$s%"))
            );
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'habitacion_id' => 'required|exists:habitaciones,id',
            'fecha_entrada' => 'required|date|after_or_equal:today',
            'fecha_salida'  => 'required|date|after:fecha_entrada',
            'num_huespedes' => 'required|integer|min:1|max:10',
            'notas'         => 'nullable|string|max:500',
            'user_id'       => 'nullable|exists:users,id',
        ]);

        $habitacion = Habitacion::findOrFail($data['habitacion_id']);

        // Verificar disponibilidad (sin solapamiento)
        $solapada = Reserva::where('habitacion_id', $habitacion->id)
            ->whereNotIn('estado', ['cancelada', 'expirada', 'finalizada'])
            ->where(fn($q) =>
                $q->whereBetween('fecha_entrada', [$data['fecha_entrada'], $data['fecha_salida']])
                  ->orWhereBetween('fecha_salida', [$data['fecha_entrada'], $data['fecha_salida']])
                  ->orWhere(fn($q2) =>
                      $q2->where('fecha_entrada', '<=', $data['fecha_entrada'])
                         ->where('fecha_salida', '>=', $data['fecha_salida'])
                  )
            )->exists();

        if ($solapada) {
            return response()->json(['message' => 'La habitación no está disponible en esas fechas.'], 422);
        }

        $noches      = now()->parse($data['fecha_entrada'])->diffInDays($data['fecha_salida']);
        $precioNoche = $habitacion->precio;
        $precioTotal = $precioNoche * $noches;
        $clienteId   = $data['user_id'] ?? auth()->id();

        $reserva = Reserva::create([
            'user_id'       => $clienteId,
            'habitacion_id' => $habitacion->id,
            'sede_id'       => $habitacion->sede_id,
            'created_by'    => auth()->id(),
            'fecha_entrada' => $data['fecha_entrada'],
            'fecha_salida'  => $data['fecha_salida'],
            'num_huespedes' => $data['num_huespedes'],
            'precio_noche'  => $precioNoche,
            'precio_total'  => $precioTotal,
            'estado'        => 'pendiente',
            'codigo'        => strtoupper(Str::random(8)),
            'notas'         => $data['notas'] ?? null,
        ]);

        return response()->json($reserva->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']), 201);
    }

    public function show(Reserva $reserva)
    {
        $this->authorizeReserva($reserva);
        return response()->json($reserva->load(['cliente:id,name,email,telefono,dni', 'habitacion', 'sede', 'creadoPor:id,name']));
    }

    public function update(Request $request, Reserva $reserva)
    {
        $data = $request->validate([
            'notas' => 'nullable|string|max:500',
        ]);
        $reserva->update($data);
        return response()->json($reserva->fresh());
    }

    public function confirmar(Reserva $reserva)
    {
        if ($reserva->estado !== 'pendiente') {
            return response()->json(['message' => 'Solo se pueden confirmar reservas pendientes.'], 422);
        }
        $reserva->update(['estado' => 'confirmada']);
        $reserva->habitacion->update(['estado' => 'reservada']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function checkin(Reserva $reserva)
    {
        if ($reserva->estado !== 'confirmada') {
            return response()->json(['message' => 'Solo se puede hacer check-in a reservas confirmadas.'], 422);
        }
        $reserva->update(['estado' => 'checkin']);
        $reserva->habitacion->update(['estado' => 'ocupada']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function checkout(Reserva $reserva)
    {
        if ($reserva->estado !== 'checkin') {
            return response()->json(['message' => 'Solo se puede hacer check-out a reservas en check-in.'], 422);
        }
        $reserva->update(['estado' => 'finalizada']);
        $reserva->habitacion->update(['estado' => 'limpieza']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function cancelar(Reserva $reserva)
    {
        $this->authorizeReserva($reserva);
        if (in_array($reserva->estado, ['finalizada', 'cancelada', 'expirada'])) {
            return response()->json(['message' => 'Esta reserva no puede cancelarse.'], 422);
        }
        $reserva->update(['estado' => 'cancelada']);
        if (in_array($reserva->habitacion->estado, ['reservada', 'ocupada'])) {
            $reserva->habitacion->update(['estado' => 'disponible']);
        }
        return response()->json($reserva->fresh());
    }

    private function authorizeReserva(Reserva $reserva): void
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }
    }
}
