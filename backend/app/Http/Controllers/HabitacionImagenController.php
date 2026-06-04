<?php

namespace App\Http\Controllers;

use App\Models\Habitacion;
use App\Models\HabitacionImagen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HabitacionImagenController extends Controller
{
    public function store(Request $request, Habitacion $habitacion)
    {
        $request->validate([
            'image' => 'required|image|max:4096',
        ]);

        $path  = $request->file('image')->store('habitaciones', 'public');
        $orden = ($habitacion->imagenes()->max('orden') ?? -1) + 1;

        $imagen = HabitacionImagen::create([
            'habitacion_id' => $habitacion->id,
            'path'          => $path,
            'orden'         => $orden,
        ]);

        return response()->json([
            'id'    => $imagen->id,
            'url'   => $imagen->url,
            'orden' => $imagen->orden,
        ], 201);
    }

    public function destroy(Habitacion $habitacion, HabitacionImagen $imagen)
    {
        if ($imagen->habitacion_id !== $habitacion->id) {
            abort(404);
        }

        Storage::disk('public')->delete($imagen->path);
        $imagen->delete();

        return response()->json(['message' => 'Imagen eliminada.']);
    }

    public function reordenar(Request $request, Habitacion $habitacion)
    {
        $data = $request->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer',
        ]);

        foreach ($data['ids'] as $orden => $id) {
            HabitacionImagen::where('id', $id)
                ->where('habitacion_id', $habitacion->id)
                ->update(['orden' => $orden]);
        }

        return response()->json(['message' => 'Orden actualizado.']);
    }
}
