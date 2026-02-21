import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { foodItemsApi } from '@/api/food-items'
import { categoriesApi } from '@/api/categories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingBag, UtensilsCrossed, ListOrdered, Clock } from 'lucide-react'

export function DashboardPage() {
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: () => ordersApi.getAll().then(r => r.data) })
  const { data: foodItems } = useQuery({ queryKey: ['food-items'], queryFn: () => foodItemsApi.getAll().then(r => r.data) })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll().then(r => r.data) })

  const newOrders = orders?.filter(o => o.status === 'NEW').length ?? 0
  const inProgress = orders?.filter(o => o.status === 'IN_PROGRESS').length ?? 0

  const stats = [
    { label: 'Новых заказов', value: newOrders, icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'В работе', value: inProgress, icon: Clock, color: 'text-orange-500' },
    { label: 'Всего блюд', value: foodItems?.length ?? 0, icon: UtensilsCrossed, color: 'text-green-600' },
    { label: 'Категорий', value: categories?.length ?? 0, icon: ListOrdered, color: 'text-purple-600' },
  ]

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon size={18} className={color} />
            </CardHeader>
            <CardContent>
              {orders === undefined ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Последние заказы */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Последние заказы</h2>
        {!orders ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Заказов пока нет</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map(order => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div>
                    <p className="text-sm font-medium">{order.name} · {order.phone}</p>
                    <p className="text-xs text-muted-foreground">{order.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{order.total.toLocaleString()}с</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('ru')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
