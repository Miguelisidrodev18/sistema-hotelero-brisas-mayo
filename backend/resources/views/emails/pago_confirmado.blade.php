<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pago Confirmado</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      {{-- Header --}}
      <tr>
        <td style="background:linear-gradient(135deg,#3D1A06,#7B4019);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:0.1em;">Hotel</p>
          <h1 style="color:white;font-size:26px;font-weight:800;margin:0 0 4px 0;">Brisas de Mayo</h1>
          <p style="color:#4ADE80;font-size:13px;margin:0;font-weight:600;">✅ Pago Verificado</p>
        </td>
      </tr>

      {{-- Body --}}
      <tr>
        <td style="background:white;padding:36px 40px;">

          <p style="font-size:15px;color:#374151;margin:0 0 6px 0;">
            ¡Excelente, <strong style="color:#3D1A06;">{{ $reserva->cliente->name }}</strong>!
          </p>
          <p style="font-size:14px;color:#6B7280;margin:0 0 28px 0;line-height:1.6;">
            Tu pago ha sido verificado y tu reserva está <strong style="color:#16A34A;">confirmada</strong>.
            ¡Todo listo para tu llegada!
          </p>

          {{-- Check verde --}}
          <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:14px;padding:20px 24px;margin-bottom:28px;text-align:center;">
            <p style="font-size:36px;margin:0 0 8px 0;">🏨</p>
            <p style="font-size:12px;color:#15803D;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px 0;">Tu reserva está confirmada</p>
            <p style="font-family:monospace;font-size:28px;font-weight:800;color:#3D1A06;letter-spacing:0.15em;margin:0;">{{ $reserva->codigo }}</p>
          </div>

          {{-- Detalles --}}
          @php $noches = $reserva->fecha_entrada->diffInDays($reserva->fecha_salida); @endphp
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#F9FAFB;">
              <td colspan="2" style="padding:12px 18px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #E5E7EB;">
                Resumen de tu estadía
              </td>
            </tr>
            @foreach([
              ['Sede',       $reserva->sede->nombre ?? '—'],
              ['Habitación', 'N° ' . ($reserva->habitacion->numero ?? '—') . ' — ' . str_replace('_', ' ', $reserva->habitacion->tipo ?? '')],
              ['Entrada',    $reserva->fecha_entrada->translatedFormat('D d \d\e M Y')],
              ['Salida',     $reserva->fecha_salida->translatedFormat('D d \d\e M Y')],
              ['Noches',     $noches . ' noche' . ($noches > 1 ? 's' : '')],
            ] as [$label, $value])
            <tr>
              <td style="padding:11px 18px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;width:40%;">{{ $label }}</td>
              <td style="padding:11px 18px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #F3F4F6;">{{ $value }}</td>
            </tr>
            @endforeach
            <tr style="background:#F0FDF4;">
              <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#15803D;">Total pagado</td>
              <td style="padding:14px 18px;font-size:16px;font-weight:800;color:#16A34A;">S/ {{ number_format($reserva->precio_total, 2) }}</td>
            </tr>
          </table>

          <div style="background:#FDF6ED;border-radius:12px;padding:18px 20px;margin-bottom:0;">
            <p style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 6px 0;">📋 Recuerda para tu llegada</p>
            <ul style="font-size:13px;color:#6B7280;margin:0;padding-left:18px;line-height:1.8;">
              <li>Presenta tu código <strong>{{ $reserva->codigo }}</strong> en recepción</li>
              <li>El check-in es a partir de las 14:00 hrs</li>
              <li>El check-out es antes de las 12:00 hrs</li>
              <li>Lleva un documento de identidad válido</li>
            </ul>
          </div>
        </td>
      </tr>

      {{-- Footer --}}
      <tr>
        <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0;">Hotel Brisas de Mayo — +51 999 000 111 — reservas@brisasdemayo.com</p>
          <p style="font-size:11px;color:#D1D5DB;margin:6px 0 0 0;">Este correo fue generado automáticamente.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
