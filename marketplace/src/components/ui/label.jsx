import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

const Label = React.forwardRef(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium text-ink-700 mb-1.5 inline-block', className)}
    {...props}
  >
    {children}
    {required && <span className="text-copper-500 ml-0.5">*</span>}
  </LabelPrimitive.Root>
))
Label.displayName = 'Label'

export { Label }
