import axiosClient from './axiosClient'

export const habitacionesApi = {
  getAll: (params = {}) => axiosClient.get('/habitaciones', { params }),
  update:  (id, data)    => axiosClient.put(`/habitaciones/${id}`, data),
}
