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

        $response = Http::timeout(8)->get("https://api.apis.net.pe/v2/sunat/ruc", [
            'numero' => $ruc,
        ]);

        if ($response->successful()) {
            return response()->json($response->json());
        }

        return response()->json(['message' => 'No se pudo consultar el RUC.'], 502);
    }

    // Consulta DNI en la API de apis.net.pe
    public function buscarDni(string $dni): JsonResponse
    {
        $dni = preg_replace('/\D/', '', $dni);

        if (strlen($dni) !== 8) {
            return response()->json(['message' => 'DNI inválido.'], 422);
        }

        $response = Http::timeout(8)->get("https://api.apis.net.pe/v1/dni", [
            'numero' => $dni,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            // Construir nombre completo a partir de los campos separados
            if (!empty($data['nombres']) && empty($data['nombre'])) {
                $data['nombre'] = trim("{$data['nombres']} {$data['apellidoPaterno']} {$data['apellidoMaterno']}");
            }
            return response()->json($data);
        }

        return response()->json(['message' => 'No se encontró el DNI en el registro.'], 404);
    }

    // Endpoint unificado: detecta si es DNI (8 dígitos) o RUC (11 dígitos)
    public function buscarDocumento(string $numero): JsonResponse
    {
        $numero = preg_replace('/\D/', '', $numero);

        if (strlen($numero) === 8)  return $this->buscarDni($numero);
        if (strlen($numero) === 11) return $this->buscarRuc($numero);

        return response()->json(['message' => 'Ingresa 8 dígitos para DNI o 11 para RUC.'], 422);
    }
}
