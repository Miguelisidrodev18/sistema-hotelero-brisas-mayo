<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PedidoCulqiController extends Controller
{
    public function charge(Request $request, Pedido $pedido)
    {
        $request->validate(['token' => 'required|string']);

        if ($pedido->pagado) {
            return response()->json(['message' => 'Este pedido ya fue pagado.'], 422);
        }

        $montoCentavos = (int) round((float) $pedido->total * 100);
        $email = auth()->user()?->email ?? 'cliente@brisasdelmayo.com';

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config('culqi.secret_key'),
            'Content-Type'  => 'application/json',
        ])->post('https://api.culqi.com/v2/charges', [
            'amount'        => $montoCentavos,
            'currency_code' => 'PEN',
            'email'         => $email,
            'source_id'     => $request->token,
            'capture'       => true,
            'description'   => "Pedido {$pedido->codigo} - Restaurante Brisas de Mayo",
            'metadata'      => ['pedido_id' => (string) $pedido->id, 'codigo' => $pedido->codigo],
        ]);

        if (!$response->successful()) {
            $msg = $response->json('user_message')
                ?? $response->json('merchant_message')
                ?? 'El pago fue rechazado. Intenta con otra tarjeta.';
            return response()->json(['message' => $msg], 422);
        }

        $pedido->update([
            'pagado'      => true,
            'metodo_pago' => 'tarjeta',
        ]);

        return response()->json(['pedido' => $pedido->fresh()->load(['items.plato'])], 201);
    }
}
