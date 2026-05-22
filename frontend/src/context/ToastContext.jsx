import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_META = {
  success: { icon: CheckCircle,   bg: '#DCFCE7', border: '#86EFAC', color: '#15803D', iconColor: '#16A34A' },
  error:   { icon: XCircle,       bg: '#FEE2E2', border: '#FCA5A5', color: '#991B1B', iconColor: '#DC2626' },
  warning: { icon: AlertTriangle, bg: '#FEF9C3', border: '#FDE047', color: '#854D0E', iconColor: '#D97706' },
  info:    { icon: Info,          bg: '#DBEAFE', border: '#93C5FD', color: '#1E40AF', iconColor: '#2563EB' },
}

function Toast({ toast, onClose }) {
  const m = TOAST_META[toast.type] ?? TOAST_META.info
  const Icon = m.icon
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: m.bg, border: `1px solid ${m.border}`,
      borderRadius: 14, padding: '0.9rem 1rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      minWidth: 280, maxWidth: 380,
      animation: 'slideIn 0.25s ease',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Barra lateral de color */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: m.iconColor, borderRadius: '14px 0 0 14px' }}/>
      <div style={{ paddingLeft: 4, display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
        <Icon size={18} style={{ color: m.iconColor, flexShrink: 0, marginTop: 1 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && <p style={{ fontWeight: 700, fontSize: '0.85rem', color: m.color, marginBottom: '0.15rem' }}>{toast.title}</p>}
          <p style={{ fontSize: '0.82rem', color: m.color, lineHeight: 1.5 }}>{toast.message}</p>
        </div>
        <button onClick={() => onClose(toast.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.color, opacity: 0.6, flexShrink: 0, padding: 0 }}>
          <X size={15}/>
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timerRef = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timerRef.current[id])
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const show = useCallback((message, { type = 'info', title, duration = 4000 } = {}) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type, title }])
    if (duration > 0) {
      timerRef.current[id] = setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const toast = {
    success: (msg, opts) => show(msg, { type: 'success', ...opts }),
    error:   (msg, opts) => show(msg, { type: 'error',   ...opts }),
    warning: (msg, opts) => show(msg, { type: 'warning', ...opts }),
    info:    (msg, opts) => show(msg, { type: 'info',    ...opts }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '0.6rem', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast toast={t} onClose={dismiss}/>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
