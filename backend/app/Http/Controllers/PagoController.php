<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;

class PagoController extends Controller
{
    // GET /reservas/{reserva}/pago — detalle de pago de una reserva
    public function show(Reserva $reserva)
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        $pago = $reserva->pagos()->latest()->first();

        return response()->json([
            'reserva' => $reserva->load(['cliente:id,name,email', 'habitacion:id,numero,tipo,piso', 'sede:id,nombre']),
            'pago'    => $pago,
        ]);
    }

    // POST /reservas/{reserva}/pago — registrar pago
    public function store(Request $request, Reserva $reserva)
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($reserva->estado, ['finalizada', 'cancelada', 'expirada'])) {
            return response()->json(['message' => 'Esta reserva no puede recibir pagos.'], 422);
        }

        $data = $request->validate([
            'metodo_pago' => 'required|in:efectivo,transferencia,yape,plin,tarjeta',
            'referencia'  => 'nullable|string|max:100',
            'notas'       => 'nullable|string|max:500',
        ]);

        $pago = Pago::create([
            'reserva_id'     => $reserva->id,
            'user_id'        => $reserva->user_id,
            'registrado_por' => $user->id,
            'monto'          => $reserva->precio_total,
            'metodo_pago'    => $data['metodo_pago'],
            'estado'         => 'pendiente',
            'referencia'     => $data['referencia'] ?? null,
            'notas'          => $data['notas'] ?? null,
            'fecha_pago'     => now(),
        ]);

        // Confirmar la reserva automáticamente al registrar el pago
        if ($reserva->estado === 'pendiente') {
            $reserva->update(['estado' => 'confirmada']);
            $reserva->habitacion->update(['estado' => 'reservada']);
        }

        return response()->json([
            'pago'    => $pago->load('reserva'),
            'reserva' => $reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']),
        ], 201);
    }

    // PATCH /pagos/{pago}/verificar — solo staff
    public function verificar(Pago $pago)
    {
        $pago->update(['estado' => 'verificado']);
        return response()->json($pago->fresh()->load('reserva'));
    }

    // PATCH /pagos/{pago}/rechazar — solo staff
    public function rechazar(Pago $pago)
    {
        $pago->update(['estado' => 'rechazado']);
        return response()->json($pago->fresh());
    }
}
