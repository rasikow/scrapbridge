import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, FileCheck2, KeyRound, Bell, ShieldCheck, Landmark } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profile.service'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-copper-500' : 'bg-paper-300'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  )
}

export default function SellerProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [prefs, setPrefs] = useState(null)

  useEffect(() => {
    profileService.getSellerProfile(user.id).then(setProfile)
    profileService.getNotificationPrefs(user.id).then(setPrefs)
  }, [user.id])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(passwordSchema) })

  async function onChangePassword(values) {
    try {
      await profileService.updatePassword(user.id, values.currentPassword, values.newPassword)
      toast.success('Password updated')
      reset()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function togglePref(key) {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    await profileService.updateNotificationPrefs(user.id, next)
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={Building2}
        eyebrow="Account"
        title="Company profile"
        subtitle="Keep your company details, documents, and security settings current."
      />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company"><Building2 className="mr-1.5 size-3.5" /> Company</TabsTrigger>
          <TabsTrigger value="certificates"><FileCheck2 className="mr-1.5 size-3.5" /> Certificates</TabsTrigger>
          <TabsTrigger value="bank"><Landmark className="mr-1.5 size-3.5" /> Bank details</TabsTrigger>
          <TabsTrigger value="security"><KeyRound className="mr-1.5 size-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1.5 size-3.5" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          {!profile ? (
            <Skeleton className="h-64 w-full max-w-2xl" />
          ) : (
            <Card className="max-w-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{profile.companyName}</CardTitle>
                  <Badge variant="success"><ShieldCheck className="size-3" /> Verified &amp; approved</Badge>
                </div>
                <CardDescription>Registered seller account</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ['Business registration no.', profile.businessRegNumber],
                  ['Contact person', profile.contactPerson],
                  ['Email', profile.email],
                  ['Mobile', profile.mobile],
                  ['Registered address', profile.companyAddress],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-ink-500">{k}</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-900">{v}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates">
          {!profile ? (
            <Skeleton className="h-64 w-full max-w-2xl" />
          ) : (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Licenses &amp; certificates</CardTitle>
                <CardDescription>Environmental and waste-handling compliance, verified by our team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-ink-500">Environmental license no.</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-900">{profile.environmentalLicense}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500">Waste handling license no.</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-900">{profile.wasteHandlingLicense}</p>
                  </div>
                </div>
                <div className="space-y-2.5 border-t border-paper-200 pt-4">
                  {profile.documents.map((doc) => (
                    <div key={doc.key} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-verdigris-400/40 bg-verdigris-100/40 px-4 py-3">
                      <FileCheck2 className="size-4 shrink-0 text-verdigris-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{doc.name}</p>
                        <p className="text-xs text-ink-500">{doc.sizeKb} KB · verified</p>
                      </div>
                      <Badge variant="success">Approved</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bank">
          {!profile ? (
            <Skeleton className="h-56 w-full max-w-2xl" />
          ) : (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Payout account</CardTitle>
                <CardDescription>Where settlements for delivered orders are paid out.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ['Bank name', profile.bank.bankName],
                  ['Account name', profile.bank.accountName],
                  ['Account number', profile.bank.accountNumber],
                  ['IBAN', profile.bank.iban],
                  ['SWIFT / BIC', profile.bank.swift],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-ink-500">{k}</p>
                    <p className="mt-0.5 font-mono-data text-sm font-medium text-ink-900">{v}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onChangePassword)} noValidate className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" required>Current password</Label>
                  <Input id="currentPassword" type="password" error={!!errors.currentPassword} {...register('currentPassword')} />
                  <FieldError>{errors.currentPassword?.message}</FieldError>
                </div>
                <div>
                  <Label htmlFor="newPassword" required>New password</Label>
                  <Input id="newPassword" type="password" error={!!errors.newPassword} {...register('newPassword')} />
                  <FieldError>{errors.newPassword?.message}</FieldError>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" required>Confirm new password</Label>
                  <Input id="confirmPassword" type="password" error={!!errors.confirmPassword} {...register('confirmPassword')} />
                  <FieldError>{errors.confirmPassword?.message}</FieldError>
                </div>
                <Button type="submit" variant="copper" loading={isSubmitting}>Update password</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>Choose what ScrapBridge notifies you about.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-paper-200">
              {!prefs ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <NotificationToggle
                    label="Order updates"
                    description="New orders, buyer messages and status changes"
                    checked={prefs.emailOrderUpdates}
                    onChange={() => togglePref('emailOrderUpdates')}
                  />
                  <NotificationToggle
                    label="Approval notifications"
                    description="Product and account approval decisions"
                    checked={prefs.emailApprovals}
                    onChange={() => togglePref('emailApprovals')}
                  />
                  <NotificationToggle
                    label="Price alerts"
                    description="Reference price moves on materials you sell"
                    checked={prefs.emailPriceAlerts}
                    onChange={() => togglePref('emailPriceAlerts')}
                  />
                  <NotificationToggle
                    label="In-app notifications"
                    description="Show the notification bell badge in the top bar"
                    checked={prefs.inAppNotifications}
                    onChange={() => togglePref('inAppNotifications')}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
