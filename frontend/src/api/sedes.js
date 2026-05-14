import axiosClient from './axiosClient'

export const sedesApi = {
  getPublicas: ()           => axiosClient.get('/sedes/publicas'),
  getAll:      ()           => axiosClient.get('/sedes'),
  getOne:      (id)         => axiosClient.get(`/sedes/${id}`),
  create:      (data)       => axiosClient.post('/sedes', data),
  update:      (id, data)   => axiosClient.put(`/sedes/${id}`, data),
  remove:      (id)         => axiosClient.delete(`/sedes/${id}`),
}
