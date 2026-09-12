import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted font weights (imported as plain JS/CSS side-effect imports so
// Vite resolves and copies the woff assets into the build — importing them
// from inside index.css under Tailwind's @import pipeline silently dropped
// the font files from the production bundle).
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import './index.css'
import App from './App.jsx'

// --- Stale-chunk auto-recovery ------------------------------------------
// Every route is code-split (see routes/AppRouter.jsx) so each page loads
// its JS on demand via a dynamic import(). If this app gets re-deployed
// (a new build overwrites the old one on the server) while someone still
// has an old tab open — or their browser served a cached old index.html —
// the chunk filenames the browser is asking for no longer exist on the
// server. The already-loaded pages keep working fine, but clicking into
// any page whose chunk hasn't been fetched yet fails silently, which looks
// exactly like "this link doesn't work" while other links are fine. The
// fix is to detect that specific failure and do a single hard reload to
// pick up the new build, instead of leaving the user on a broken page.
const RELOAD_GUARD_KEY = 'scrapbridge_chunk_reload_guard'
function isStaleChunkError(message = '') {
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module/i.test(message)
}
function recoverFromStaleChunk(message) {
  if (!isStaleChunkError(message)) return
  const alreadyTried = sessionStorage.getItem(RELOAD_GUARD_KEY)
  if (alreadyTried) return // avoid an infinite reload loop if the problem isn't actually a stale build
  sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
  window.location.reload()
}
window.addEventListener('error', (e) => recoverFromStaleChunk(e?.message))
window.addEventListener('unhandledrejection', (e) => recoverFromStaleChunk(e?.reason?.message))
// Clear the guard once something loads successfully, so a *future* real
// deploy can still trigger a fresh auto-reload rather than being silently
// skipped because of a reload that happened hours/days earlier.
window.addEventListener('load', () => sessionStorage.removeItem(RELOAD_GUARD_KEY))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
