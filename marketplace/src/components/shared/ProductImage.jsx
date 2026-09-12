import { useState } from 'react'
import { getMaterial } from '@/data/materials'
import { getMaterialIcon } from '@/data/materialIcons'
import { cn } from '@/lib/utils'

/**
 * Renders a seller's real uploaded photo when one exists (`imageUrl`).
 * Otherwise falls back to a branded placeholder: a diagonal gradient in the
 * material's signature swatch color with a material-specific icon overlay,
 * consistent with the swatch language used in badges and the login ticker.
 * If a real photo URL is provided but fails to load, gracefully falls back
 * to the same placeholder rather than showing a broken image.
 */
export function ProductImage({ materialId, imageUrl, className }) {
  const [failed, setFailed] = useState(false)
  const material = getMaterial(materialId)
  const color = material?.swatch || '#667075'
  const Icon = getMaterialIcon(materialId)

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={material?.label || 'Product photo'}
        className={cn(className, 'object-cover')}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${color}E6 0%, ${color}99 55%, ${color}55 100%)`,
      }}
    >
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_45%)]">
        <Icon className="size-8 text-white/70" strokeWidth={1.5} />
      </div>
    </div>
  )
}
