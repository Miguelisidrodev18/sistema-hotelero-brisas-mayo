import axiosClient from './axiosClient'

export const habitacionesApi = {
  getAll:           (params = {}) => axiosClient.get('/habitaciones', { params }),
  getDisponibles:   (params = {}) => axiosClient.get('/habitaciones/disponibles', { params }),
  update:           (id, data)    => axiosClient.put(`/habitaciones/${id}`, data),
  subirImagen:      (id, formData) => axiosClient.post(`/habitaciones/${id}/imagenes`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  eliminarImagen:   (id, imgId)   => axiosClient.delete(`/habitaciones/${id}/imagenes/${imgId}`),
  reordenarImagenes:(id, ids)     => axiosClient.patch(`/habitaciones/${id}/imagenes/orden`, { ids }),
}
