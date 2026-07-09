// Imprime el contenido de #thermal-ticket de forma aislada (oculta el resto
// de la página). El estilo se inyecta localmente en vez de en el CSS global
// para no afectar el @media print de otras páginas (TicketCheckin, ReciboPago...).
export function imprimirThermalTicket() {
  const prevId = '__thermal-print-style__'
  const prev = document.getElementById(prevId)
  if (prev) prev.remove()

  const s = document.createElement('style')
  s.id = prevId
  s.textContent = `
    @media print {
      @page { size: 80mm auto; margin: 2mm; }
      body * { visibility: hidden !important; }
      #thermal-ticket, #thermal-ticket * { visibility: visible !important; }
      #thermal-ticket {
        display: block !important;
        position: absolute;
        top: 0;
        left: 0;
      }
    }
  `
  document.head.appendChild(s)
  window.print()
  window.addEventListener('afterprint', () => s.remove(), { once: true })
}
