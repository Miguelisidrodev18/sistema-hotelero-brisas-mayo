<?php

namespace App\Http\Controllers;

use App\Models\ReservaServicio;
use App\Models\Servicio;
use Illuminate\Http\Request;

class ServicioController extends Controller
{
    // GET /servicios
    public function index()
    {
        return response()->json(Servicio::orderBy('categoria')->orderBy('nombre')->get());
    }

    // POST /servicios
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'categoria'   => 'required|string|max:50',
            'descripcion' => 'nullable|string|max:300',
            'precio'      => 'required|numeric|min:0',
            'activo'      => 'boolean',
        ]);
        return response()->json(Servicio::create($data), 201);
    }

    // PUT /servicios/{servicio}
    public function update(Request $request, Servicio $servicio)
    {
        $data = $request->validate([
            'nombre'      => 'sometimes|string|max:100',
            'categoria'   => 'sometimes|string|max:50',
            'descripcion' => 'nullable|string|max:300',
            'precio'      => 'sometimes|numeric|min:0',
            'activo'      => 'boolean',
        ]);
        $servicio->update($data);
        return response()->json($servicio->fresh());
    }

    // DELETE /servicios/{servicio}
    public function destroy(Servicio $servicio)
    {
        $servicio->delete();
        return response()->json(null, 204);
    }

    // POST /reservas/{reserva}/servicios
    public function agregarAReserva(Request $request, \App\Models\Reserva $reserva)
    {
        $data = $request->validate([
            'servicio_id' => 'required|exists:servicios,id',
            'cantidad'    => 'integer|min:1|max:20',
        ]);

        $servicio  = Servicio::findOrFail($data['servicio_id']);
        $cantidad  = $data['cantidad'] ?? 1;
        $subtotal  = $servicio->precio * $cantidad;

        $rs = ReservaServicio::create([
            'reserva_id'      => $reserva->id,
            'servicio_id'     => $servicio->id,
            'cantidad'        => $cantidad,
            'precio_unitario' => $servicio->precio,
            'subtotal'        => $subtotal,
            'registrado_por'  => auth()->id(),
        ]);

        return response()->json($rs->load('servicio'), 201);
    }

    // DELETE /reservas/{reserva}/servicios/{rs}
    public function quitarDeReserva(\App\Models\Reserva $reserva, ReservaServicio $rs)
    {
        abort_if($rs->reserva_id !== $reserva->id, 404);
        $rs->delete();
        return response()->json(null, 204);
    }

    // GET /reservas/{reserva}/servicios
    public function deReserva(\App\Models\Reserva $reserva)
    {
        return response()->json($reserva->servicios()->with('servicio')->get());
    }
}
