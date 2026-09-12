import { useEffect, useMemo, useState } from 'react'
import { Factory } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApprovalDetailDialog } from '@/features/admin/components/ApprovalDetailDialog'
import { adminService } from '@/services/admin.service'

const FILTERS = ['Pending', 'Approved', 'Rejected', 'All']
const STATUS_BADGE = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'outline' }

export default function SellerApprovalsPage() {
  const [approvals, setApprovals] = useState(null)
  const [filter, setFilter] = useState('Pending')
  const [selected, setSelected] = useState(null)

  function reload() {
    adminService.listApprovals({ role: 'seller' }).then(setApprovals)
  }

  useEffect(reload, [])

  const filtered = useMemo(() => {
    if (!approvals) return []
    if (filter === 'All') return approvals
    return approvals.filter((a) => a.user.status === filter.toLowerCase())
  }, [approvals, filter])

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={Factory} eyebrow="Platform-wide" title="Seller approvals" subtitle="Verify new seller registrations before they can list." />

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>
          {FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {!approvals ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Factory} title="No sellers here" description="Registrations matching this filter will show up here." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.userId} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                    <td className="px-5 py-3 font-medium text-ink-900">{a.user.companyName}</td>
                    <td className="px-5 py-3 text-ink-700">{a.profile?.contactPerson || a.user.name} · {a.user.email}</td>
                    <td className="px-5 py-3 text-ink-500">{new Date(a.requestedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3"><Badge variant={STATUS_BADGE[a.user.status]}>{a.user.status}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelected(a)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ApprovalDetailDialog
        approval={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onChanged={reload}
      />
    </DashboardShell>
  )
}
