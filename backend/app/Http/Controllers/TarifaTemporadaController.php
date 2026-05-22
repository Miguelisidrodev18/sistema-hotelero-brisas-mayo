<?php

namespace App\Http\Controllers;

use App\Models\TarifaTemporada;
use Illuminate\Http\Request;

class TarifaTemporadaController extends Controller
{
    public function index()
    {
        return response()->json(
            TarifaTemporada::with('sede:id,nombre')->orderBy('fecha_inicio')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'sede_id'      => 'nullable|exists:sedes,id',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'factor'       => 'required|numeric|min:0.1|max:10',
            'descripcion'  => 'nullable|string|max:200',
            'activo'       => 'boolean',
        ]);
        return response()->json(TarifaTemporada::create($data)->load('sede:id,nombre'), 201);
    }

    public function update(Request $request, TarifaTemporada $tarifaTemporada)
    {
        $data = $request->validate([
            'nombre'       => 'sometimes|string|max:100',
            'sede_id'      => 'nullable|exists:sedes,id',
            'fecha_inicio' => 'sometimes|date',
            'fecha_fin'    => 'sometimes|date',
            'factor'       => 'sometimes|numeric|min:0.1|max:10',
            'descripcion'  => 'nullable|string|max:200',
            'activo'       => 'boolean',
        ]);
        $tarifaTemporada->update($data);
        return response()->json($tarifaTemporada->fresh()->load('sede:id,nombre'));
    }

    public function destroy(TarifaTemporada $tarifaTemporada)
    {
        $tarifaTemporada->delete();
        return response()->json(null, 204);
    }
}
