import axiosClient from './axiosClient'

export const reservasApi = {
  getAll:    (params)       => axiosClient.get('/reservas', { params }),
  getOne:    (id)           => axiosClient.get(`/reservas/${id}`),
  create:    (data)         => axiosClient.post('/reservas', data),
  update:    (id, data)     => axiosClient.put(`/reservas/${id}`, data),
  confirmar: (id)           => axiosClient.patch(`/reservas/${id}/confirmar`),
  checkin:   (id)           => axiosClient.patch(`/reservas/${id}/checkin`),
  checkout:  (id)           => axiosClient.patch(`/reservas/${id}/checkout`),
  cancelar:  (id)           => axiosClient.patch(`/reservas/${id}/cancelar`),
}
