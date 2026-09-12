import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Users, Power, KeyRound, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/services/admin.service'

const ROLE_FILTERS = ['All', 'Buyer', 'Seller', 'Admin']
const STATUS_BADGE = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'outline' }
const ROLE_BADGE = { buyer: 'default', seller: 'copper', admin: 'verdigris' }

export default function UserManagementPage() {
  const { user: admin } = useAuth()
  const [users, setUsers] = useState(null)
  const [roleFilter, setRoleFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [tempPasswordDialog, setTempPasswordDialog] = useState(null)

  function reload() {
    adminService.listAllUsers().then(setUsers)
  }

  useEffect(reload, [])

  const filtered = useMemo(() => {
    let items = users || []
    if (roleFilter !== 'All') items = items.filter((u) => u.role === roleFilter.toLowerCase())
    if (query) {
      const q = query.toLowerCase()
      items = items.filter((u) => (u.companyName || u.name).toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return items
  }, [users, roleFilter, query])

  async function toggleStatus(u) {
    setBusyId(u.id)
    if (u.status === 'suspended') {
      await adminService.activateUser(u.id, admin.name)
      toast.success(`${u.companyName || u.name} activated`)
    } else {
      await adminService.suspendUser(u.id, admin.name)
      toast.success(`${u.companyName || u.name} suspended`)
    }
    reload()
    setBusyId(null)
  }

  async function resetPassword(u) {
    setBusyId(u.id)
    const tempPassword = await adminService.resetUserPassword(u.id, admin.name)
    setBusyId(null)
    setTempPasswordDialog({ user: u, tempPassword })
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={Users} eyebrow="Platform-wide" title="User management" subtitle="Manage buyer and seller accounts, roles, and access." />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
          <TabsList>
            {ROLE_FILTERS.map((f) => <TabsTrigger key={f} value={f}>{f}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300" />
          <Input placeholder="Search users…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {!users ? (
        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or role filter." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-medium">Name / Company</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-900">{u.companyName || u.name}</p>
                      {u.companyName && <p className="text-xs text-ink-500">{u.name}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-700">{u.email}</td>
                    <td className="px-5 py-3"><Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={STATUS_BADGE[u.status]}>{u.status}</Badge></td>
                    <td className="px-5 py-3 text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => resetPassword(u)} disabled={busyId === u.id} title="Reset password">
                          <KeyRound className="size-3.5" />
                        </Button>
                        {u.role !== 'admin' && u.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStatus(u)}
                            disabled={busyId === u.id}
                            title={u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            className={u.status !== 'suspended' ? 'hover:text-signal-down' : ''}
                          >
                            <Power className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!tempPasswordDialog} onOpenChange={(open) => !open && setTempPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
            <DialogDescription>
              A temporary password was generated for {tempPasswordDialog?.user.companyName || tempPasswordDialog?.user.name}.
              In production this would be emailed directly to them.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[var(--radius-sm)] border border-paper-300 bg-paper-100 px-4 py-3 text-center font-mono-data text-lg font-semibold text-ink-900">
            {tempPasswordDialog?.tempPassword}
          </div>
          <DialogFooter>
            <Button variant="copper" onClick={() => setTempPasswordDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
