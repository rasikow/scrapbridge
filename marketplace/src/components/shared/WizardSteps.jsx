import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function WizardSteps({ steps, currentStep }) {
  const progressValue = (currentStep / (steps.length - 1)) * 100

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        {steps.map((step, i) => {
          const isDone = i < currentStep
          const isCurrent = i === currentStep
          return (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full border text-xs font-medium font-mono-data transition-colors',
                    isDone && 'bg-verdigris-500 border-verdigris-500 text-white',
                    isCurrent && 'border-copper-500 text-copper-600 bg-copper-100',
                    !isDone && !isCurrent && 'border-ink-300/50 text-ink-300'
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'hidden text-[11px] font-medium sm:block',
                    isCurrent ? 'text-ink-900' : 'text-ink-300'
                  )}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-paper-300" />}
            </div>
          )
        })}
      </div>
      <Progress value={progressValue} />
    </div>
  )
}
