import { Recycle, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', admin: 'Administrator' }
const NEXT_MODULE = {
  seller: 'Module 3 will build: Seller Dashboard, Product Management & Orders.',
  admin: 'Module 4 will build: Admin Dashboard, Approvals & Reports.',
}

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-paper-100">
      <header className="flex items-center justify-between border-b border-paper-300 bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-copper-500">
            <Recycle className="size-4 text-white" />
          </div>
          <span className="font-display text-base font-semibold text-ink-900">ScrapBridge</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="verdigris">{ROLE_LABEL[user.role]}</Badge>
          <span className="text-sm text-ink-700">{user.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">
          Module 2 complete
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
          You're signed in as {user.companyName || user.name}
        </h1>
        <p className="mt-3 text-sm text-ink-500">{NEXT_MODULE[user.role]}</p>
      </main>
    </div>
  )
}
