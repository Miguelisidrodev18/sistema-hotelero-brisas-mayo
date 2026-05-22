import api from './axiosClient'

export const statsApi = {
  dashboard: () => api.get('/stats/dashboard'),
}
