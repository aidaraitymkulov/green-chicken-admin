import client from './client'

export interface Portion {
  label: string
  price: number
}

export interface FoodItem {
  id: string
  name: string
  title: string
  description: string
  price: number
  image: string | null
  isPopular: boolean
  portions: Portion[] | null
  sortOrder: number
  categoryId: string
  category: { id: string; name: string; slug: string }
  createdAt: string
  updatedAt: string
}

export interface FoodItemPayload {
  name: string
  title: string
  description?: string
  price: number
  image?: string
  isPopular?: boolean
  portions?: Portion[]
  sortOrder?: number
  categoryId: string
}

export const foodItemsApi = {
  getAll: (params?: { categoryId?: string; popular?: boolean }) =>
    client.get<FoodItem[]>('/food-items', { params }),
  getOne: (id: string) => client.get<FoodItem>(`/food-items/${id}`),
  create: (data: FoodItemPayload) => client.post<FoodItem>('/food-items', data),
  update: (id: string, data: Partial<FoodItemPayload>) =>
    client.patch<FoodItem>(`/food-items/${id}`, data),
  remove: (id: string) => client.delete(`/food-items/${id}`),
}
