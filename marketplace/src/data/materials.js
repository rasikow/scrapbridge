import { safeSetItem } from '@/lib/safeStorage'
// Material categories traded on the marketplace.
// Each material carries a "swatch" — a signature color used consistently
// across badges, avatars, charts and the ticker so a material is always
// visually identifiable at a glance, the same way a commodities board
// color-codes instruments.

export const MATERIAL_CATEGORIES = [
  { id: 'copper', label: 'Copper Scrap', swatch: '#C1793F', unit: 'kg' },
  { id: 'steel', label: 'Steel Scrap', swatch: '#6B7A82', unit: 'ton', photo: '/images/materials/steel.jpg' },
  { id: 'iron', label: 'Iron Scrap', swatch: '#8C4A2F', unit: 'ton' },
  { id: 'aluminium', label: 'Aluminium Scrap', swatch: '#A8B4B8', unit: 'kg' },
  { id: 'brass', label: 'Brass', swatch: '#B8964A', unit: 'kg' },
  { id: 'lead', label: 'Lead', swatch: '#5C6570', unit: 'kg' },
  { id: 'batteries', label: 'Batteries', swatch: '#4A5A4E', unit: 'unit' },
  { id: 'ewaste', label: 'E-Waste', swatch: '#3F7D74', unit: 'kg' },
  { id: 'plastic', label: 'Plastic Waste', swatch: '#4E8CA6', unit: 'ton', photo: '/images/materials/plastic.jpg' },
  { id: 'paper', label: 'Paper Waste', swatch: '#B0A17E', unit: 'ton', photo: '/images/materials/paper.jpg' },
  { id: 'medical', label: 'Medical Waste', swatch: '#B3452F', unit: 'ton' },
  { id: 'cdw', label: 'Construction & Demolition', swatch: '#8A8375', unit: 'ton' },
  { id: 'rubber', label: 'Rubber', swatch: '#2F2C2A', unit: 'ton' },
  { id: 'textile', label: 'Textile Waste', swatch: '#8C5E7A', unit: 'ton' },
  { id: 'glass', label: 'Glass', swatch: '#5B9683', unit: 'ton', photo: '/images/materials/glass.jpg' },
  { id: 'wood', label: 'Wood Waste', swatch: '#9C7748', unit: 'ton' },
  { id: 'organic', label: 'Organic Waste', swatch: '#5E7B45', unit: 'ton' },
]

export const MATERIAL_GRADES = ['Grade A', 'Grade B', 'Grade C', 'Mixed', 'Industrial', 'Post-Consumer']

export const UNITS = ['kg', 'ton', 'lb', 'unit', 'pallet', 'container']

export const LOCATIONS = [
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Riyadh, KSA', 'Jeddah, KSA', 'Mumbai, India',
  'Chennai, India', 'Shanghai, China', 'Rotterdam, Netherlands', 'Hamburg, Germany',
  'Houston, USA', 'Singapore',
]

// --- Admin Category Management -------------------------------------------
// MATERIAL_CATEGORIES/UNITS/LOCATIONS above are mutated *in place* (never
// reassigned) so every existing `import { MATERIAL_CATEGORIES } from
// '@/data/materials'` across the app keeps working unchanged and simply
// sees the update next time it renders — no prop drilling or refetching
// needed for admin's Category Management screen to take effect everywhere
// (marketplace filters, the seller product form, etc).

const CATEGORY_STORAGE_KEY = 'marketplace_mock_categories_v1'

function persistCategories() {
  if (typeof window === 'undefined') return
  safeSetItem(
    CATEGORY_STORAGE_KEY,
    JSON.stringify({ materialCategories: MATERIAL_CATEGORIES, units: UNITS, locations: LOCATIONS })
  )
}

function hydrateCategories() {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
  if (!raw) return
  try {
    const saved = JSON.parse(raw)
    if (saved.materialCategories) { MATERIAL_CATEGORIES.length = 0; MATERIAL_CATEGORIES.push(...saved.materialCategories) }
    if (saved.units) { UNITS.length = 0; UNITS.push(...saved.units) }
    if (saved.locations) { LOCATIONS.length = 0; LOCATIONS.push(...saved.locations) }
  } catch {
    // ignore corrupt cache, fall back to the static seed above
  }
}
hydrateCategories()

export function addMaterialCategory({ id, label, swatch, unit }) {
  if (MATERIAL_CATEGORIES.some((m) => m.id === id)) throw new Error('A category with this ID already exists.')
  MATERIAL_CATEGORIES.push({ id, label, swatch, unit })
  persistCategories()
}

export function updateMaterialCategory(id, patch) {
  const idx = MATERIAL_CATEGORIES.findIndex((m) => m.id === id)
  if (idx === -1) throw new Error('Category not found')
  MATERIAL_CATEGORIES[idx] = { ...MATERIAL_CATEGORIES[idx], ...patch }
  persistCategories()
}

export function deleteMaterialCategory(id) {
  const idx = MATERIAL_CATEGORIES.findIndex((m) => m.id === id)
  if (idx !== -1) MATERIAL_CATEGORIES.splice(idx, 1)
  persistCategories()
}

export function addUnit(unit) {
  if (!UNITS.includes(unit)) UNITS.push(unit)
  persistCategories()
}

export function deleteUnit(unit) {
  const idx = UNITS.indexOf(unit)
  if (idx !== -1) UNITS.splice(idx, 1)
  persistCategories()
}

export function addLocation(location) {
  if (!LOCATIONS.includes(location)) LOCATIONS.push(location)
  persistCategories()
}

export function deleteLocation(location) {
  const idx = LOCATIONS.indexOf(location)
  if (idx !== -1) LOCATIONS.splice(idx, 1)
  persistCategories()
}

// Seed rows for the login-screen ticker — illustrative reference pricing,
// not live market data.
export const TICKER_SEED = [
  { id: 'copper', label: 'Copper Scrap #1', price: 8.42, unit: 'kg', trend: 'up', change: '+1.8%' },
  { id: 'steel', label: 'Steel HMS 1&2', price: 312, unit: 'ton', trend: 'down', change: '-0.6%' },
  { id: 'aluminium', label: 'Aluminium Taint/Tabor', price: 1.94, unit: 'kg', trend: 'up', change: '+0.9%' },
  { id: 'brass', label: 'Brass Honey', price: 5.61, unit: 'kg', trend: 'flat', change: '0.0%' },
  { id: 'ewaste', label: 'E-Waste Mixed Board', price: 2.15, unit: 'kg', trend: 'up', change: '+3.2%' },
  { id: 'lead', label: 'Lead Scrap', price: 1.48, unit: 'kg', trend: 'down', change: '-1.1%' },
  { id: 'plastic', label: 'PET Baled', price: 268, unit: 'ton', trend: 'up', change: '+2.4%' },
  { id: 'paper', label: 'OCC 11', price: 121, unit: 'ton', trend: 'down', change: '-0.3%' },
]

export function getMaterial(id) {
  return MATERIAL_CATEGORIES.find((m) => m.id === id)
}
