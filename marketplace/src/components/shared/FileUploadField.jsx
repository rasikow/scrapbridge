import { useRef, useState } from 'react'
import { UploadCloud, FileCheck2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_IMAGE_DIMENSION = 640

/**
 * Downscales an image file to a max dimension and re-encodes it as a JPEG
 * data URL, so a real seller-uploaded photo can be persisted to
 * localStorage (which the rest of this mock backend already relies on)
 * without bloating storage with full-resolution camera photos.
 */
function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Document/image upload field. Image files (per `accept`) are downscaled
 * and kept as a real, renderable data URL (`dataUrl`) so product photos a
 * seller uploads actually display everywhere in the app — cards, cart,
 * orders. Non-image documents (PDFs, licenses) keep the previous
 * metadata-only behavior, which is all the admin document-review screen
 * needs.
 */
export function FileUploadField({ name, label, required, value, onChange, hint, error, accept = '.pdf,.jpg,.jpeg,.png' }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const isImageField = accept.includes('.jpg') || accept.includes('.png')

  async function handleFiles(files) {
    const file = files?.[0]
    if (!file) return
    const base = { name: file.name, sizeKb: Math.round(file.size / 1024), uploadedAt: new Date().toISOString() }
    if (isImageField && file.type.startsWith('image/')) {
      try {
        const dataUrl = await readImageAsDataUrl(file)
        onChange({ ...base, dataUrl })
        return
      } catch {
        // fall through to metadata-only if decoding fails (e.g. unsupported format)
      }
    }
    onChange(base)
  }

  return (
    <div data-testid={name ? `upload-${name}` : undefined}>
      <label className="text-sm font-medium text-ink-700 mb-1.5 inline-block">
        {label}
        {required && <span className="text-copper-500 ml-0.5">*</span>}
      </label>
      {!value ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border-2 border-dashed px-4 py-3.5 transition-colors',
            dragOver ? 'border-copper-400 bg-copper-100/40' : 'border-ink-300/40 hover:border-ink-300',
            error && 'border-signal-down'
          )}
        >
          <UploadCloud className="size-5 text-ink-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-ink-700">
              <span className="font-medium text-copper-600">Click to upload</span> or drag and drop
            </p>
            {hint && <p className="text-xs text-ink-500 truncate">{hint}</p>}
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : value.dataUrl ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-verdigris-400/40 bg-verdigris-100/50 p-2">
          <img src={value.dataUrl} alt={value.name} className="size-12 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{value.name}</p>
            <p className="text-xs text-ink-500">{value.sizeKb} KB · uploaded</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-1 text-ink-500 hover:bg-white hover:text-signal-down"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-verdigris-400/40 bg-verdigris-100/50 px-4 py-3">
          <FileCheck2 className="size-5 text-verdigris-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{value.name}</p>
            <p className="text-xs text-ink-500">{value.sizeKb} KB · uploaded</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full p-1 text-ink-500 hover:bg-white hover:text-signal-down"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-signal-down">{error}</p>}
    </div>
  )
}
