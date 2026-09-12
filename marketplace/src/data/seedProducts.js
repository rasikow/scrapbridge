import { SELLERS } from '@/data/sellers'

// Curated Fixed Price catalog — kept intentionally small (10 listings) so a
// live investor/client demo reads as a clean, real order book rather than
// a random data dump. Each row is hand-written for realism instead of
// procedurally generated, and spans a deliberately wide mix of materials,
// geographies and sellers so the marketplace grid still feels varied.
const CATALOG = [
  {
    name: 'Copper Scrap — Grade A (Bright & Shiny)',
    materialId: 'copper', grade: 'Grade A (Bright & Shiny)', purity: '99.2% Cu',
    quantity: 8200, unit: 'kg', minOrderQty: 250, price: 8.65, location: 'Dubai, UAE',
    sellerId: 'slr_gulf_recycling', featured: true,
    description: 'Bare bright copper wire, degreased and moisture-free, sorted to export grade. Recurring monthly supply available for offtake contracts.',
  },
  {
    name: 'Steel Scrap — HMS 1&2',
    materialId: 'steel', grade: 'HMS 1&2', purity: '96.5% Fe',
    quantity: 42000, unit: 'ton', minOrderQty: 1000, price: 318, location: 'Rotterdam, Netherlands',
    sellerId: 'slr_northstar_metals', featured: false,
    description: 'Heavy melting steel scrap, shredded and de-oiled, ready for immediate container loading at the Port of Rotterdam.',
  },
  {
    name: 'Aluminium Scrap — Extrusion 6063',
    materialId: 'aluminium', grade: 'Extrusion 6063', purity: '98.1% Al',
    quantity: 6100, unit: 'kg', minOrderQty: 200, price: 2.14, location: 'Singapore',
    sellerId: 'slr_evergreen_waste', featured: true,
    description: 'Clean aluminium extrusion off-cuts, low iron contamination, baled and palletised for freight.',
  },
  {
    name: 'E-Waste — Server Grade Boards',
    materialId: 'ewaste', grade: 'Server Grade', purity: null,
    quantity: 3400, unit: 'kg', minOrderQty: 100, price: 4.85, location: 'Houston, USA',
    sellerId: 'slr_atlas_ewaste', featured: true,
    description: 'High-yield server and networking PCBs with gold-plated connectors, data-wiped and chain-of-custody documented.',
  },
  {
    name: 'PET Plastic — Baled Clear',
    materialId: 'plastic', grade: 'PET Baled', purity: '97% Purity',
    quantity: 18500, unit: 'ton', minOrderQty: 500, price: 271, location: 'São Paulo, Brazil',
    sellerId: 'slr_pampas_recycling', featured: false,
    description: 'Food-grade clear PET bottle bales, label-and-cap contamination under 2%, suitable for rPET flake production.',
  },
  {
    name: 'Brass — Honey Brass Turnings',
    materialId: 'brass', grade: 'Honey Brass', purity: '85% Cu',
    quantity: 2600, unit: 'kg', minOrderQty: 100, price: 5.72, location: 'Manchester, UK',
    sellerId: 'slr_ironclad_traders', featured: false,
    description: 'Free-machining honey brass turnings, oil content under 3%, screened to remove steel fines.',
  },
  {
    name: 'Cast Iron Scrap',
    materialId: 'iron', grade: 'Cast Iron', purity: '94% Fe',
    quantity: 15200, unit: 'ton', minOrderQty: 800, price: 198, location: 'Johannesburg, South Africa',
    sellerId: 'slr_savanna_scrap', featured: false,
    description: 'Machine-shop cast iron borings and broken castings, dry and free of non-ferrous attachments.',
  },
  {
    name: 'Lead-Acid Batteries — Whole Units',
    materialId: 'batteries', grade: 'Lead-Acid', purity: null,
    quantity: 5400, unit: 'unit', minOrderQty: 200, price: 21.4, location: 'Chennai, India',
    sellerId: 'slr_deccan_scrap', featured: true,
    description: 'Used automotive lead-acid batteries, casings intact, no leakage — licensed hazardous-goods transport available.',
  },
  {
    name: 'Cullet Glass — Clear Sorted',
    materialId: 'glass', grade: 'Cullet Clear', purity: null,
    quantity: 9800, unit: 'ton', minOrderQty: 400, price: 46, location: 'Hamburg, Germany',
    sellerId: 'slr_meridian_processing', featured: false,
    description: 'Colour-sorted clear glass cullet, ceramic and metal contamination under 50ppm, furnace-ready.',
  },
  {
    name: 'OCC Paper — Grade 11',
    materialId: 'paper', grade: 'OCC 11', purity: null,
    quantity: 26000, unit: 'ton', minOrderQty: 1000, price: 124, location: 'Osaka, Japan',
    sellerId: 'slr_kaizen_recyclers', featured: false,
    description: 'Baled old corrugated containers, moisture under 10%, minimal prohibitive materials — mill-direct quality.',
  },
]

// The original, static catalog — used only to seed the live product store
// (see `lib/productStore.js`) the first time the app runs. Nothing reads
// this directly for display; it has no moderation/stock fields.
export const SEED_PRODUCTS = CATALOG.map((item, i) => {
  const seller = SELLERS.find((s) => s.id === item.sellerId) || SELLERS[0]
  return {
    id: `PRD-${String(i + 1).padStart(4, '0')}`,
    ...item,
    sellerId: seller.id,
    currency: 'USD',
    status: 'active',
    viewCount: 120 + i * 47,
    inquiryCount: 3 + (i % 6),
    createdAt: new Date(Date.now() - (i + 1) * 3 * 86400000).toISOString(),
  }
})
