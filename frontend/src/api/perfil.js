import axiosClient from './axiosClient'

export const perfilApi = {
  update:         (data) => axiosClient.put('/profile', data),
  changePassword: (data) => axiosClient.put('/profile/password', data),
}
