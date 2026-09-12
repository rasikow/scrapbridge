import { MATERIAL_CATEGORIES } from '@/data/materials'

const SPECS = {
  copper: { grades: ['Grade A (Bright & Shiny)', 'Grade B (Berry/Candy)', 'Mixed', '#1 Bare Bright'], puritySuffix: '% Cu', priceRange: [4, 9] },
  steel: { grades: ['HMS 1', 'HMS 1&2', 'Shredded', 'Plate & Structural'], puritySuffix: '% Fe', priceRange: [180, 340] },
  iron: { grades: ['Cast Iron', 'Wrought Iron', 'Mixed'], puritySuffix: '% Fe', priceRange: [120, 260] },
  aluminium: { grades: ['Taint/Tabor', 'Extrusion 6063', 'UBC (Cans)', 'Wheels (Clean)'], puritySuffix: '% Al', priceRange: [1.2, 2.6] },
  brass: { grades: ['Honey Brass', 'Yellow Brass', 'Red Brass'], puritySuffix: '% Cu', priceRange: [3.5, 6.5] },
  lead: { grades: ['Soft Lead', 'Battery Lead', 'Mixed'], puritySuffix: '% Pb', priceRange: [1, 2.2] },
  batteries: { grades: ['Lead-Acid', 'Li-ion', 'Mixed Industrial'], puritySuffix: '', priceRange: [0.4, 1.1] },
  ewaste: { grades: ['Mixed Boards', 'Server Grade', 'Consumer Mixed'], puritySuffix: '', priceRange: [1.5, 3.5] },
  plastic: { grades: ['PET Baled', 'HDPE Natural', 'Mixed Rigid'], puritySuffix: '% Purity', priceRange: [150, 320] },
  paper: { grades: ['OCC 11', 'Mixed Office', 'Sorted White'], puritySuffix: '', priceRange: [80, 180] },
  medical: { grades: ['Non-Hazardous Sorted', 'Sharps-Free'], puritySuffix: '', priceRange: [90, 200] },
  cdw: { grades: ['Concrete Rubble', 'Mixed C&D', 'Sorted Timber'], puritySuffix: '', priceRange: [15, 60] },
  rubber: { grades: ['Tire Chips', 'Crumb Rubber', 'Mixed'], puritySuffix: '', priceRange: [40, 120] },
  textile: { grades: ['Post-Consumer Mixed', 'Cotton Sorted'], puritySuffix: '', priceRange: [60, 160] },
  glass: { grades: ['Cullet Clear', 'Cullet Mixed Color'], puritySuffix: '', priceRange: [20, 70] },
  wood: { grades: ['Pallet Grade', 'Sawdust', 'Mixed Timber'], puritySuffix: '', priceRange: [10, 45] },
  organic: { grades: ['Food Waste', 'Green Waste', 'Compostable Mixed'], puritySuffix: '', priceRange: [5, 30] },
}

const OPENERS = [
  'Sourced from certified processors and sorted to export specification.',
  'Bulk lot recovered from industrial teardown operations, hand-sorted for consistency.',
  'Direct-from-yard material, baled and staged for immediate container loading.',
  'Consistent monthly output from our primary processing line.',
  'Reclaimed through our certified take-back program and quality-checked on intake.',
]

const QUALITY = [
  'Free of visible contamination, oil residue, and non-target attachments.',
  'Consistently graded batch-to-batch, with a third-party assay available on request.',
  'Cleaned and de-coated where applicable to maximize recoverable content.',
  'Visually inspected and metal-detected before every outbound shipment.',
  'Moisture-controlled and stored under cover ahead of dispatch.',
]

const LOGISTICS = [
  'Recurring monthly supply available — ask about long-term offtake pricing.',
  'Palletized and export-packed, ready for container or break-bulk loading.',
  'Flexible lot sizing, from spot purchase to scheduled monthly contracts.',
  'Same-week dispatch from our warehouse for standing orders.',
  'Documentation and COA provided with every shipment on request.',
]

