import axiosClient from './axiosClient'

export const tarifasApi = {
  getAll:  ()           => axiosClient.get('/tarifas-temporada'),
  create:  (data)       => axiosClient.post('/tarifas-temporada', data),
  update:  (id, data)   => axiosClient.put(`/tarifas-temporada/${id}`, data),
  destroy: (id)         => axiosClient.delete(`/tarifas-temporada/${id}`),
}
