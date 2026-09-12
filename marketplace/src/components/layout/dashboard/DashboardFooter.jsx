import { Link } from 'react-router-dom'
import { Recycle } from 'lucide-react'

/**
 * Compact footer shown at the bottom of every logged-in dashboard screen
 * (buyer/seller/admin), so the app never feels like it just stops mid-page
 * — mirrors the public site's footer in miniature.
 */
export function DashboardFooter() {
  return (
    <footer className="border-t border-paper-300 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2 px-4 py-5 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div className="flex items-center gap-2 text-ink-500">
          <div className="flex size-6 items-center justify-center rounded-md bg-copper-500">
            <Recycle className="size-3.5 text-white" />
          </div>
          <span className="text-xs">© {new Date().getFullYear()} ScrapBridge · Verified scrap marketplace</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-500">
          <Link to="/" className="hover:text-ink-900">Home</Link>
          <a href="#" className="hover:text-ink-900">Support</a>
          <a href="#" className="hover:text-ink-900">Privacy</a>
        </div>
      </div>
    </footer>
  )
}