const LOCATIONS = ['Dubai, UAE', 'Rotterdam, Netherlands', 'Singapore', 'Chennai, India', 'Houston, USA']
const CURRENCIES = ['USD', 'AED', 'EUR']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function round(n, dp = 2) {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/**
 * Generates a complete, varied draft listing for a material category —
 * realistic name/description/spec/quantity/price/location, different every
 * time it's called. This is a client-side prototype stand-in for an LLM
 * autofill: no network call, so it works offline and instantly, but the
 * copy is genuinely composed from varied fragments rather than a single
 * fixed template.
 */
export function generateProductListing(materialId) {
  const material = MATERIAL_CATEGORIES.find((m) => m.id === materialId) || pick(MATERIAL_CATEGORIES)
  const spec = SPECS[material.id] || { grades: ['Mixed'], puritySuffix: '', priceRange: [10, 100] }
  const grade = pick(spec.grades)
  const purity = spec.puritySuffix ? `${round(90 + Math.random() * 9.5, 1)}${spec.puritySuffix}` : ''
  const [lo, hi] = spec.priceRange
  const price = round(lo + Math.random() * (hi - lo), lo < 10 ? 2 : 0)
  const quantity = Math.round((500 + Math.random() * 19500) / 50) * 50
  const minOrderQty = Math.max(50, Math.round((quantity * (0.02 + Math.random() * 0.06)) / 10) * 10)

  const description = `${grade} ${material.label.toLowerCase()}. ${pick(OPENERS)} ${pick(QUALITY)} ${pick(LOGISTICS)}`

  return {
    name: `${material.label} — ${grade}`,
    materialId: material.id,
    materialType: grade,
    grade,
    purity,
    description,
    quantity,
    unit: material.unit,
    minOrderQty,
    price,
    currency: pick(CURRENCIES),
    location: pick(LOCATIONS),
    stockAvailability: true,
    _material: material,
  }
}

/**
 * Renders a distinctive placeholder photo for the generated listing —
 * layered gradient, procedural "material pile" texture, and a grade stamp,
 * unique per call. This is a generated graphic, not a stock photograph;
 * ProductImage still falls back to it gracefully if a seller later
 * replaces it with a real upload.
 */
export function generateProductArtwork(material, grade) {
  const size = 320
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const color = material.swatch || '#667075'
  const { r, g, b } = hexToRgb(color)

  // Base diagonal gradient
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, `rgba(${r},${g},${b},0.92)`)
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.62)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0.32)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Procedural "pile of material" texture — layered ellipses
  const pieces = 70 + Math.floor(Math.random() * 30)
  for (let i = 0; i < pieces; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const w = 14 + Math.random() * 48
    const h = w * (0.5 + Math.random() * 0.5)
    const rot = Math.random() * Math.PI
    const lighten = Math.random() > 0.5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = lighten
      ? `rgba(255,255,255,${0.05 + Math.random() * 0.1})`
      : `rgba(0,0,0,${0.05 + Math.random() * 0.12})`
    ctx.fill()
    ctx.restore()
  }

  // Radial highlight, top-left
  const highlight = ctx.createRadialGradient(size * 0.28, size * 0.22, 0, size * 0.28, size * 0.22, size * 0.5)
  highlight.addColorStop(0, 'rgba(255,255,255,0.28)')
  highlight.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = highlight
  ctx.fillRect(0, 0, size, size)

  // Fine grain
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1)
  }

  // Grade stamp
  const lotNumber = Math.floor(1000 + Math.random() * 8999)
  ctx.font = '600 11px "IBM Plex Mono", monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${grade.toUpperCase()} · LOT #${lotNumber}`, 14, size - 14)

  return canvas.toDataURL('image/jpeg', 0.55)
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

/** Builds the full { name...images } payload the product form can reset() with in one shot. */
export function generateFullListing(materialId) {
  const listing = generateProductListing(materialId)
  // Prefer real curated photography for materials that have it; fall back
  // to generated artwork otherwise (see public/images/materials).
  const dataUrl = listing._material.photo || generateProductArtwork(listing._material, listing.grade)
  const image = { name: `${listing.materialId}-generated.jpg`, sizeKb: listing._material.photo ? 15 : Math.round(dataUrl.length * 0.75 / 1024), uploadedAt: new Date().toISOString(), dataUrl }
  const { _material, ...formValues } = listing
  return { formValues, images: { primary: image, secondary: null, tertiary: null } }
}
