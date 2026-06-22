<?php

namespace App\Http\Controllers;

use App\Mail\ReservaConfirmadaMail;
use App\Mail\ReservaCanceladaMail;
use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\TarifaTemporada;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ReservaController extends Controller
{
    public function index(Request $request)
    {
        $user  = auth()->user();
        $query = Reserva::with([
            'cliente:id,name,email,telefono,dni',
            'habitacion:id,numero,tipo,piso',
            'sede:id,nombre',
            'pagos:id,reserva_id,monto,tipo_pago,metodo_pago,estado,fecha_pago,referencia',
        ]);

        // Cliente solo ve sus propias reservas
        if ($user->role === 'cliente') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('estado'))      $query->where('estado', $request->estado);
        if ($request->filled('sede_id'))     $query->where('sede_id', $request->sede_id);
        if ($request->filled('habitacion_id')) $query->where('habitacion_id', $request->habitacion_id);
        if ($request->filled('fecha_desde')) $query->whereDate('fecha_entrada', '>=', $request->fecha_desde);
        if ($request->filled('fecha_hasta')) $query->whereDate('fecha_entrada', '<=', $request->fecha_hasta);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('codigo', 'like', "%$s%")
                  ->orWhereHas('cliente', fn($q2) => $q2->where('name', 'like', "%$s%")->orWhere('dni', 'like', "%$s%"))
            );
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $authUser = auth()->user();

        $data = $request->validate([
            'habitacion_id'        => 'required_without:habitaciones|exists:habitaciones,id',
            'habitaciones'         => 'required_without:habitacion_id|array|min:1|max:6',
            'habitaciones.*'       => 'exists:habitaciones,id',
            'fecha_entrada'        => 'required|date|after_or_equal:today',
            'fecha_salida'         => 'required|date|after:fecha_entrada',
            'num_huespedes'        => 'required|integer|min:1|max:10',
            'notas'                => 'nullable|string|max:500',
            'user_id'              => 'nullable|exists:users,id',
            'origen'               => 'nullable|in:online,presencial,llamada',
            'descuento_porcentaje' => 'nullable|numeric|min:0|max:100',
            'descuento_motivo'     => 'nullable|string|max:255',
            'codigo_descuento'           => 'nullable|string|max:20',
            'precio_noche_personalizado' => 'nullable|numeric|min:1',
            'pago_metodo'                => 'nullable|in:efectivo,transferencia,yape,plin,tarjeta',
            'pago_tipo'            => 'nullable|in:adelanto,total',
            'pago_referencia'      => 'nullable|string|max:100',
            'hora_checkin'         => 'nullable|date_format:H:i',
            'hora_checkout'        => 'nullable|date_format:H:i',
        ]);

        // Normalizar a array de IDs (backward-compatible con habitacion_id único)
        $habitacionIds = $data['habitaciones'] ?? [$data['habitacion_id']];
        $habitaciones  = Habitacion::findMany($habitacionIds)->keyBy('id');

        // Verificar disponibilidad para TODAS las habitaciones antes de crear ninguna
        foreach ($habitacionIds as $habId) {
            $solapada = Reserva::where('habitacion_id', $habId)
                ->whereNotIn('estado', ['cancelada', 'expirada', 'finalizada'])
                ->where('fecha_salida', '>', $data['fecha_entrada'])
                ->where('fecha_entrada', '<', $data['fecha_salida'])
                ->exists();

            if ($solapada) {
                $num = $habitaciones[$habId]->numero ?? $habId;
                return response()->json(['message' => "La habitación N° {$num} no está disponible en esas fechas."], 422);
            }
        }

        $noches    = now()->parse($data['fecha_entrada'])->diffInDays($data['fecha_salida']);
        $clienteId = $data['user_id'] ?? $authUser->id;
        $origen    = $data['origen'] ?? 'online';
        if (in_array($authUser->role, ['administrador','recepcionista']) && $origen === 'online' && !isset($data['origen'])) {
            $origen = 'presencial';
        }

        // Validar código de descuento antes de iniciar la transacción
        $codigoDescuentoId = null;
        if (!empty($data['descuento_porcentaje']) && in_array($authUser->role, ['administrador','recepcionista'])) {
            if (empty($data['codigo_descuento'])) {
                return response()->json(['message' => 'Se requiere un código de autorización para aplicar descuento.'], 422);
            }
            $codigoObj = \App\Models\CodigoDescuento::where('codigo', strtoupper(trim($data['codigo_descuento'])))->first();
            if (!$codigoObj || !$codigoObj->isValido()) {
                return response()->json(['message' => 'Código de autorización inválido, inactivo o vencido.'], 422);
            }
            $codigoDescuentoId = $codigoObj->id;
        }

        $reservasCreadas = DB::transaction(function () use ($data, $habitacionIds, $habitaciones, $noches, $clienteId, $origen, $authUser, $codigoDescuentoId) {
            $creadas   = [];
            $grupoId   = null;

            foreach ($habitacionIds as $habId) {
                $habitacion = $habitaciones[$habId];

                $factor = TarifaTemporada::where('activo', true)
                    ->where(fn ($q) => $q->whereNull('sede_id')->orWhere('sede_id', $habitacion->sede_id))
                    ->where('fecha_inicio', '<=', $data['fecha_salida'])
                    ->where('fecha_fin',    '>=', $data['fecha_entrada'])
                    ->max('factor') ?? 1.0;

                $precioNoche    = round($habitacion->precio * $factor, 2);
                $precioOriginal = $precioNoche * $noches;

                $descuentoPct = null;
                $precioTotal  = $precioOriginal;

                if (!empty($data['precio_noche_personalizado']) && in_array($authUser->role, ['administrador','recepcionista'])) {
                    // Precio fijo por noche — sin código requerido
                    $precioNochePersonalizado = (float) $data['precio_noche_personalizado'];
                    $precioTotal  = round($precioNochePersonalizado * $noches, 2);
                    $descuentoPct = $precioOriginal > 0
                        ? round(($precioOriginal - $precioTotal) / $precioOriginal * 100, 2)
                        : null;
                    // Guardar el precio ajustado como precio_noche para que el resumen sea coherente
                    $precioNoche = $precioNochePersonalizado;
                } elseif ($codigoDescuentoId && !empty($data['descuento_porcentaje'])) {
                    $descuentoPct = (float) $data['descuento_porcentaje'];
                    $precioTotal  = round($precioOriginal * (1 - $descuentoPct / 100), 2);
                    // Restaurar precio_noche original para que la columna refleje la tarifa base
                    $precioNoche  = round($habitacion->precio * $factor, 2);
                }

                $reserva = Reserva::create([
                    'grupo_id'             => $grupoId,
                    'user_id'              => $clienteId,
                    'habitacion_id'        => $habitacion->id,
                    'sede_id'              => $habitacion->sede_id,
                    'created_by'           => $authUser->id,
                    'fecha_entrada'        => $data['fecha_entrada'],
                    'fecha_salida'         => $data['fecha_salida'],
                    'num_huespedes'        => $data['num_huespedes'],
                    'precio_noche'         => $precioNoche,
                    'precio_total'         => $precioTotal,
                    'precio_original'      => $descuentoPct !== null ? $precioOriginal : null,
                    'descuento_porcentaje' => $descuentoPct,
                    'descuento_motivo'     => $data['descuento_motivo'] ?? null,
                    'codigo_descuento_id'  => $codigoDescuentoId,
                    'origen'               => $origen,
                    'estado'               => 'pendiente',
                    'codigo'               => strtoupper(Str::random(8)),
                    'notas'                => $data['notas'] ?? null,
                    'hora_checkin'         => $data['hora_checkin']  ?? '14:00',
                    'hora_checkout'        => $data['hora_checkout'] ?? '12:00',
                ]);

                // La primera reserva del grupo se auto-referencia como grupo_id
                if ($grupoId === null && count($habitacionIds) > 1) {
                    $grupoId = $reserva->id;
                    $reserva->update(['grupo_id' => $grupoId]);
                }

                // Pago inmediato si lo registra un recepcionista
                if (!empty($data['pago_metodo']) && in_array($authUser->role, ['administrador','recepcionista'])) {
                    $tipoPago = $data['pago_tipo'] ?? 'total';
                    $monto    = $tipoPago === 'adelanto' ? round($reserva->precio_total * 0.5, 2) : $reserva->precio_total;
                    \App\Models\Pago::create([
                        'reserva_id'     => $reserva->id,
                        'user_id'        => $clienteId,
                        'registrado_por' => $authUser->id,
                        'monto'          => $monto,
                        'tipo_pago'      => $tipoPago,
                        'metodo_pago'    => $data['pago_metodo'],
                        'estado'         => 'verificado',
                        'referencia'     => $data['pago_referencia'] ?? null,
                        'fecha_pago'     => now(),
                    ]);
                    $reserva->update(['estado' => 'confirmada']);
                    $habitacion->update(['estado' => 'reservada']);
                }

                $creadas[] = $reserva;
            }

            return $creadas;
        });

        // Enviar email solo para la primera reserva
        try {
            $primera = $reservasCreadas[0]->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']);
            Mail::to($primera->cliente->email)->send(new ReservaConfirmadaMail($primera));
        } catch (\Throwable) {}

        // Respuesta backward-compatible: array solo si hay múltiples habitaciones
        if (count($reservasCreadas) === 1) {
            return response()->json($reservasCreadas[0]->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']), 201);
        }

        $cargadas = collect($reservasCreadas)->map(fn($r) => $r->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
        return response()->json(['reservas' => $cargadas], 201);
    }

    public function porGrupo(int $grupoId)
    {
        $user     = auth()->user();
        $reservas = Reserva::where(fn($q) => $q->where('grupo_id', $grupoId)->orWhere('id', $grupoId))
            ->with(['habitacion:id,numero,tipo,piso', 'sede:id,nombre', 'pagos:id,reserva_id,monto,estado'])
            ->get();

        // Clientes solo ven sus propias reservas de grupo
        if ($user->role === 'cliente') {
            $reservas = $reservas->where('user_id', $user->id)->values();
        }

        return response()->json($reservas);
    }

    public function show(Reserva $reserva)
    {
        $this->authorizeReserva($reserva);
        return response()->json($reserva->load(['cliente:id,name,email,telefono,dni', 'habitacion', 'sede', 'creadoPor:id,name']));
    }

    public function update(Request $request, Reserva $reserva)
    {
        $data = $request->validate([
            'notas' => 'nullable|string|max:500',
        ]);
        $reserva->update($data);
        return response()->json($reserva->fresh());
    }

    public function confirmar(Reserva $reserva)
    {
        if ($reserva->estado !== 'pendiente') {
            return response()->json(['message' => 'Solo se pueden confirmar reservas pendientes.'], 422);
        }
        $reserva->update(['estado' => 'confirmada']);
        $reserva->habitacion->update(['estado' => 'reservada']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function checkin(Reserva $reserva)
    {
        if ($reserva->estado !== 'confirmada') {
            return response()->json(['message' => 'Solo se puede hacer check-in a reservas confirmadas.'], 422);
        }
        $reserva->update(['estado' => 'checkin']);
        $reserva->habitacion->update(['estado' => 'ocupada']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function resumen(Reserva $reserva)
    {
        $this->authorizeReserva($reserva);

        $reserva->load([
            'cliente:id,name,email,telefono,dni',
            'habitacion:id,numero,tipo,piso',
            'sede:id,nombre',
            'pagos'           => fn ($q) => $q->whereIn('estado', ['verificado', 'pendiente'])->orderBy('created_at'),
            'servicios.servicio:id,nombre,precio',
        ]);

        $totalPagado    = $reserva->pagos->where('estado', 'verificado')->sum('monto');
        $totalServicios = $reserva->servicios->sum('subtotal');
        $granTotal      = $reserva->precio_total + $totalServicios;
        $saldo          = max(0, $granTotal - $totalPagado);

        return response()->json([
            'reserva'          => $reserva,
            'noches'           => $reserva->noches,
            'total_pagado'     => round($totalPagado, 2),
            'total_servicios'  => round($totalServicios, 2),
            'gran_total'       => round($granTotal, 2),
            'saldo_pendiente'  => round($saldo, 2),
        ]);
    }

    public function checkout(Reserva $reserva)
    {
        if ($reserva->estado !== 'checkin') {
            return response()->json(['message' => 'Solo se puede hacer check-out a reservas en check-in.'], 422);
        }
        $reserva->update(['estado' => 'finalizada']);
        $reserva->habitacion->update(['estado' => 'limpieza']);
        return response()->json($reserva->fresh()->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']));
    }

    public function cancelar(Reserva $reserva)
    {
        $this->authorizeReserva($reserva);
        if (in_array($reserva->estado, ['finalizada', 'cancelada', 'expirada'])) {
            return response()->json(['message' => 'Esta reserva no puede cancelarse.'], 422);
        }
        $reserva->update(['estado' => 'cancelada']);
        if (in_array($reserva->habitacion->estado, ['reservada', 'ocupada'])) {
            $reserva->habitacion->update(['estado' => 'disponible']);
        }

        try {
            $reserva->load(['cliente:id,name,email', 'habitacion:id,numero,tipo', 'sede:id,nombre']);
            Mail::to($reserva->cliente->email)->send(new ReservaCanceladaMail($reserva));
        } catch (\Throwable) {}

        return response()->json($reserva->fresh());
    }

    private function authorizeReserva(Reserva $reserva): void
    {
        $user = auth()->user();
        if ($user->role === 'cliente' && $reserva->user_id !== $user->id) {
            abort(403);
        }
    }
}
