import api from './axiosClient'

export const pagosApi = {
  getAll:       (params)           => api.get('/pagos', { params }),
  getByReserva: (reservaId)        => api.get(`/reservas/${reservaId}/pago`),
  registrar:    (reservaId, data)  => api.post(`/reservas/${reservaId}/pago`, data),
  verificar:    (pagoId)           => api.patch(`/pagos/${pagoId}/verificar`),
  rechazar:     (pagoId)           => api.patch(`/pagos/${pagoId}/rechazar`),
  culqiCharge:  (data)             => api.post('/culqi/charge', data),
}
