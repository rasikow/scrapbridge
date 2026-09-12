import { useEffect, useMemo, useState } from 'react'
import { ScrollText, LogIn, ShieldCheck, Package, Receipt, User, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auditService } from '@/services/audit.service'

const CATEGORIES = ['All', 'Login', 'Approval', 'Product', 'Order', 'User']
const CATEGORY_ICON = { login: LogIn, approval: ShieldCheck, product: Package, order: Receipt, user: User }
const CATEGORY_TONE = { login: 'default', approval: 'verdigris', product: 'copper', order: 'success', user: 'warning' }
const ROLE_BADGE = { buyer: 'default', seller: 'copper', admin: 'verdigris', system: 'outline' }

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState(null)
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')

  useEffect(() => {
    auditService.listLogs({ category, query }).then(setLogs)
  }, [category, query])

  const grouped = useMemo(() => {
    if (!logs) return []
    const byDay = {}
    logs.forEach((l) => {
      const day = new Date(l.at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      byDay[day] ||= []
      byDay[day].push(l)
    })
    return Object.entries(byDay)
  }, [logs])

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={ScrollText} eyebrow="System trail" title="Audit logs" subtitle="Logins, approvals, product changes, orders and user activity across the marketplace." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {CATEGORIES.map((c) => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input placeholder="Search actor, action, target…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {!logs ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity found" description="Try a different filter or search term." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, entries]) => (
            <div key={day}>
              <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-ink-500">{day}</p>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
                {entries.map((l, i) => {
                  const Icon = CATEGORY_ICON[l.category] || ScrollText
                  return (
                    <div key={l.id} className={`flex items-center gap-3 px-5 py-3.5 ${i < entries.length - 1 ? 'border-b border-paper-200' : ''}`}>
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-200">
                        <Icon className="size-4 text-ink-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink-900">
                          <span className="font-medium">{l.actor}</span>{' '}
                          <Badge variant={ROLE_BADGE[l.role]} className="mx-1 align-middle">{l.role}</Badge>
                          {l.action}
                          {l.target && <span className="text-ink-500"> · {l.target}</span>}
                        </p>
                      </div>
                      <Badge variant={CATEGORY_TONE[l.category]} className="shrink-0">{l.category}</Badge>
                      <span className="w-16 shrink-0 text-right text-xs text-ink-300">{timeAgo(l.at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
