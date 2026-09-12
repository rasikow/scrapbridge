import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@scrapexchange.io', password: 'Admin@123' },
  { label: 'Buyer (approved)', email: 'buyer@demo.com', password: 'Buyer@123' },
  { label: 'Seller (approved)', email: 'seller@demo.com', password: 'Seller@123' },
  { label: 'Buyer (pending)', email: 'pending@demo.com', password: 'Pending@123' },
]

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    setAuthError(null)
    try {
      const user = await login(values.email, values.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`)
      const redirectTo = location.state?.from || `/${user.role}/dashboard`
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setAuthError(err.message)
    }
  }

  function fillDemo(account) {
    setValue('email', account.email)
    setValue('password', account.password)
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      description="Sign in to your verified buyer, seller or admin account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="email" required>Email address</Label>
          <Input id="email" type="email" placeholder="you@company.com" error={!!errors.email} {...register('email')} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" required>Password</Label>
            <Link to="#" className="text-xs font-medium text-copper-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              error={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <label className="flex items-center gap-2">
          <Checkbox id="remember" />
          <span className="text-sm text-ink-700">Keep me signed in</span>
        </label>

        {authError && (
          <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-signal-down/30 bg-signal-down/5 px-3 py-2.5 text-sm text-signal-down">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <Button type="submit" variant="copper" size="lg" className="w-full" loading={isSubmitting}>
          <LogIn className="size-4" />
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-[var(--radius-md)] border border-paper-300 bg-paper-200/60 p-3.5">
        <p className="mb-2 text-xs font-medium text-ink-500">Demo accounts (prototype only)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => fillDemo(a)}
              className="rounded-sm border border-paper-300 bg-white px-2 py-1.5 text-left text-xs text-ink-700 hover:border-copper-400 hover:text-copper-600"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-500">
        New to ScrapBridge?{' '}
        <Link to="/register" className="font-medium text-copper-600 hover:underline">
          Register your company
        </Link>
      </p>
    </AuthLayout>
  )
}
