import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  ListOrdered,
  ShoppingBag,
  UtensilsCrossed,
  LogOut,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/categories', label: 'Категории', icon: ListOrdered },
  { to: '/food-items', label: 'Блюда', icon: UtensilsCrossed },
  { to: '/orders', label: 'Заказы', icon: ShoppingBag },
]

export function AdminLayout() {
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Сайдбар */}
      <aside className="flex w-56 flex-col border-r bg-background">
        <div className="px-4 py-5">
          <span className="text-lg font-semibold tracking-tight">Green Chicken</span>
          <p className="text-xs text-muted-foreground">Админ панель</p>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator />

        <div className="p-3">
          <p className="mb-2 truncate px-1 text-xs text-muted-foreground">{admin?.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut size={14} className="mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex flex-1 flex-col overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
