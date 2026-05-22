<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reserva Confirmada</title>
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
          <p style="color:#F5922E;font-size:13px;margin:0;font-weight:600;">Confirmación de Reserva</p>
        </td>
      </tr>

      {{-- Body --}}
      <tr>
        <td style="background:white;padding:36px 40px;">

          <p style="font-size:15px;color:#374151;margin:0 0 6px 0;">
            Hola, <strong style="color:#3D1A06;">{{ $reserva->cliente->name }}</strong> 👋
          </p>
          <p style="font-size:14px;color:#6B7280;margin:0 0 28px 0;line-height:1.6;">
            Tu reserva ha sido recibida exitosamente. Completa el pago para confirmarla definitivamente.
          </p>

          {{-- Código destacado --}}
          <div style="background:#FDF6ED;border:2px solid #F5922E;border-radius:14px;padding:20px 24px;margin-bottom:28px;text-align:center;">
            <p style="font-size:12px;color:#92400E;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px 0;">Código de reserva</p>
            <p style="font-family:monospace;font-size:32px;font-weight:800;color:#3D1A06;letter-spacing:0.15em;margin:0;">{{ $reserva->codigo }}</p>
            <p style="font-size:12px;color:#9CA3AF;margin:6px 0 0 0;">Muestra este código al hacer check-in</p>
          </div>

          {{-- Detalles --}}
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <tr style="background:#F9FAFB;">
              <td colspan="2" style="padding:12px 18px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #E5E7EB;">
                Detalle de la estadía
              </td>
            </tr>
            @php
              $noches = $reserva->fecha_entrada->diffInDays($reserva->fecha_salida);
            @endphp
            @foreach([
              ['Sede',        $reserva->sede->nombre ?? '—'],
              ['Habitación',  'N° ' . ($reserva->habitacion->numero ?? '—') . ' — ' . str_replace('_', ' ', $reserva->habitacion->tipo ?? '')],
              ['Entrada',     $reserva->fecha_entrada->translatedFormat('D d \d\e M Y')],
              ['Salida',      $reserva->fecha_salida->translatedFormat('D d \d\e M Y')],
              ['Noches',      $noches . ' noche' . ($noches > 1 ? 's' : '')],
              ['Huéspedes',   $reserva->num_huespedes . ' persona' . ($reserva->num_huespedes > 1 ? 's' : '')],
            ] as [$label, $value])
            <tr>
              <td style="padding:11px 18px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;width:40%;">{{ $label }}</td>
              <td style="padding:11px 18px;font-size:13px;color:#111827;font-weight:600;border-bottom:1px solid #F3F4F6;">{{ $value }}</td>
            </tr>
            @endforeach
            <tr style="background:#FFF7ED;">
              <td style="padding:14px 18px;font-size:14px;font-weight:700;color:#92400E;">Total a pagar</td>
              <td style="padding:14px 18px;font-size:18px;font-weight:800;color:#F5922E;">S/ {{ number_format($reserva->precio_total, 2) }}</td>
            </tr>
          </table>

          <p style="font-size:13px;color:#6B7280;line-height:1.65;margin:0;">
            Para confirmar tu reserva, accede a <strong>Mis Reservas</strong> y completa el pago con el método de tu preferencia.
            Si tienes alguna consulta, contáctanos al <strong>+51 999 000 111</strong>.
          </p>
        </td>
      </tr>

      {{-- Footer --}}
      <tr>
        <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="font-size:12px;color:#9CA3AF;margin:0;">Hotel Brisas de Mayo — reservas@brisasdemayo.com</p>
          <p style="font-size:11px;color:#D1D5DB;margin:6px 0 0 0;">Este correo fue generado automáticamente, por favor no respondas a este mensaje.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
