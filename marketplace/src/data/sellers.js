import { safeSetItem } from '@/lib/safeStorage'
export const SELLERS = [
  {
    id: 'slr_gulf_recycling',
    tier: 'platinum',
    companyName: 'Gulf Recycling Industries',
    location: 'Dubai, UAE',
    rating: 4.8,
    reviewCount: 216,
    verified: true,
    memberSince: '2022',
    responseTime: '~2 hrs',
    completedOrders: 1240,
  },
  {
    id: 'slr_northstar_metals',
    tier: 'gold',
    companyName: 'Northstar Metals Co.',
    location: 'Rotterdam, Netherlands',
    rating: 4.6,
    reviewCount: 158,
    verified: true,
    memberSince: '2021',
    responseTime: '~4 hrs',
    completedOrders: 890,
  },
  {
    id: 'slr_evergreen_waste',
    tier: 'platinum',
    companyName: 'Evergreen Waste Solutions',
    location: 'Singapore',
    rating: 4.9,
    reviewCount: 302,
    verified: true,
    memberSince: '2020',
    responseTime: '~1 hr',
    completedOrders: 2010,
  },
  {
    id: 'slr_deccan_scrap',
    tier: 'verified',
    companyName: 'Deccan Scrap Traders',
    location: 'Chennai, India',
    rating: 4.4,
    reviewCount: 97,
    verified: true,
    memberSince: '2023',
    responseTime: '~6 hrs',
    completedOrders: 410,
  },
  {
    id: 'slr_atlas_ewaste',
    tier: 'gold',
    companyName: 'Atlas E-Waste Recovery',
    location: 'Houston, USA',
    rating: 4.7,
    reviewCount: 134,
    verified: true,
    memberSince: '2022',
    responseTime: '~3 hrs',
    completedOrders: 675,
  },
  {
    id: 'slr_baltic_metal',
    tier: 'verified',
    companyName: 'Baltic Metal Exchange',
    location: 'Gdansk, Poland',
    rating: 4.5,
    reviewCount: 88,
    verified: true,
    memberSince: '2022',
    responseTime: '~5 hrs',
    completedOrders: 320,
  },
  {
    id: 'slr_kaizen_recyclers',
    tier: 'platinum',
    companyName: 'Kaizen Recyclers K.K.',
    location: 'Osaka, Japan',
    rating: 4.9,
    reviewCount: 245,
    verified: true,
    memberSince: '2019',
    responseTime: '~2 hrs',
    completedOrders: 1780,
  },
  {
    id: 'slr_savanna_scrap',
    tier: 'verified',
    companyName: 'Savanna Scrap Metals',
    location: 'Johannesburg, South Africa',
    rating: 4.3,
    reviewCount: 61,
    verified: true,
    memberSince: '2023',
    responseTime: '~8 hrs',
    completedOrders: 195,
  },
  {
    id: 'slr_pampas_recycling',
    tier: 'gold',
    companyName: 'Pampas Recycling Group',
    location: 'São Paulo, Brazil',
    rating: 4.6,
    reviewCount: 112,
    verified: true,
    memberSince: '2021',
    responseTime: '~4 hrs',
    completedOrders: 540,
  },
  {
    id: 'slr_ironclad_traders',
    tier: 'gold',
    companyName: 'Ironclad Traders LLC',
    location: 'Manchester, UK',
    rating: 4.7,
    reviewCount: 176,
    verified: true,
    memberSince: '2020',
    responseTime: '~3 hrs',
    completedOrders: 960,
  },
  {
    id: 'slr_meridian_processing',
    tier: 'platinum',
    companyName: 'Meridian Metal Processing',
    location: 'Toronto, Canada',
    rating: 4.8,
    reviewCount: 203,
    verified: true,
    memberSince: '2021',
    responseTime: '~2 hrs',
    completedOrders: 1120,
  },
]

export function getSeller(id) {
  return SELLERS.find((s) => s.id === id)
}

// --- Admin: provisioning newly-approved sellers ---------------------------
// SELLERS is mutated in place (see data/materials.js for the same pattern)
// so the moment admin approves a seller registration, that company is
// immediately findable by every existing `getSeller(id)` call across the
// buyer marketplace, product cards, and order pages — no refactor needed.

const SELLERS_STORAGE_KEY = 'marketplace_mock_registered_sellers_v1'

function persistRegisteredSellers() {
  if (typeof window === 'undefined') return
  const registered = SELLERS.filter((s) => s.registered)
  safeSetItem(SELLERS_STORAGE_KEY, JSON.stringify(registered))
}

function hydrateRegisteredSellers() {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(SELLERS_STORAGE_KEY)
  if (!raw) return
  try {
    const saved = JSON.parse(raw)
    saved.forEach((s) => {
      if (!SELLERS.some((existing) => existing.id === s.id)) SELLERS.push(s)
    })
  } catch {
    // ignore corrupt cache
  }
}
hydrateRegisteredSellers()

export function registerApprovedSeller({ id, companyName, location }) {
  if (SELLERS.some((s) => s.id === id)) return
  SELLERS.push({
    id,
    companyName,
    location: location || 'Location on file',
    rating: 0,
    reviewCount: 0,
    verified: true,
    tier: 'verified',
    memberSince: String(new Date().getFullYear()),
    responseTime: 'New seller',
    completedOrders: 0,
    registered: true,
  })
  persistRegisteredSellers()
}
