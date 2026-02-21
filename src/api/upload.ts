import client from './client'

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return client.post<{ url: string }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  remove: (filename: string) => client.delete(`/upload/${filename}`),
}
