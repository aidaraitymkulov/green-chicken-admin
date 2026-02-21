import client from './client'

export interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CategoryPayload {
  name: string
  slug: string
  image?: string
  sortOrder?: number
}

export const categoriesApi = {
  getAll: () => client.get<Category[]>('/categories'),
  getOne: (id: string) => client.get<Category>(`/categories/${id}`),
  create: (data: CategoryPayload) => client.post<Category>('/categories', data),
  update: (id: string, data: Partial<CategoryPayload>) =>
    client.patch<Category>(`/categories/${id}`, data),
  remove: (id: string) => client.delete(`/categories/${id}`),
}
