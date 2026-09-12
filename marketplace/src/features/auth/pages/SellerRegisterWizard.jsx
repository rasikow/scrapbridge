import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Factory, FileStack, KeyRound, CheckCircle2 } from 'lucide-react'
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

const STEPS = ['Company', 'Licenses', 'Account', 'Review']

const schema = z
  .object({
    companyName: z.string().min(2, 'Company name is required'),
    businessRegNumber: z.string().min(3, 'Business registration number is required'),
    environmentalLicense: z.string().min(3, 'Environmental license number is required'),
    wasteHandlingLicense: z.string().min(3, 'Waste handling license number is required'),
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
  ['companyName', 'businessRegNumber', 'companyAddress'],
  ['environmentalLicense', 'wasteHandlingLicense'],
  ['contactPerson', 'email', 'mobile', 'password', 'confirmPassword', 'agree'],
  [],
]

export default function SellerRegisterWizard() {
  const [step, setStep] = useState(0)
  const [documents, setDocuments] = useState({
    tradeLicense: null,
    companyRegistration: null,
    environmentalCertificate: null,
    other: null,
  })
  const [docError, setDocError] = useState('')
  const { registerSeller } = useAuth()
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
      const valid = await trigger(FIELDS_BY_STEP[1])
      if (!valid) return
      if (!documents.tradeLicense || !documents.companyRegistration || !documents.environmentalCertificate) {
        setDocError('Trade License, Company Registration and Environmental Certificate are required.')
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
      const { refCode } = await registerSeller({ ...values, documents })
      toast.success('Registration submitted for review')
      navigate('/pending-approval', { state: { role: 'seller', refCode, email: values.email } })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const values = getValues()

  return (
    <AuthLayout
      theme="seller"
      eyebrow="Seller registration"
      title="Register your selling company"
      description="Licenses are verified in 1–2 business days by our compliance team."
    >
      <WizardSteps steps={STEPS} currentStep={step} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <Factory className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Company details</span>
            </div>
            <div>
              <Label htmlFor="companyName" required>Company name</Label>
              <Input id="companyName" placeholder="Gulf Recycling Industries" error={!!errors.companyName} {...register('companyName')} />
              <FieldError>{errors.companyName?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="businessRegNumber" required>Business registration no.</Label>
              <Input id="businessRegNumber" placeholder="BRN-778213" error={!!errors.businessRegNumber} {...register('businessRegNumber')} />
              <FieldError>{errors.businessRegNumber?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="companyAddress" required>Registered company address</Label>
              <Textarea id="companyAddress" rows={3} placeholder="Facility / yard address, city, country" error={!!errors.companyAddress} {...register('companyAddress')} />
              <FieldError>{errors.companyAddress?.message}</FieldError>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-ink-500">
              <FileStack className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Licenses &amp; documents</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="environmentalLicense" required>Environmental license no.</Label>
                <Input id="environmentalLicense" placeholder="ENV-44210" error={!!errors.environmentalLicense} {...register('environmentalLicense')} />
                <FieldError>{errors.environmentalLicense?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="wasteHandlingLicense" required>Waste handling license no.</Label>
                <Input id="wasteHandlingLicense" placeholder="WHL-99013" error={!!errors.wasteHandlingLicense} {...register('wasteHandlingLicense')} />
                <FieldError>{errors.wasteHandlingLicense?.message}</FieldError>
              </div>
            </div>
            <FileUploadField
              name="tradeLicense"
              label="Trade license" required hint="PDF or image, up to 10MB"
              value={documents.tradeLicense}
              onChange={(f) => setDocuments((d) => ({ ...d, tradeLicense: f }))}
            />
            <FileUploadField
              name="companyRegistration"
              label="Company registration" required hint="PDF or image, up to 10MB"
              value={documents.companyRegistration}
              onChange={(f) => setDocuments((d) => ({ ...d, companyRegistration: f }))}
            />
            <FileUploadField
              name="environmentalCertificate"
              label="Environmental certificate" required hint="PDF or image, up to 10MB"
              value={documents.environmentalCertificate}
              onChange={(f) => setDocuments((d) => ({ ...d, environmentalCertificate: f }))}
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
                ['Environmental license', values.environmentalLicense],
                ['Waste handling license', values.wasteHandlingLicense],
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
              licenses before your account is activated — you'll be notified by email.
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
