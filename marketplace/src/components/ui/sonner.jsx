import { Toaster as Sonner } from 'sonner'

function Toaster(props) {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'font-body border border-paper-300 shadow-lg rounded-md',
          title: 'text-ink-900 text-sm font-medium',
          description: 'text-ink-500 text-xs',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
