import axiosClient from './axiosClient'

export const recepcionApi = {
  hoy:        ()       => axiosClient.get('/recepcion/hoy'),
  cajaDiaria: (fecha)  => axiosClient.get('/recepcion/caja', { params: { fecha } }),
}
