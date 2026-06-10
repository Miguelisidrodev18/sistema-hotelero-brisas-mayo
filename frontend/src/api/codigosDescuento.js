import axiosClient from './axiosClient'

export const codigosDescuentoApi = {
  getAll:      ()     => axiosClient.get('/codigos-descuento'),
  create:      (data) => axiosClient.post('/codigos-descuento', data),
  validar:     (c)    => axiosClient.post('/codigos-descuento/validar', { codigo: c }),
  toggle:      (id)   => axiosClient.patch(`/codigos-descuento/${id}/toggle`),
  destroy:     (id)   => axiosClient.delete(`/codigos-descuento/${id}`),
  getReservas: (id)   => axiosClient.get(`/codigos-descuento/${id}/reservas`),
}
