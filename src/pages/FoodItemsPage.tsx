import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foodItemsApi, type FoodItem, type FoodItemPayload, type Portion } from '@/api/food-items'
import { categoriesApi } from '@/api/categories'
import { uploadApi } from '@/api/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const emptyForm = (): FoodItemPayload => ({
  name: '', title: '', description: '', price: undefined as unknown as number,
  isPopular: false, portions: [], sortOrder: undefined, categoryId: '',
})

export function FoodItemsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FoodItem | null>(null)
  const [form, setForm] = useState<FoodItemPayload>(emptyForm())
  const [uploading, setUploading] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('ALL')

  const { data: items, isLoading } = useQuery({
    queryKey: ['food-items', filterCat],
    queryFn: () => foodItemsApi.getAll(filterCat !== 'ALL' ? { categoryId: filterCat } : undefined).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (data: FoodItemPayload) => foodItemsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); closeDialog(); toast.success('Блюдо создано') },
    onError: () => toast.error('Ошибка при создании'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FoodItemPayload> }) =>
      foodItemsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); closeDialog(); toast.success('Блюдо обновлено') },
    onError: () => toast.error('Ошибка при обновлении'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => foodItemsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['food-items'] }); toast.success('Блюдо удалено') },
    onError: () => toast.error('Ошибка при удалении'),
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setOpen(true) }
  const openEdit = (item: FoodItem) => {
    setEditing(item)
    setForm({
      name: item.name, title: item.title, description: item.description,
      price: item.price, image: item.image ?? undefined,
      isPopular: item.isPopular, portions: item.portions ?? [],
      sortOrder: item.sortOrder, categoryId: item.categoryId,
    })
    setOpen(true)
  }
  const closeDialog = () => setOpen(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await uploadApi.upload(file)
      setForm(f => ({ ...f, image: data.url }))
      toast.success('Фото загружено')
    } catch {
      toast.error('Ошибка загрузки фото')
    } finally {
      setUploading(false)
    }
  }

  const addPortion = () =>
    setForm(f => ({ ...f, portions: [...(f.portions ?? []), { label: '', price: 0 }] }))

  const updatePortion = (i: number, field: keyof Portion, value: string | number) =>
    setForm(f => ({
      ...f,
      portions: f.portions?.map((p, idx) => idx === i ? { ...p, [field]: value } : p),
    }))

  const removePortion = (i: number) =>
    setForm(f => ({ ...f, portions: f.portions?.filter((_, idx) => idx !== i) }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) update.mutate({ id: editing.id, data: form })
    else create.mutate(form)
  }

  const isPending = create.isPending || update.isPending

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Блюда</h1>
        <div className="flex gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Все категории</SelectItem>
              {categories?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} size="sm">
            <Plus size={16} className="mr-2" /> Добавить
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Популярное</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category.name}</TableCell>
                  <TableCell>{item.price.toLocaleString()}с</TableCell>
                  <TableCell>
                    {item.isPopular && <Badge variant="secondary">Да</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(item.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать блюдо' : 'Новое блюдо'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Название</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Описание (краткое)</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Описание (полное)</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Цена (с)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price ?? ''}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
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
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Категория</Label>
                <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label>Фото</Label>
                <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {form.image && (
                  <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${form.image}`} alt="" className="h-24 w-24 rounded object-cover" />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={form.isPopular}
                  onChange={e => setForm({ ...form, isPopular: e.target.checked })}
                />
                <Label htmlFor="popular">Популярное блюдо</Label>
              </div>
            </div>

            {/* Порции */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Порции</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPortion}>
                  <Plus size={13} className="mr-1" /> Добавить
                </Button>
              </div>
              {form.portions?.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="0.5кг"
                    value={p.label}
                    onChange={e => updatePortion(i, 'label', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    value={p.price}
                    onChange={e => updatePortion(i, 'price', Number(e.target.value))}
                    className="w-24"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removePortion(i)}>
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Отмена</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
