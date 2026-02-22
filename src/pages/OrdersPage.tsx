import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, type Order, type OrderStatus } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELLED: 'Отменён',
}

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  NEW: 'default',
  IN_PROGRESS: 'secondary',
  DONE: 'outline',
  CANCELLED: 'destructive',
}

export function OrdersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Order | null>(null)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getAll(statusFilter === 'ALL' ? undefined : statusFilter).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Статус обновлён') },
    onError: () => toast.error('Ошибка при обновлении статуса'),
  })

  const remove = useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Заказ удалён') },
    onError: () => toast.error('Ошибка при удалении'),
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Заказы</h1>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as OrderStatus | 'ALL')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Все</SelectItem>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map(s => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.name}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell>{order.total.toLocaleString()}с</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={v => updateStatus.mutate({ id: order.id, status: v as OrderStatus })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANT[order.status]} className="pointer-events-none text-xs">
                            {STATUS_LABEL[order.status]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(order.createdAt).toLocaleDateString('ru')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(order)}>
                        <Eye size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove.mutate(order.id)}
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заказ — {selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-3 text-sm">
              <p><span className="text-muted-foreground">Телефон:</span> {selected.phone}</p>
              <p><span className="text-muted-foreground">Адрес:</span> {selected.address}</p>
              {selected.comment && <p><span className="text-muted-foreground">Комментарий:</span> {selected.comment}</p>}
              <div>
                <p className="mb-2 text-muted-foreground">Состав:</p>
                <div className="flex flex-col gap-1">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{item.name}{item.portion ? ` (${item.portion})` : ''} × {item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}с</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Итого</span>
                <span>{selected.total.toLocaleString()}с</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
