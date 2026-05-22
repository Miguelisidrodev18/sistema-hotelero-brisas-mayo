import axiosClient from './axiosClient'

export const serviciosApi = {
  getAll:   ()           => axiosClient.get('/servicios'),
  create:   (data)       => axiosClient.post('/servicios', data),
  update:   (id, data)   => axiosClient.put(`/servicios/${id}`, data),
  destroy:  (id)         => axiosClient.delete(`/servicios/${id}`),

  // Servicios de una reserva
  deReserva:   (reservaId)          => axiosClient.get(`/reservas/${reservaId}/servicios`),
  agregar:     (reservaId, data)    => axiosClient.post(`/reservas/${reservaId}/servicios`, data),
  quitar:      (reservaId, rsId)    => axiosClient.delete(`/reservas/${reservaId}/servicios/${rsId}`),
}
