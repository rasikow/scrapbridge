import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Building2, FileStack, KeyRound, CheckCircle2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { WizardSteps } from '@/components/shared/WizardSteps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/ui/field-error'
import { FileUploadField } from '@/components/shared/FileUploadField'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'

const STEPS = ['Company', 'Documents', 'Account', 'Review']

const schema = z
  .object({
    companyName: z.string().min(2, 'Company name is required'),
    businessRegNumber: z.string().min(3, 'Business registration number is required'),
    vatNumber: z.string().min(3, 'VAT/GST number is required'),
    companyAddress: z.string().min(10, 'Enter the full registered address'),
    contactPerson: z.string().min(2, 'Contact person name is required'),
    email: z.string().email('Enter a valid email address'),
    mobile: z.string().min(7, 'Enter a valid mobile number'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const FIELDS_BY_STEP = [
  ['companyName', 'businessRegNumber', 'vatNumber', 'companyAddress'],
  [],
  ['contactPerson', 'email', 'mobile', 'password', 'confirmPassword', 'agree'],
  [],
]

export default function BuyerRegisterWizard() {
  const [step, setStep] = useState(0)
  const [documents, setDocuments] = useState({
    tradeLicense: null,
    vatCertificate: null,
    companyRegistration: null,
    nationalId: null,
    other: null,
  })
  const [docError, setDocError] = useState('')
  const { registerBuyer } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  async function next() {
    if (step === 1) {
      if (!documents.tradeLicense || !documents.vatCertificate || !documents.companyRegistration) {
        setDocError('Trade License, VAT Certificate and Company Registration are required.')
        return
      }
      setDocError('')
    } else {
      const valid = await trigger(FIELDS_BY_STEP[step])
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(values) {
    try {
      const { refCode } = await registerBuyer({ ...values, documents })
      toast.success('Registration submitted for review')
      navigate('/pending-approval', { state: { role: 'buyer', refCode, email: values.email } })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const values = getValues()

  return (
    <AuthLayout
      eyebrow="Buyer registration"
      title="Register your buying company"
      description="Verified in 1–2 business days by our compliance team."
    >
      <WizardSteps steps={STEPS} currentStep={step} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <Building2 className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Company details</span>
            </div>
            <div>
              <Label htmlFor="companyName" required>Company name</Label>
              <Input id="companyName" placeholder="Meridian Metals Trading LLC" error={!!errors.companyName} {...register('companyName')} />
              <FieldError>{errors.companyName?.message}</FieldError>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessRegNumber" required>Business registration no.</Label>
                <Input id="businessRegNumber" placeholder="BRN-102938" error={!!errors.businessRegNumber} {...register('businessRegNumber')} />
                <FieldError>{errors.businessRegNumber?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="vatNumber" required>VAT / GST number</Label>
                <Input id="vatNumber" placeholder="VAT-556213" error={!!errors.vatNumber} {...register('vatNumber')} />
                <FieldError>{errors.vatNumber?.message}</FieldError>
              </div>
            </div>
            <div>
              <Label htmlFor="companyAddress" required>Registered company address</Label>
              <Textarea id="companyAddress" rows={3} placeholder="Building, street, city, country" error={!!errors.companyAddress} {...register('companyAddress')} />
              <FieldError>{errors.companyAddress?.message}</FieldError>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <FileStack className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Compliance documents</span>
            </div>
            <FileUploadField
              name="tradeLicense"
              label="Trade license" required hint="PDF or image, up to 10MB"
              value={documents.tradeLicense}
              onChange={(f) => setDocuments((d) => ({ ...d, tradeLicense: f }))}
            />
            <FileUploadField
              name="vatCertificate"
              label="VAT certificate" required hint="PDF or image, up to 10MB"
              value={documents.vatCertificate}
              onChange={(f) => setDocuments((d) => ({ ...d, vatCertificate: f }))}
            />
            <FileUploadField
              name="companyRegistration"
              label="Company registration" required hint="PDF or image, up to 10MB"
              value={documents.companyRegistration}
              onChange={(f) => setDocuments((d) => ({ ...d, companyRegistration: f }))}
            />
            <FileUploadField
              name="nationalId"
              label="National ID (contact person)" hint="Optional — speeds up review"
              value={documents.nationalId}
              onChange={(f) => setDocuments((d) => ({ ...d, nationalId: f }))}
            />
            <FileUploadField
              name="other"
              label="Other supporting documents" hint="Optional"
              value={documents.other}
              onChange={(f) => setDocuments((d) => ({ ...d, other: f }))}
            />
            {docError && <p className="text-xs text-signal-down">{docError}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <KeyRound className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Contact &amp; account</span>
            </div>
            <div>
              <Label htmlFor="contactPerson" required>Contact person</Label>
              <Input id="contactPerson" placeholder="Full name" error={!!errors.contactPerson} {...register('contactPerson')} />
              <FieldError>{errors.contactPerson?.message}</FieldError>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" required>Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" error={!!errors.email} {...register('email')} />
                <FieldError>{errors.email?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="mobile" required>Mobile</Label>
                <Input id="mobile" placeholder="+971 5X XXX XXXX" error={!!errors.mobile} {...register('mobile')} />
                <FieldError>{errors.mobile?.message}</FieldError>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" required>Password</Label>
                <Input id="password" type="password" placeholder="••••••••" error={!!errors.password} {...register('password')} />
                <FieldError>{errors.password?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="confirmPassword" required>Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" error={!!errors.confirmPassword} {...register('confirmPassword')} />
                <FieldError>{errors.confirmPassword?.message}</FieldError>
              </div>
            </div>
            <label className="flex items-start gap-2">
              <Controller
                name="agree"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agree"
                    className="mt-0.5"
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <span className="text-sm text-ink-700">
                I confirm the information provided is accurate and agree to the ScrapBridge
                Marketplace Terms and Verification Policy.
              </span>
            </label>
            <FieldError>{errors.agree?.message}</FieldError>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Review &amp; submit</span>
            </div>
            <div className="rounded-[var(--radius-md)] border border-paper-300 divide-y divide-paper-300">
              {[
                ['Company name', values.companyName],
                ['Business reg. no.', values.businessRegNumber],
                ['VAT / GST no.', values.vatNumber],
                ['Contact person', values.contactPerson],
                ['Email', values.email],
                ['Mobile', values.mobile],
                ['Documents uploaded', Object.values(documents).filter(Boolean).length + ' files'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-ink-500">{k}</span>
                  <span className="font-medium text-ink-900">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="rounded-[var(--radius-sm)] border border-copper-400/30 bg-copper-100/40 px-3.5 py-3 text-sm text-ink-700">
              Your application goes to <strong>Pending Approval</strong>. An admin will verify your
              documents before your account is activated — you'll be notified by email.
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={back}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <Link to="/register" className="text-sm text-ink-500 hover:text-ink-700">
              Cancel
            </Link>
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" variant="copper" onClick={next}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" variant="copper" loading={isSubmitting}>
              Submit for approval
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  )
}
