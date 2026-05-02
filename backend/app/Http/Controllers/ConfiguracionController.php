<?php

namespace App\Http\Controllers;

use App\Models\Configuracion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ConfiguracionController extends Controller
{
    public function index(): JsonResponse
    {
        $configs = Configuracion::all()->keyBy('clave')->map->valor;
        return response()->json($configs);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'configs' => ['required', 'array'],
        ]);

        foreach ($data['configs'] as $clave => $valor) {
            Configuracion::set($clave, $valor);
        }

        return response()->json(['message' => 'Configuración actualizada.']);
    }

    public function buscarRuc(string $ruc): JsonResponse
    {
        $ruc = preg_replace('/\D/', '', $ruc);

        if (strlen($ruc) !== 11) {
            return response()->json(['message' => 'RUC inválido.'], 422);
        }

        // API pública de consulta de RUC
        $response = Http::timeout(8)->get("https://api.apis.net.pe/v2/sunat/ruc", [
            'numero' => $ruc,
        ]);

        if ($response->successful()) {
            return response()->json($response->json());
        }

        return response()->json(['message' => 'No se pudo consultar el RUC.'], 502);
    }
}
