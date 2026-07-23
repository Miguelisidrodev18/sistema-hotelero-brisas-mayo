<?php

namespace App\Http\Controllers;

use App\Models\Mesa;
use Illuminate\Http\Request;

class MesaController extends Controller
{
    // GET /mesas — mapa de mesas con su pedido activo (si tiene)
    public function index()
    {
        $mesas = Mesa::orderBy('numero')->get();

        $mesas->load(['pedidos' => function ($q) {
            $q->where(fn ($q2) => $q2->whereIn('estado', ['pendiente', 'preparando', 'listo'])->orWhere('pagado', false))
              ->with('items.plato')
              ->orderByDesc('created_at');
        }]);

        return response()->json($mesas);
    }

    // POST /mesas — crear mesa (admin)
    public function store(Request $request)
    {
        $data = $request->validate([
            'numero'    => 'required|integer|min:1|max:999|unique:mesas,numero',
            'capacidad' => 'nullable|integer|min:1|max:50',
        ]);

        $mesa = Mesa::create($data);
        return response()->json($mesa, 201);
    }

    // PUT /mesas/{mesa} — editar mesa (admin)
    public function update(Request $request, Mesa $mesa)
    {
        $data = $request->validate([
            'numero'    => 'required|integer|min:1|max:999|unique:mesas,numero,' . $mesa->id,
            'capacidad' => 'nullable|integer|min:1|max:50',
        ]);

        $mesa->update($data);
        return response()->json($mesa->fresh());
    }

    // DELETE /mesas/{mesa} — eliminar mesa (admin)
    public function destroy(Mesa $mesa)
    {
        abort_if($mesa->estado !== 'libre', 422, 'No se puede eliminar una mesa ocupada.');
        $mesa->delete();
        return response()->json(['message' => 'Mesa eliminada.']);
    }

    // PATCH /mesas/{mesa}/ocupar — el mozo sienta clientes en la mesa
    public function ocupar(Mesa $mesa)
    {
        abort_if($mesa->estado === 'ocupada', 422, 'La mesa ya está ocupada.');
        $mesa->update(['estado' => 'ocupada']);
        return response()->json($mesa->fresh());
    }

    // PATCH /mesas/{mesa}/liberar — cerrar la mesa cuando los clientes se retiran
    public function liberar(Mesa $mesa)
    {
        $pendientes = $mesa->pedidos()
            ->where(fn ($q) => $q->whereIn('estado', ['pendiente', 'preparando', 'listo'])->orWhere('pagado', false))
            ->exists();

        abort_if($pendientes, 422, 'Esta mesa tiene pedidos sin entregar o sin pagar.');

        $mesa->update(['estado' => 'libre']);
        return response()->json($mesa->fresh());
    }
}
