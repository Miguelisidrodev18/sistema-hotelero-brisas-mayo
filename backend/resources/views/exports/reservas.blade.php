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
  .badge-pendiente  { background: #FEF3C7; color: #92400E; }
  .badge-confirmada { background: #DBEAFE; color: #1E40AF; }
  .badge-checkin    { background: #D1FAE5; color: #065F46; }
  .badge-finalizada { background: #F3F4F6; color: #374151; }
  .badge-cancelada  { background: #FEE2E2; color: #991B1B; }
  .badge-expirada   { background: #F3F4F6; color: #6B7280; }
  .total-row td { background: #FFF7ED; font-weight: bold; border-top: 1.5px solid #F5922E; }
  .footer { margin-top: 16px; padding: 10px 24px; font-size: 9px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; }
  .mono { font-family: monospace; font-weight: bold; color: #3D1A06; }
  .amount { font-weight: bold; color: #F5922E; }
</style>
</head>
<body>

<div class="header">
  <h1>Hotel Brisas de Mayo</h1>
  <p>Reporte de Reservas — {{ $filtro ?? 'Todos los estados' }}</p>
</div>

<div class="meta">
  <span>Generado: {{ now()->format('d/m/Y H:i') }}</span>
  <span>Total: {{ count($reservas) }} reserva(s)</span>
</div>

<table>
  <thead>
    <tr>
      <th>Código</th>
      <th>Cliente</th>
      <th>Sede / Hab.</th>
      <th>Entrada</th>
      <th>Salida</th>
      <th>Noches</th>
      <th>Huéspedes</th>
      <th>Total</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    @php $gran_total = 0; @endphp
    @foreach ($reservas as $r)
    @php
      $noches = \Carbon\Carbon::parse($r->fecha_entrada)->diffInDays($r->fecha_salida);
      $gran_total += $r->precio_total;
    @endphp
    <tr>
      <td class="mono">{{ $r->codigo }}</td>
      <td>
        <div style="font-weight:600">{{ $r->cliente->name ?? '—' }}</div>
        <div style="color:#9CA3AF;font-size:9px">{{ $r->cliente->email ?? '' }}</div>
      </td>
      <td>
        <div>{{ $r->sede->nombre ?? '—' }}</div>
        <div style="color:#9CA3AF;font-size:9px">Hab. {{ $r->habitacion->numero ?? '—' }}</div>
      </td>
      <td>{{ \Carbon\Carbon::parse($r->fecha_entrada)->format('d/m/Y') }}</td>
      <td>{{ \Carbon\Carbon::parse($r->fecha_salida)->format('d/m/Y') }}</td>
      <td style="text-align:center">{{ $noches }}</td>
      <td style="text-align:center">{{ $r->num_huespedes }}</td>
      <td class="amount">S/ {{ number_format($r->precio_total, 2) }}</td>
      <td><span class="badge badge-{{ $r->estado }}">{{ ucfirst($r->estado) }}</span></td>
    </tr>
    @endforeach
    <tr class="total-row">
      <td colspan="7" style="text-align:right">TOTAL GENERAL</td>
      <td class="amount">S/ {{ number_format($gran_total, 2) }}</td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="footer">Hotel Brisas de Mayo — Reporte generado automáticamente por el sistema de gestión</div>
</body>
</html>
