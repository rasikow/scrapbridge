import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

/**
 * Catches any rendering error anywhere below it in the tree and shows a
 * calm, on-brand recovery screen instead of an unstyled blank white page —
 * which is what React unmounts to by default on an uncaught render error.
 * A "Reload" action covers the most common real-world cause (a stale
 * cached build after a redeploy), and "Go home" gets the user unstuck
 * even if the error is route-specific.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper-100 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-signal-down/10">
          <AlertTriangle className="size-7 text-signal-down" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900">Something didn't load correctly</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">
            This usually clears up with a refresh. If it keeps happening, try going back to the homepage.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-copper-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-copper-600"
          >
            <RefreshCw className="size-4" /> Reload page
          </button>
          <button
            onClick={() => { window.location.href = '/' }}
            className="rounded-[var(--radius-sm)] border border-paper-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 hover:border-copper-300"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }
}
