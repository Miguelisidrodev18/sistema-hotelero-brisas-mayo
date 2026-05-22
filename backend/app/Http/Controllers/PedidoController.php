<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Plato;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PedidoController extends Controller
{
    // POST /pedidos — crear pedido con sus items
    public function store(Request $request)
    {
        $data = $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.plato_id' => 'required|exists:platos,id',
            'items.*.cantidad' => 'required|integer|min:1|max:99',
            'items.*.notas'    => 'nullable|string|max:200',
            'notas'          => 'nullable|string|max:500',
            'metodo_pago'    => 'nullable|string|max:30',
        ]);

        $total = 0;
        $itemsData = [];
        foreach ($data['items'] as $item) {
            $plato = Plato::findOrFail($item['plato_id']);
            $subtotal = $plato->precio * $item['cantidad'];
            $total += $subtotal;
            $itemsData[] = [
                'plato_id'       => $plato->id,
                'cantidad'       => $item['cantidad'],
                'precio_unitario' => $plato->precio,
                'subtotal'       => $subtotal,
                'notas'          => $item['notas'] ?? null,
            ];
        }

        $pedido = Pedido::create([
            'user_id'     => auth()->id(),
            'codigo'      => strtoupper(Str::random(8)),
            'estado'      => 'pendiente',
            'metodo_pago' => $data['metodo_pago'] ?? null,
            'pagado'      => false,
            'total'       => $total,
            'notas'       => $data['notas'] ?? null,
        ]);

        foreach ($itemsData as $item) {
            $item['pedido_id'] = $pedido->id;
            PedidoItem::create($item);
        }

        return response()->json($pedido->load(['items.plato', 'user']), 201);
    }

    // GET /pedidos — cocina: activos ordenados por fecha asc
    public function index()
    {
        $pedidos = Pedido::whereIn('estado', ['pendiente', 'preparando', 'listo'])
            ->with(['items.plato', 'user'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($pedidos);
    }

    // GET /pedidos/todos — admin: todos con paginación
    public function todos(Request $request)
    {
        $q = Pedido::with(['items.plato', 'user'])->orderByDesc('created_at');
        if ($request->estado) $q->where('estado', $request->estado);
        return response()->json($q->paginate(20));
    }

    // PATCH /pedidos/{pedido}/preparando
    public function preparando(Pedido $pedido)
    {
        abort_if($pedido->estado !== 'pendiente', 422, 'Solo se pueden preparar pedidos pendientes.');
        $pedido->update(['estado' => 'preparando']);
        return response()->json($pedido->fresh()->load(['items.plato', 'user']));
    }

    // PATCH /pedidos/{pedido}/listo
    public function listo(Pedido $pedido)
    {
        abort_if($pedido->estado !== 'preparando', 422, 'El pedido debe estar en preparación.');
        $pedido->update(['estado' => 'listo']);
        return response()->json($pedido->fresh()->load(['items.plato', 'user']));
    }

    // PATCH /pedidos/{pedido}/entregado
    public function entregado(Pedido $pedido)
    {
        abort_if($pedido->estado !== 'listo', 422, 'El pedido debe estar listo para marcar como entregado.');
        $pedido->update(['estado' => 'entregado']);
        return response()->json($pedido->fresh());
    }

    // POST /pedidos/{pedido}/pagar — marcar como pagado (efectivo u otros métodos sin Culqi)
    public function pagar(Request $request, Pedido $pedido)
    {
        $data = $request->validate(['metodo_pago' => 'required|string|max:30']);
        abort_if($pedido->pagado, 422, 'Este pedido ya fue pagado.');
        $pedido->update(['pagado' => true, 'metodo_pago' => $data['metodo_pago']]);
        return response()->json($pedido->fresh());
    }
}
