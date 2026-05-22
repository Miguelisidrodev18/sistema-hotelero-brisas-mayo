import axiosClient from './axiosClient'

export const restauranteApi = {
  menu:    ()              => axiosClient.get('/menu'),
  pedido:  (data)          => axiosClient.post('/pedidos', data),
  pagarCulqi: (id, token)  => axiosClient.post(`/pedidos/${id}/culqi`, { token }),
  pagarEfectivo: (id, met) => axiosClient.post(`/pedidos/${id}/pagar`, { metodo_pago: met }),
  // cocina
  activos: ()              => axiosClient.get('/pedidos'),
  preparando: (id)         => axiosClient.patch(`/pedidos/${id}/preparando`),
  listo:   (id)            => axiosClient.patch(`/pedidos/${id}/listo`),
  entregado: (id)          => axiosClient.patch(`/pedidos/${id}/entregado`),
  // admin
  platos:  ()              => axiosClient.get('/platos'),
  storePlato: (d)          => axiosClient.post('/platos', d),
  updatePlato: (id, d)     => axiosClient.put(`/platos/${id}`, d),
  deletePlato: (id)        => axiosClient.delete(`/platos/${id}`),
  categorias: ()           => axiosClient.get('/categorias-plato'),
  storeCat: (d)            => axiosClient.post('/categorias-plato', d),
  updateCat: (id, d)       => axiosClient.put(`/categorias-plato/${id}`, d),
  deleteCat: (id)          => axiosClient.delete(`/categorias-plato/${id}`),
}
