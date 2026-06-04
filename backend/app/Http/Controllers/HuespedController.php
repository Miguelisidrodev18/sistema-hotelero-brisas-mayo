<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\ReservaHuesped;
use Illuminate\Http\Request;

class HuespedController extends Controller
{
    public function store(Request $request, Reserva $reserva)
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'huespedes'        => 'required|array|min:1|max:20',
            'huespedes.*.nombre' => 'required|string|max:100',
            'huespedes.*.dni'    => 'nullable|string|max:15',
        ]);

        // Idempotente: reemplaza la lista completa
        $reserva->huespedes()->delete();

        $huespedes = collect($data['huespedes'])
            ->filter(fn($h) => !empty(trim($h['nombre'])))
            ->map(fn($h) => [
                'reserva_id' => $reserva->id,
                'nombre'     => trim($h['nombre']),
                'dni'        => !empty($h['dni']) ? trim($h['dni']) : null,
                'created_at' => now(),
            ])
            ->values();

        ReservaHuesped::insert($huespedes->toArray());

        return response()->json($reserva->huespedes()->get());
    }

    public function destroy(Reserva $reserva, ReservaHuesped $huesped)
    {
        if ($huesped->reserva_id !== $reserva->id) {
            abort(404);
        }
        $huesped->delete();
        return response()->json(['message' => 'Huésped eliminado.']);
    }
}
