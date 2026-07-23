import axiosClient from './axiosClient'

export const mesasApi = {
  index:    ()          => axiosClient.get('/mesas'),
  store:    (data)      => axiosClient.post('/mesas', data),
  update:   (id, data)  => axiosClient.put(`/mesas/${id}`, data),
  destroy:  (id)        => axiosClient.delete(`/mesas/${id}`),
  ocupar:   (id)        => axiosClient.patch(`/mesas/${id}/ocupar`),
  liberar:  (id)        => axiosClient.patch(`/mesas/${id}/liberar`),
}
