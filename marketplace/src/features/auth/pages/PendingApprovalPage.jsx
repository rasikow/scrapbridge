import { Link, useLocation, Navigate } from 'react-router-dom'
import { Clock, Mail, FileCheck, ShieldCheck, ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'

const TIMELINE = [
  { icon: FileCheck, label: 'Application received', done: true },
  { icon: ShieldCheck, label: 'Compliance team verifies documents', done: false },
  { icon: Mail, label: 'Approval email sent — you can sign in', done: false },
]

export default function PendingApprovalPage() {
  const { state } = useLocation()

  if (!state) return <Navigate to="/login" replace />

  const { role, refCode, email } = state

  return (
    <AuthLayout theme={role === 'seller' ? 'seller' : undefined} eyebrow="Application submitted" title="You're on the list">
      <div className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-copper-100">
            <Clock className="size-6 text-copper-600" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">Pending Approval</p>
            <p className="text-sm text-ink-500">
              {role === 'buyer' ? 'Buyer' : 'Seller'} application · Ref{' '}
              <span className="font-mono-data text-ink-700">{refCode}</span>
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink-700">
          We've received your company's application for{' '}
          <span className="font-medium">{email}</span>. Our compliance team typically completes
          verification within <strong>1–2 business days</strong>. You'll be notified by email the
          moment your account is approved — you cannot sign in until then.
        </p>

        <div className="mt-6 space-y-3">
          {TIMELINE.map((t, i) => (
            <div key={t.label} className="flex items-center gap-3">
              <div
                className={
                  'flex size-8 shrink-0 items-center justify-center rounded-full ' +
                  (t.done ? 'bg-verdigris-500 text-white' : 'bg-paper-200 text-ink-300')
                }
              >
                <t.icon className="size-4" />
              </div>
              <span className={t.done ? 'text-sm text-ink-900' : 'text-sm text-ink-500'}>{t.label}</span>
              {i < TIMELINE.length - 1 && <div className="ml-4 hidden h-px flex-1 bg-paper-300 sm:block" />}
            </div>
          ))}
        </div>
      </div>

      <Button asChild variant="outline" className="mt-6 w-full">
        <Link to="/login">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </Button>
    </AuthLayout>
  )
}
