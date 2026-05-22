import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 400, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: danger ? '#FEE2E2' : '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} style={{ color: danger ? '#DC2626' : '#D97706' }}/>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.25rem' }}>{title}</p>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding: '0.65rem 1.2rem', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            style={{ padding: '0.65rem 1.2rem', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', background: danger ? 'linear-gradient(135deg,#DC2626,#B91C1C)' : 'linear-gradient(135deg,#F5922E,#E07820)', color: 'white' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
