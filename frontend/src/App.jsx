import { useEffect, useState } from 'react'
import axiosClient from './api/axiosClient'

export default function App() {
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    axiosClient.get('/ping')
      .then(({ data }) => setStatus(`API OK — ${data.app}`))
      .catch(() => setStatus('Error: no se pudo conectar con la API'))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center gap-4 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-800">Brisas de Mayo</h1>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          status.startsWith('API OK')
            ? 'bg-green-100 text-green-700'
            : status === 'Conectando...'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
        <p className="text-xs text-gray-400">Sprint 0 — Setup completado</p>
      </div>
    </div>
  )
}
