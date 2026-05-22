<?php

namespace App\Http\Controllers;

use App\Mail\PagoConfirmadoMail;
use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class CulqiController extends Controller
{
    public function charge(Request $request)
    {
        $data = $request->validate([
            'token'      => 'required|string',
            'reserva_id' => 'required|integer|exists:reservas,id',
        ]);

        $reserva = Reserva::with([
            'cliente:id,name,email',
            'habitacion:id,numero,tipo',
            'sede:id,nombre',
        ])->findOrFail($data['reserva_id']);

        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($reserva->estado, ['finalizada', 'cancelada', 'expirada'])) {
            return response()->json(['message' => 'Esta reserva no puede recibir pagos.'], 422);
        }

        if ($reserva->pagos()->where('estado', 'verificado')->exists()) {
            return response()->json(['message' => 'Esta reserva ya tiene un pago verificado.'], 422);
        }

        $montoSoles    = (float) $reserva->precio_total;
        $montoCentavos = (int) round($montoSoles * 100);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('culqi.secret_key'),
            'Content-Type'  => 'application/json',
        ])->post('https://api.culqi.com/v2/charges', [
            'amount'        => $montoCentavos,
            'currency_code' => 'PEN',
            'email'         => $reserva->cliente->email,
            'source_id'     => $data['token'],
            'capture'       => true,
            'description'   => "Reserva {$reserva->codigo} - Hotel Brisas de Mayo",
            'metadata'      => [
                'reserva_id' => (string) $reserva->id,
                'codigo'     => $reserva->codigo,
            ],
        ]);

        if (!$response->successful()) {
            $msg = $response->json('user_message')
                ?? $response->json('merchant_message')
                ?? 'El pago fue rechazado. Intenta con otra tarjeta.';
            return response()->json(['message' => $msg], 422);
        }

        $charge = $response->json();

        $pago = Pago::create([
            'reserva_id'     => $reserva->id,
            'user_id'        => $reserva->user_id,
            'registrado_por' => $user->id,
            'monto'          => $montoSoles,
            'metodo_pago'    => 'tarjeta',
            'estado'         => 'verificado',
            'referencia'     => $charge['id'] ?? null,
            'notas'          => 'Pago online procesado vía Culqi',
            'fecha_pago'     => now(),
        ]);

        if ($reserva->estado === 'pendiente') {
            $reserva->update(['estado' => 'confirmada']);
            $reserva->habitacion->update(['estado' => 'reservada']);
        }

        try {
            Mail::to($reserva->cliente->email)
                ->send(new PagoConfirmadoMail($reserva->fresh()->load(['cliente', 'habitacion', 'sede'])));
        } catch (\Throwable) {
            // no bloquear si falla el mail
        }

        return response()->json([
            'pago'      => $pago,
            'reserva'   => $reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']),
            'charge_id' => $charge['id'] ?? null,
        ], 201);
    }
}
