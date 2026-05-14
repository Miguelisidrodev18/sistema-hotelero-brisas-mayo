<?php

namespace App\Http\Controllers;

use App\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SedeController extends Controller
{
    public function index()
    {
        return response()->json(Sede::withCount('habitaciones')->orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'          => 'required|string|max:100',
            'descripcion'     => 'nullable|string',
            'direccion'       => 'nullable|string',
            'ciudad'          => 'nullable|string|max:80',
            'telefono'        => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:100',
            'logo_url'        => 'nullable|string',
            'vista_principal' => 'nullable|string',
            'activo'          => 'boolean',
        ]);

        $data['slug'] = $this->uniqueSlug(Str::slug($data['nombre']));

        return response()->json(
            Sede::create($data)->loadCount('habitaciones'), 201
        );
    }

    public function show(Sede $sede)
    {
        return response()->json($sede->loadCount('habitaciones'));
    }

    public function update(Request $request, Sede $sede)
    {
        $data = $request->validate([
            'nombre'          => 'required|string|max:100',
            'descripcion'     => 'nullable|string',
            'direccion'       => 'nullable|string',
            'ciudad'          => 'nullable|string|max:80',
            'telefono'        => 'nullable|string|max:20',
            'email'           => 'nullable|email|max:100',
            'logo_url'        => 'nullable|string',
            'vista_principal' => 'nullable|string',
            'activo'          => 'boolean',
        ]);

        if ($data['nombre'] !== $sede->nombre) {
            $data['slug'] = $this->uniqueSlug(Str::slug($data['nombre']), $sede->id);
        }

        $sede->update($data);
        return response()->json($sede->fresh()->loadCount('habitaciones'));
    }

    public function destroy(Sede $sede)
    {
        if ($sede->habitaciones()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar una sede con habitaciones registradas.',
            ], 422);
        }
        $sede->delete();
        return response()->json(['message' => 'Sede eliminada.']);
    }

    // Endpoint público para el landing — sin auth
    public function publicas()
    {
        return response()->json(
            Sede::where('activo', true)
                ->withCount(['habitaciones as habitaciones_disponibles' => fn($q) => $q->where('estado', 'disponible')])
                ->orderBy('nombre')
                ->get()
        );
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base;
        $i    = 1;
        while (Sede::where('slug', $slug)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "$base-$i";
            $i++;
        }
        return $slug;
    }
}
