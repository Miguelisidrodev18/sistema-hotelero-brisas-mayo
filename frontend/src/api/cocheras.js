import api from './axiosClient'

export const cocherasApi = {
  getAll:         (params)       => api.get('/cocheras', { params }),
  getDisponibles: (params)       => api.get('/cocheras/disponibles', { params }),
  create:         (data)         => api.post('/cocheras', data),
  update:         (id, data)     => api.put(`/cocheras/${id}`, data),
  destroy:        (id)           => api.delete(`/cocheras/${id}`),

  // Reservas de cochera
  getReservas:    (params)       => api.get('/cochera-reservas', { params }),
  reservar:       (data)         => api.post('/cochera-reservas', data),
  activar:        (id)           => api.patch(`/cochera-reservas/${id}/activar`),
  finalizar:      (id)           => api.patch(`/cochera-reservas/${id}/finalizar`),
  cancelar:       (id)           => api.patch(`/cochera-reservas/${id}/cancelar`),
}
