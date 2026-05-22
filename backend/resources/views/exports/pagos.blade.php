<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1a0a02; background: white; }
  .header { background: #3D1A06; color: white; padding: 18px 24px; margin-bottom: 20px; }
  .header h1 { font-size: 18px; font-weight: bold; }
  .header p  { font-size: 11px; opacity: 0.7; margin-top: 2px; }
  .meta { display: flex; justify-content: space-between; padding: 0 24px 14px; color: #6B7280; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #F9FAFB; padding: 7px 10px; text-align: left; font-weight: bold; color: #6B7280; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; border-bottom: 1.5px solid #E5E7EB; }
  td { padding: 7px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
  tr:nth-child(even) td { background: #FAFAFA; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 8.5px; font-weight: bold; }
  .badge-pendiente  { background: #FEF9C3; color: #854D0E; }
  .badge-verificado { background: #DCFCE7; color: #15803D; }
  .badge-rechazado  { background: #FEE2E2; color: #DC2626; }
  .badge-devuelto   { background: #E0E7FF; color: #4338CA; }
  .total-row td { background: #FFF7ED; font-weight: bold; border-top: 1.5px solid #F5922E; }
  .footer { margin-top: 16px; padding: 10px 24px; font-size: 9px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; }
  .mono { font-family: monospace; font-weight: bold; color: #3D1A06; }
  .amount { font-weight: bold; color: #F5922E; }
  .resumen { display: flex; gap: 20px; padding: 0 24px 16px; flex-wrap: wrap; }
  .resumen-item { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px 14px; font-size: 10px; }
  .resumen-item .val { font-size: 14px; font-weight: bold; color: #F5922E; }
</style>
</head>
<body>

<div class="header">
  <h1>Hotel Brisas de Mayo</h1>
  <p>Reporte de Pagos — {{ $filtro ?? 'Todos los estados' }}</p>
</div>

<div class="meta">
  <span>Generado: {{ now()->format('d/m/Y H:i') }}</span>
  <span>Total: {{ count($pagos) }} pago(s)</span>
</div>

@if(isset($resumen))
<div class="resumen">
  @foreach($resumen as $metodo => $datos)
  <div class="resumen-item">
    <div class="val">S/ {{ number_format($datos['total'], 2) }}</div>
    <div>{{ ucfirst($metodo) }} ({{ $datos['cantidad'] }})</div>
  </div>
  @endforeach
</div>
@endif

<table>
  <thead>
    <tr>
      <th>Reserva</th>
      <th>Cliente</th>
      <th>Sede / Hab.</th>
      <th>Método</th>
      <th>Referencia</th>
      <th>Monto</th>
      <th>Estado</th>
      <th>Fecha</th>
    </tr>
  </thead>
  <tbody>
    @php $gran_total = 0; @endphp
    @foreach ($pagos as $p)
    @php $gran_total += $p->monto; @endphp
    <tr>
      <td class="mono">{{ $p->reserva->codigo ?? '—' }}</td>
      <td>
        <div style="font-weight:600">{{ $p->reserva->cliente->name ?? '—' }}</div>
        <div style="color:#9CA3AF;font-size:9px">{{ $p->reserva->cliente->email ?? '' }}</div>
      </td>
      <td>
        <div>{{ $p->reserva->sede->nombre ?? '—' }}</div>
        <div style="color:#9CA3AF;font-size:9px">Hab. {{ $p->reserva->habitacion->numero ?? '—' }}</div>
      </td>
      <td>{{ ucfirst($p->metodo_pago) }}</td>
      <td style="color:#9CA3AF;font-size:9px">{{ $p->referencia ?? '—' }}</td>
      <td class="amount">S/ {{ number_format($p->monto, 2) }}</td>
      <td><span class="badge badge-{{ $p->estado }}">{{ ucfirst($p->estado) }}</span></td>
      <td>{{ $p->fecha_pago ? \Carbon\Carbon::parse($p->fecha_pago)->format('d/m/Y') : '—' }}</td>
    </tr>
    @endforeach
    <tr class="total-row">
      <td colspan="5" style="text-align:right">TOTAL GENERAL</td>
      <td class="amount">S/ {{ number_format($gran_total, 2) }}</td>
      <td colspan="2"></td>
    </tr>
  </tbody>
</table>

<div class="footer">Hotel Brisas de Mayo — Reporte generado automáticamente por el sistema de gestión</div>
</body>
</html>
