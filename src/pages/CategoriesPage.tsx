import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, type Category, type CategoryPayload } from '@/api/categories'
import { uploadApi } from '@/api/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const baseUrl = API_URL.replace(/\/api\/?$/, '')

const empty: CategoryPayload = { name: '', slug: '' }

export function CategoriesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryPayload>(empty)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // модалка для просмотра фото
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data: CategoryPayload) => categoriesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); close(); toast.success('Категория создана') },
    onError: () => toast.error('Ошибка при создании'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryPayload> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); close(); toast.success('Категория обновлена') },
    onError: () => toast.error('Ошибка при обновлении'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Категория удалена') },
    onError: () => toast.error('Ошибка при удалении'),
  })

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true) }
  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, image: cat.image ?? undefined })
    setOpen(true)
  }
  const close = () => setOpen(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadApi.upload(file)
      setForm(prev => ({ ...prev, image: data.url }))
    } catch {
      toast.error('Ошибка загрузки файла')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) update.mutate({ id: editing.id, data: form })
    else create.mutate(form)
  }

  const isPending = create.isPending || update.isPending

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-2" /> Добавить
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Фото</TableHead>
                <TableHead>Порядок</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>
                    {cat.image ? (
                      <button
                        type="button"
                        className="text-sm text-blue-600 underline hover:text-blue-800"
                        onClick={() => setPreviewImage(`${baseUrl}${cat.image}`)}
                      >
                        Фото
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(cat.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Модалка создания / редактирования */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Название</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="chicken"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Порядок</Label>
              <Input
                type="number"
                min={0}
                value={form.sortOrder ?? ''}
                onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Фото</Label>
              {form.image ? (
                <div className="flex items-center gap-2">
                  <img
                    src={`${baseUrl}${form.image}`}
                    alt="Превью"
                    className="h-16 w-16 rounded object-cover"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={removeImage}>
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={14} className="mr-2" />
                    {uploading ? 'Загрузка...' : 'Загрузить'}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close}>Отмена</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Модалка просмотра фото */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Фото категории</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Фото категории"
              className="w-full rounded object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
