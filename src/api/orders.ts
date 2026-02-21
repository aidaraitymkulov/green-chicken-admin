import client from './client'

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

export interface OrderItem {
  foodItemId: string
  name: string
  quantity: number
  price: number
  portion?: string
}

export interface Order {
  id: string
  name: string
  phone: string
  address: string
  comment: string | null
  status: OrderStatus
  items: OrderItem[]
  total: number
  createdAt: string
  updatedAt: string
}

export const ordersApi = {
  getAll: (status?: OrderStatus) =>
    client.get<Order[]>('/orders', { params: status ? { status } : undefined }),
  getOne: (id: string) => client.get<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus) =>
    client.patch<Order>(`/orders/${id}/status`, { status }),
  remove: (id: string) => client.delete(`/orders/${id}`),
}
