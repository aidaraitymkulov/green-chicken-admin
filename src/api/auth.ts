import client from './client'

export interface Admin {
  id: string
  email: string
}

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ message: string; email: string }>('/auth/login', { email, password }),

  logout: () => client.post('/auth/logout'),

  me: () => client.get<Admin>('/auth/me'),
}
