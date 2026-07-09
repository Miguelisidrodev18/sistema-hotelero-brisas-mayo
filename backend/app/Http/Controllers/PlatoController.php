<?php

namespace App\Http\Controllers;

use App\Models\CategoriaPlato;
use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PlatoController extends Controller
{
    // POST /platos/upload-imagen — sube la foto de un plato y devuelve su URL pública
    public function subirImagen(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:4096',
        ]);

        $path = $request->file('image')->store('platos', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)], 201);
    }

    // GET /menu — público, solo platos disponibles con su categoría
    public function menu()
    {
        $categorias = CategoriaPlato::where('activo', true)
            ->orderBy('orden')
            ->with(['platos' => fn($q) => $q->where('disponible', true)->orderBy('nombre')])
            ->get();

        return response()->json($categorias);
    }

    // GET /platos — admin, todos
    public function index()
    {
        $categorias = CategoriaPlato::orderBy('orden')
            ->with(['platos' => fn($q) => $q->orderBy('nombre')])
            ->get();

        return response()->json($categorias);
    }

    // POST /platos
    public function store(Request $request)
    {
        $data = $request->validate([
            'categoria_id' => 'required|exists:categorias_plato,id',
            'nombre'       => 'required|string|max:120',
            'descripcion'  => 'nullable|string|max:500',
            'precio'       => 'required|numeric|min:0',
            'imagen_url'   => 'nullable|url|max:500',
            'disponible'   => 'boolean',
        ]);
        return response()->json(Plato::create($data)->load('categoria'), 201);
    }

    // PUT /platos/{plato}
    public function update(Request $request, Plato $plato)
    {
        $data = $request->validate([
            'categoria_id' => 'sometimes|exists:categorias_plato,id',
            'nombre'       => 'sometimes|string|max:120',
            'descripcion'  => 'nullable|string|max:500',
            'precio'       => 'sometimes|numeric|min:0',
            'imagen_url'   => 'nullable|url|max:500',
            'disponible'   => 'boolean',
        ]);
        $plato->update($data);
        return response()->json($plato->fresh()->load('categoria'));
    }

    // DELETE /platos/{plato}
    public function destroy(Plato $plato)
    {
        $plato->delete();
        return response()->json(null, 204);
    }

    // --- Categorías ---

    // GET /categorias-plato
    public function categorias()
    {
        return response()->json(CategoriaPlato::orderBy('orden')->get());
    }

    // POST /categorias-plato
    public function storeCat(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:80',
            'descripcion' => 'nullable|string|max:200',
            'orden'       => 'integer|min:0',
            'activo'      => 'boolean',
        ]);
        return response()->json(CategoriaPlato::create($data), 201);
    }

    // PUT /categorias-plato/{cat}
    public function updateCat(Request $request, CategoriaPlato $cat)
    {
        $data = $request->validate([
            'nombre'      => 'sometimes|string|max:80',
            'descripcion' => 'nullable|string|max:200',
            'orden'       => 'integer|min:0',
            'activo'      => 'boolean',
        ]);
        $cat->update($data);
        return response()->json($cat->fresh());
    }

    // DELETE /categorias-plato/{cat}
    public function destroyCat(CategoriaPlato $cat)
    {
        $cat->delete();
        return response()->json(null, 204);
    }
}
