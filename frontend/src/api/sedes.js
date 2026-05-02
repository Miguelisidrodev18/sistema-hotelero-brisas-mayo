import axiosClient from './axiosClient'

export const sedesApi = {
  getAll: () => axiosClient.get('/sedes'),
}
