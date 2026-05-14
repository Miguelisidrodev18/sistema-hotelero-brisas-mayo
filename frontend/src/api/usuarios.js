import axiosClient from './axiosClient'

export const usuariosApi = {
  getAll:       (params) => axiosClient.get('/usuarios', { params }),
  getOne:       (id)     => axiosClient.get(`/usuarios/${id}`),
  create:       (data)   => axiosClient.post('/usuarios', data),
  update:       (id, data) => axiosClient.put(`/usuarios/${id}`, data),
  remove:       (id)     => axiosClient.delete(`/usuarios/${id}`),
  toggleActivo: (id)     => axiosClient.patch(`/usuarios/${id}/toggle-activo`),
}
