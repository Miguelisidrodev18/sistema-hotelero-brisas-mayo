<?php

namespace App\Http\Controllers;

use App\Mail\PagoConfirmadoMail;
use App\Models\Pago;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class PagoController extends Controller
{
    // GET /pagos — lista de pagos para staff
    public function index(Request $request)
    {
        $q = Pago::with([
            'reserva:id,codigo,fecha_entrada,fecha_salida,sede_id,habitacion_id,user_id',
            'reserva.cliente:id,name,email,telefono,dni',
            'reserva.habitacion:id,numero,tipo',
            'reserva.sede:id,nombre',
            'registradoPor:id,name',
        ])->latest();

        if ($request->filled('estado')) {
            $q->where('estado', $request->estado);
        }
        if ($request->filled('metodo_pago')) {
            $q->where('metodo_pago', $request->metodo_pago);
        }
        $this->aplicarFechaYBusqueda($q, $request);

        $pagos = $q->paginate($request->integer('per_page', 20));

        // Resumen — respeta el rango de fechas y la búsqueda (no el estado/método,
        // ya que el resumen desglosa precisamente por estado) para reflejar el período visible.
        $resumenQ = Pago::query();
        $this->aplicarFechaYBusqueda($resumenQ, $request);

        $resumen = [
            'total'       => (clone $resumenQ)->count(),
            'pendiente'   => (clone $resumenQ)->where('estado', 'pendiente')->count(),
            'verificado'  => (clone $resumenQ)->where('estado', 'verificado')->count(),
            'rechazado'   => (clone $resumenQ)->where('estado', 'rechazado')->count(),
            'monto_total' => (clone $resumenQ)->where('estado', 'verificado')->sum('monto'),
        ];

        return response()->json(['pagos' => $pagos, 'resumen' => $resumen]);
    }

    private function aplicarFechaYBusqueda($query, Request $request): void
    {
        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha_pago', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha_pago', '<=', $request->fecha_hasta);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('reserva', fn ($r) =>
                $r->where('codigo', 'like', "%{$search}%")
                  ->orWhereHas('cliente', fn ($c) => $c->where('name', 'like', "%{$search}%"))
            );
        }
    }

    // GET /reservas/{reserva}/pago — detalle de pago de una reserva
    public function show(Reserva $reserva)
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        $pago = $reserva->pagos()->latest()->first();

        return response()->json([
            'reserva' => $reserva->load(['cliente:id,name,email', 'habitacion:id,numero,tipo,piso', 'sede:id,nombre']),
            'pago'    => $pago,
        ]);
    }

    // POST /reservas/{reserva}/pago — registrar pago (adelanto 50% o total)
    public function store(Request $request, Reserva $reserva)
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }

        if (in_array($reserva->estado, ['finalizada', 'cancelada', 'expirada'])) {
            return response()->json(['message' => 'Esta reserva no puede recibir pagos.'], 422);
        }

        $data = $request->validate([
            'metodo_pago' => 'required|in:efectivo,transferencia,yape,plin,tarjeta',
            'tipo_pago'   => 'nullable|in:adelanto,total',
            'referencia'  => 'nullable|string|max:100',
            'notas'       => 'nullable|string|max:500',
        ]);

        $tipoPago = $data['tipo_pago'] ?? 'total';
        $monto    = $tipoPago === 'adelanto'
            ? round($reserva->precio_total * 0.5, 2)
            : $reserva->precio_total;

        $pago = Pago::create([
            'reserva_id'     => $reserva->id,
            'user_id'        => $reserva->user_id,
            'registrado_por' => $user->id,
            'monto'          => $monto,
            'tipo_pago'      => $tipoPago,
            'metodo_pago'    => $data['metodo_pago'],
            'estado'         => 'pendiente',
            'referencia'     => $data['referencia'] ?? null,
            'notas'          => $data['notas'] ?? null,
            'fecha_pago'     => now(),
        ]);

        // Confirmar la reserva automáticamente al registrar el pago
        if ($reserva->estado === 'pendiente') {
            $reserva->update(['estado' => 'confirmada']);
            $reserva->habitacion->update(['estado' => 'reservada']);
        }

        return response()->json([
            'pago'    => $pago->load('reserva'),
            'reserva' => $reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']),
        ], 201);
    }

    // POST /reservas/{reserva}/pago/saldo — recepcionista cobra el saldo pendiente antes del check-in
    public function pagarSaldo(Request $request, Reserva $reserva)
    {
        $data = $request->validate([
            'metodo_pago' => 'required|in:efectivo,transferencia,yape,plin,tarjeta',
            'referencia'  => 'nullable|string|max:100',
        ]);

        $totalPagado    = $reserva->pagos()->where('estado', 'verificado')->sum('monto');
        $totalServicios = $reserva->servicios()->sum('subtotal');
        $saldoPendiente = round(($reserva->precio_total + $totalServicios) - $totalPagado, 2);

        if ($saldoPendiente <= 0) {
            return response()->json(['message' => 'La reserva ya está pagada completamente.'], 422);
        }

        $pago = Pago::create([
            'reserva_id'     => $reserva->id,
            'user_id'        => $reserva->user_id,
            'registrado_por' => auth()->id(),
            'monto'          => $saldoPendiente,
            'tipo_pago'      => 'saldo',
            'metodo_pago'    => $data['metodo_pago'],
            'estado'         => 'verificado', // cobrado en persona, se verifica de inmediato
            'referencia'     => $data['referencia'] ?? null,
            'fecha_pago'     => now(),
        ]);

        return response()->json([
            'pago'    => $pago->load('reserva'),
            'mensaje' => 'Saldo registrado correctamente.',
        ], 201);
    }

    // PATCH /pagos/{pago}/verificar — solo staff
    public function verificar(Pago $pago)
    {
        $pago->update(['estado' => 'verificado']);

        try {
            $reserva = $pago->reserva->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']);
            Mail::to($reserva->cliente->email)->send(new PagoConfirmadoMail($reserva));
        } catch (\Throwable) {}

        return response()->json($pago->fresh()->load('reserva'));
    }

    // PATCH /pagos/{pago}/rechazar — solo staff
    public function rechazar(Pago $pago)
    {
        $pago->update(['estado' => 'rechazado']);
        return response()->json($pago->fresh());
    }

    // GET /folio/{codigo} — público, folio de salida con resumen completo
    public function folio(string $codigo)
    {
        $reserva = \App\Models\Reserva::where('codigo', $codigo)
            ->with([
                'cliente:id,name,email,telefono,dni',
                'habitacion:id,numero,tipo,piso',
                'sede:id,nombre',
                'pagos'     => fn ($q) => $q->whereIn('estado', ['verificado','pendiente'])->orderBy('created_at'),
                'servicios.servicio:id,nombre',
                'huespedes',
            ])
            ->firstOrFail();

        $totalPagado    = $reserva->pagos->where('estado', 'verificado')->sum('monto');
        $totalServicios = $reserva->servicios->sum('subtotal');
        $granTotal      = $reserva->precio_total + $totalServicios;

        return response()->json([
            'reserva'         => $reserva,
            'noches'          => $reserva->noches,
            'total_pagado'    => round($totalPagado, 2),
            'total_servicios' => round($totalServicios, 2),
            'gran_total'      => round($granTotal, 2),
            'saldo_pendiente' => round(max(0, $granTotal - $totalPagado), 2),
        ]);
    }

    // GET /recibo/{codigo} — público, para el recibo compartible
    public function recibo(string $codigo)
    {
        $reserva = \App\Models\Reserva::where('codigo', $codigo)
            ->with([
                'cliente:id,name,email',
                'habitacion:id,numero,tipo,piso',
                'sede:id,nombre',
            ])
            ->firstOrFail();

        $pago = $reserva->pagos()->where('estado', 'verificado')->latest()->first()
             ?? $reserva->pagos()->latest()->first();

        return response()->json(['reserva' => $reserva, 'pago' => $pago]);
    }
}
