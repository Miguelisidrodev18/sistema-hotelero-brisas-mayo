<?php

namespace App\Http\Controllers;

use App\Models\CodigoDescuento;
use Illuminate\Http\Request;

class CodigoDescuentoController extends Controller
{
    public function index()
    {
        return response()->json(
            CodigoDescuento::with('creadoPor:id,name')
                ->withCount('reservas')
                ->orderBy('created_at', 'desc')
                ->get()
                ->append('estado')
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'codigo'            => ['required', 'string', 'max:20', 'unique:codigos_descuento,codigo', 'regex:/^[A-Z0-9\-]+$/'],
            'descripcion'       => 'nullable|string|max:255',
            'activo'            => 'boolean',
            'fecha_vencimiento' => 'nullable|date|after:today',
        ]);

        $data['created_by'] = auth()->id();
        $data['codigo']     = strtoupper(trim($data['codigo']));

        $codigo = CodigoDescuento::create($data);

        return response()->json(
            $codigo->load('creadoPor:id,name')->append('estado'),
            201
        );
    }

    public function validar(Request $request)
    {
        $request->validate(['codigo' => 'required|string']);

        $codigo = CodigoDescuento::where('codigo', strtoupper(trim($request->codigo)))->first();

        if (!$codigo) {
            return response()->json(['valido' => false, 'mensaje' => 'Código no encontrado.']);
        }
        if (!$codigo->activo) {
            return response()->json(['valido' => false, 'mensaje' => 'Este código está desactivado.']);
        }
        if ($codigo->fecha_vencimiento && $codigo->fecha_vencimiento->isPast()) {
            return response()->json(['valido' => false, 'mensaje' => 'Este código ha vencido.']);
        }

        return response()->json([
            'valido'      => true,
            'id'          => $codigo->id,
            'descripcion' => $codigo->descripcion,
            'vence'       => $codigo->fecha_vencimiento?->format('d/m/Y'),
        ]);
    }

    public function toggleActivo(CodigoDescuento $codigoDescuento)
    {
        $codigoDescuento->update(['activo' => !$codigoDescuento->activo]);
        return response()->json($codigoDescuento->fresh()->append('estado'));
    }

    public function destroy(CodigoDescuento $codigoDescuento)
    {
        if ($codigoDescuento->reservas()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar un código con reservas asociadas.'], 422);
        }
        $codigoDescuento->delete();
        return response()->json(null, 204);
    }

    public function reservasDeCodigo(CodigoDescuento $codigoDescuento)
    {
        $reservas = $codigoDescuento->reservas()
            ->with([
                'cliente:id,name,email',
                'habitacion:id,numero,tipo',
                'creadoPor:id,name',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservas);
    }
}
