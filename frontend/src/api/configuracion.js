import axiosClient from './axiosClient'

export const configuracionApi = {
  getAll:    ()            => axiosClient.get('/configuracion'),
  update:    (configs)     => axiosClient.put('/configuracion', { configs }),
  buscarRuc: (ruc)         => axiosClient.get(`/configuracion/ruc/${ruc}`),
}
