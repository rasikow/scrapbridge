import { useState } from 'react'
import { ProductImage } from '@/components/shared/ProductImage'
import { cn } from '@/lib/utils'

export function ProductGallery({ product }) {
  const shots = [product.images?.primary, product.images?.secondary, product.images?.tertiary].filter(Boolean)
  const [active, setActive] = useState(0)
  const activeUrl = shots[active]?.dataUrl

  return (
    <div>
      <ProductImage
        materialId={product.materialId}
        imageUrl={activeUrl}
        className="aspect-square w-full rounded-[var(--radius-lg)]"
      />
      <div className="mt-3 grid grid-cols-4 gap-3">
        {(shots.length > 0 ? shots : Array.from({ length: 4 })).map((shot, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              'overflow-hidden rounded-[var(--radius-sm)] ring-2 transition-opacity',
              i === active ? 'ring-copper-400' : 'ring-transparent opacity-70 hover:opacity-100'
            )}
          >
            <ProductImage materialId={product.materialId} imageUrl={shot?.dataUrl} className="aspect-square" />
          </button>
        ))}
      </div>
    </div>
  )
}
