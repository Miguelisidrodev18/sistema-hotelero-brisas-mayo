<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reserva Cancelada</title>
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
          <p style="color:#FCA5A5;font-size:13px;margin:0;font-weight:600;">Reserva Cancelada</p>
        </td>
      </tr>

      {{-- Body --}}
      <tr>
        <td style="background:white;padding:36px 40px;">

          <p style="font-size:15px;color:#374151;margin:0 0 6px 0;">
            Hola, <strong style="color:#3D1A06;">{{ $reserva->cliente->name }}</strong>
          </p>
          <p style="font-size:14px;color:#6B7280;margin:0 0 28px 0;line-height:1.6;">
            Te confirmamos que la reserva <strong style="color:#DC2626;">#{{ $reserva->codigo }}</strong> ha sido cancelada.
          </p>

          {{-- Detalles cancelados --}}
          @php $noches = $reserva->fecha_entrada->diffInDays($reserva->fecha_salida); @endphp
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #FEE2E2;border-radius:12px;overflow:hidden;margin-bottom:28px;opacity:0.9;">
            <tr style="background:#FEF2F2;">
              <td colspan="2" style="padding:12px 18px;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #FEE2E2;">
                Reserva cancelada
              </td>
            </tr>
            @foreach([
              ['Código',      $reserva->codigo],
              ['Sede',        $reserva->sede->nombre ?? '—'],
              ['Habitación',  'N° ' . ($reserva->habitacion->numero ?? '—')],
              ['Entrada',     $reserva->fecha_entrada->translatedFormat('D d \d\e M Y')],
              ['Salida',      $reserva->fecha_salida->translatedFormat('D d \d\e M Y')],
            ] as [$label, $value])
            <tr>
              <td style="padding:10px 18px;font-size:13px;color:#9CA3AF;border-bottom:1px solid #FEF2F2;width:40%;text-decoration:line-through;">{{ $label }}</td>
              <td style="padding:10px 18px;font-size:13px;color:#9CA3AF;border-bottom:1px solid #FEF2F2;text-decoration:line-through;">{{ $value }}</td>
            </tr>
            @endforeach
          </table>

          <div style="background:#FFF7ED;border:1px solid rgba(245,146,46,0.3);border-radius:12px;padding:18px 20px;">
            <p style="font-size:13px;font-weight:700;color:#92400E;margin:0 0 6px 0;">¿Deseas hacer una nueva reserva?</p>
            <p style="font-size:13px;color:#6B7280;margin:0;line-height:1.6;">
              Puedes acceder a nuestro sistema en cualquier momento para ver disponibilidad y reservar la habitación que más te convenga.
              Si la cancelación fue un error, contáctanos al <strong>+51 999 000 111</strong>.
            </p>
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
