import { useState } from 'react'
import { toast } from 'sonner'
import { FileCheck2, Check, X, MessageSquarePlus, Ban } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { adminService } from '@/services/admin.service'
import { useAuth } from '@/hooks/useAuth'

const STATUS_BADGE = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'outline' }

export function ApprovalDetailDialog({ approval, open, onOpenChange, onChanged }) {
  const { user: admin } = useAuth()
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState(null) // 'reject' | 'moreDocs' | null
  const [note, setNote] = useState('')

  if (!approval) return null
  const { user, profile, documents, role } = approval

  async function approve() {
    setBusy(true)
    await adminService.approveUser(user.id, admin.name)
    setBusy(false)
    toast.success(`${user.companyName} approved`)
    onChanged()
    onOpenChange(false)
  }

  async function reject() {
    setBusy(true)
    await adminService.rejectUser(user.id, note, admin.name)
    setBusy(false)
    toast.success(`${user.companyName} rejected`)
    setMode(null)
    setNote('')
    onChanged()
    onOpenChange(false)
  }

  async function requestDocs() {
    setBusy(true)
    await adminService.requestMoreDocuments(user.id, note, admin.name)
    setBusy(false)
    toast.success('Requested additional documents')
    setMode(null)
    setNote('')
    onChanged()
    onOpenChange(false)
  }

  async function suspend() {
    setBusy(true)
    await adminService.suspendUser(user.id, admin.name)
    setBusy(false)
    toast.success(`${user.companyName} suspended`)
    onChanged()
    onOpenChange(false)
  }

  const fields = role === 'buyer'
    ? [
        ['Business registration no.', profile?.businessRegNumber],
        ['VAT / GST number', profile?.vatNumber],
        ['Contact person', profile?.contactPerson],
        ['Mobile', profile?.mobile],
        ['Registered address', profile?.companyAddress],
      ]
    : [
        ['Business registration no.', profile?.businessRegNumber],
        ['Environmental license', profile?.environmentalLicense],
        ['Waste handling license', profile?.wasteHandlingLicense],
        ['Contact person', profile?.contactPerson],
        ['Mobile', profile?.mobile],
        ['Registered address', profile?.companyAddress],
      ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{user.companyName}</DialogTitle>
            <Badge variant={STATUS_BADGE[user.status]}>{user.status}</Badge>
          </div>
          <DialogDescription>{role === 'buyer' ? 'Buyer' : 'Seller'} registration · {user.email}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-ink-500">{k}</p>
                <p className="mt-0.5 text-sm font-medium text-ink-900">{v || '—'}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Uploaded documents</p>
            <div className="space-y-2">
              {Object.entries(documents || {}).filter(([, v]) => v).map(([key, doc]) => (
                <div key={key} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-paper-300 px-3 py-2 text-sm">
                  <FileCheck2 className="size-4 shrink-0 text-verdigris-600" />
                  <span className="min-w-0 flex-1 truncate text-ink-700">{doc.name}</span>
                  <span className="text-xs text-ink-300">{doc.sizeKb} KB</span>
                </div>
              ))}
              {(!documents || Object.keys(documents).length === 0) && (
                <p className="text-xs text-ink-300">No documents on file.</p>
              )}
            </div>
          </div>

          {(mode === 'reject' || mode === 'moreDocs') && (
            <div>
              <Label htmlFor="approvalNote">{mode === 'reject' ? 'Rejection reason' : 'What\u2019s missing?'}</Label>
              <Textarea
                id="approvalNote"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === 'reject' ? 'e.g. Trade license has expired.' : 'e.g. Please upload a valid tax certificate.'}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex gap-2">
            {user.status !== 'suspended' && (
              <Button variant="outline" size="sm" onClick={suspend} disabled={busy}>
                <Ban className="size-3.5" /> Suspend
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {mode ? (
              <>
                <Button variant="outline" onClick={() => setMode(null)} disabled={busy}>Cancel</Button>
                <Button
                  variant={mode === 'reject' ? 'destructive' : 'copper'}
                  onClick={mode === 'reject' ? reject : requestDocs}
                  loading={busy}
                >
                  {mode === 'reject' ? 'Confirm rejection' : 'Send request'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setMode('moreDocs')} disabled={busy}>
                  <MessageSquarePlus className="size-3.5" /> Request docs
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setMode('reject')} disabled={busy}>
                  <X className="size-3.5" /> Reject
                </Button>
                {user.status === 'pending' && (
                  <Button variant="copper" size="sm" onClick={approve} loading={busy}>
                    <Check className="size-3.5" /> Approve
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
