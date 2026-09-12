import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Recycle, ArrowRight, Menu, X, ShieldCheck, Gavel, Store, TrendingUp,
  Factory, Building2, FileCheck2, HandCoins, Truck, Star, Globe2, Layers,
  Network, EyeOff, Users, Clock3, Ban, Zap as ZapIcon, Boxes, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { MaterialTicker } from '@/components/shared/MaterialTicker'
import { CountUpNumber } from '@/components/shared/CountUpNumber'
import { TradeFlowAnimation } from '@/features/home/components/TradeFlowAnimation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MATERIAL_CATEGORIES, LOCATIONS } from '@/data/materials'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '#how-it-works', label: 'How it works' },
  { to: '#trade-formats', label: 'Trade formats' },
  { to: '#materials', label: 'Materials' },
  { to: '#auctions', label: 'Auctions' },
  { to: '#buyers-sellers', label: 'For buyers & sellers' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] },
  }),
}

const STATS = [
  { icon: Layers, value: MATERIAL_CATEGORIES.length, label: 'Material categories' },
  { icon: Globe2, value: LOCATIONS.length, label: 'Trading hub cities' },
  { icon: Building2, value: 2400, suffix: '+', label: 'Verified companies' },
  { icon: TrendingUp, value: 18600, suffix: '+', label: 'Trades completed' },
]

const PROBLEMS = [
  { icon: Network, title: 'Fragmented market', copy: 'Thousands of unorganised dealers, no single place to reach buyers.' },
  { icon: EyeOff, title: 'Opaque pricing', copy: 'No visibility of market rates; sellers accept the first offer they get.' },
  { icon: Users, title: 'Middlemen dependency', copy: 'Brokers capture margin and control who gets to bid.' },
  { icon: Clock3, title: 'Slow, manual process', copy: 'Weeks of calls, site visits and paperwork before pickup happens.' },
]

const MARKET_STATS = [
  { value: '$500B+', label: 'Global scrap & recycling trade' },
  { value: '~7%', label: 'Expected annual growth in recycled materials demand' },
  { value: '<20%', label: "Of India's scrap trade currently digitised" },
]

const WHY_WE_WIN = [
  { icon: ShieldCheck, title: 'Verified vendor network', copy: 'Every buyer KYC-checked, licensed and rated before bidding.' },
  { icon: Globe2, title: 'Transparent availability', copy: 'Live view of lots, quantities and locations across regions.' },
  { icon: Gavel, title: 'Auction price discovery', copy: 'Competitive bidding replaces one-broker pricing.' },
  { icon: Boxes, title: 'Multi-category coverage', copy: 'Metal to e-waste to demolition in a single account.' },
  { icon: Ban, title: 'Reduced broker dependency', copy: 'Direct seller-to-buyer relationships with platform assurance.' },
  { icon: ZapIcon, title: 'Scalable B2B model', copy: 'City-by-city playbook on shared technology and operations.' },
]

const BUYER_STEPS = [
  { icon: FileCheck2, title: 'Get verified', copy: 'Register your company and get license-checked before you place a single order.' },
  { icon: Store, title: 'Source materials', copy: 'Browse listings or bid live in auctions across 17 material categories.' },
  { icon: Truck, title: 'Receive & pay', copy: 'Track orders end to end and pay securely once material is confirmed.' },
]

const SELLER_STEPS = [
  { icon: FileCheck2, title: 'Get verified', copy: 'Submit your business license once — admins approve sellers before listing.' },
  { icon: Recycle, title: 'List or auction', copy: 'Publish fixed-price listings or run a live auction for better price discovery.' },
  { icon: HandCoins, title: 'Get paid', copy: 'Ship to a verified buyer and get paid through a tracked, disputed-free order flow.' },
]

const TESTIMONIALS = [
  { quote: 'We moved our copper offtake fully onto ScrapBridge — verified buyers, no chasing payments.', name: 'Amara Okoye', role: 'Ops Lead, Gulf Recycling Industries' },
  { quote: 'The auction module gets us better price discovery than our old broker network ever did.', name: 'Lars Bengtsson', role: 'Procurement, Northstar Metals Co.' },
  { quote: 'Onboarding took a day. Every counterparty is license-checked before we ever ship.', name: 'Priya Raman', role: 'Founder, Evergreen Waste Solutions' },
]

function PublicNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        // Always keep a dark scrim behind the nav, even before the user
        // scrolls — the unscrolled state used to be fully transparent and
        // relied entirely on the Hero's background image being visible
        // behind it. If that image is slow to load (or blocked) on a
        // production host, white nav text on a plain white page became
        // invisible. A permanent gradient guarantees contrast regardless
        // of whether the hero image has loaded yet.
        scrolled
          ? 'border-b border-white/10 bg-graphite-950/90 backdrop-blur'
          : 'border-b border-transparent bg-gradient-to-b from-black/55 via-black/25 to-transparent'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-md bg-white/15 backdrop-blur">
            <Recycle className="size-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">ScrapBridge</span>
        </div>

        <nav className="ml-8 hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2.5 lg:flex">
          <Link to="/login" className="text-sm font-medium text-white/80 hover:text-white">Sign in</Link>
          <Button asChild className="bg-white text-graphite-950 hover:bg-white/90">
            <Link to="/register">
              Get started <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-sm p-1.5 text-white/80 hover:bg-white/10 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-graphite-950/95 px-4 py-3 backdrop-blur lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            <Button asChild variant="ghost" className="w-full justify-center text-white/80 hover:bg-white/10 hover:text-white">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="w-full justify-center bg-white text-graphite-950 hover:bg-white/90">
              <Link to="/register">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}

function DottedWorldTexture() {
  // Stylised scatter-dot texture evoking a global trade network — not a
  // literal map, just movement and reach, matching the reference hero.
  const dots = []
  let seed = 7
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < 140; i++) {
    dots.push({ cx: rnd() * 100, cy: rnd() * 100, r: rnd() > 0.85 ? 1.6 : 0.9, o: 0.15 + rnd() * 0.35 })
  }
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
      {dots.map((d, i) => (
        <circle key={i} cx={`${d.cx}%`} cy={`${d.cy}%`} r={d.r} fill="white" opacity={d.o} />
      ))}
    </svg>
  )
}

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1722695694560-f452b0919d3a?auto=format&fit=crop&w=1800&q=70',
    eyebrow: 'The world\'s first triple-format scrap exchange',
    title: 'One Platform. Three Ways To Trade Scrap.',
    copy: 'Fixed price, live auction, or negotiated bid — sellers choose how they sell, buyers choose how they buy, and every counterparty is verified before the first trade.',
    ctaLabel: 'Start Trading Today',
    ctaTo: '/register',
  },
  {
    image: 'https://images.unsplash.com/photo-1759272840712-c7e5ea852367?auto=format&fit=crop&w=1800&q=70',
    eyebrow: 'Trading hubs · 11 cities and growing',
    title: 'Ship Anywhere, Trade Everywhere',
    copy: 'From Dubai to Rotterdam to Singapore — source and sell across borders with logistics built into every order.',
    ctaLabel: 'Explore Materials',
    ctaTo: '/register/buyer',
  },
  {
    image: 'https://images.unsplash.com/photo-1723365316514-8509dea457f2?auto=format&fit=crop&w=1800&q=70',
    eyebrow: '17 material categories · fully graded',
    title: 'Every Grade, Verified & Priced',
    copy: 'Copper to CDW — list with grade, purity and photos, and get discovered by buyers actively sourcing your material.',
    ctaLabel: 'List Your Materials',
    ctaTo: '/register/seller',
  },
  {
    image: 'https://images.unsplash.com/photo-1536094627107-abf98dedaa8f?auto=format&fit=crop&w=1800&q=70',
    eyebrow: 'License-verified · every account',
    title: 'Real Companies. Real Deals.',
    copy: 'No anonymous listings, no broker gatekeeping — every buyer and seller is verified before their first trade.',
    ctaLabel: 'See How It Works',
    ctaTo: '#how-it-works',
  },
]

const TRADE_FORMATS = [
  {
    icon: Store,
    label: 'Fixed Price',
    tagline: 'Instant, predictable deals',
    forSeller: 'Set a price once — buyers purchase directly, no negotiation needed.',
    forBuyer: 'Browse graded lots and buy immediately at a price you can see upfront.',
    accent: 'copper',
  },
  {
    icon: Gavel,
    label: 'Live Auction',
    tagline: 'Best price through competition',
    forSeller: 'List a lot, set a reserve, and let verified buyers bid it up in real time.',
    forBuyer: 'Join the countdown, place bids, and win at true market value — no broker markup.',
    accent: 'verdigris',
  },
  {
    icon: HandCoins,
    label: 'Accept Bids',
    tagline: 'Negotiate on your terms',
    forSeller: 'Open a lot to offers and accept, counter, or decline — no fixed countdown.',
    forBuyer: 'Propose your price and quantity directly to the seller, no pressure clock.',
    accent: 'steel',
  },
]

function ThreeWaysToTrade() {
  return (
    <section id="trade-formats" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">What makes us different</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">Three trading formats. One trust layer.</h2>
          <p className="mt-3 text-sm text-ink-500">
            No other scrap marketplace lets a seller list the same way a stock exchange, a classifieds site,
            and a negotiation desk each work — all inside one verified network.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {TRADE_FORMATS.map((f, i) => (
            <motion.div
              key={f.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className={cn(
                'group relative overflow-hidden rounded-[var(--radius-lg)] border p-7 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl',
                f.accent === 'copper' && 'border-copper-300/40 bg-copper-100/30 hover:border-copper-400/60',
                f.accent === 'verdigris' && 'border-verdigris-300/40 bg-verdigris-100/40 hover:border-verdigris-400/60',
                f.accent === 'steel' && 'border-steel-400/40 bg-steel-100/40 hover:border-steel-400/70'
              )}
            >
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-[var(--radius-md)] text-white shadow-sm transition-transform duration-200 group-hover:scale-110',
                  f.accent === 'copper' && 'bg-gradient-to-br from-copper-400 to-copper-600 shadow-copper-500/20',
                  f.accent === 'verdigris' && 'bg-gradient-to-br from-verdigris-400 to-verdigris-600 shadow-verdigris-500/20',
                  f.accent === 'steel' && 'bg-gradient-to-br from-steel-400 to-steel-600 shadow-steel-500/20'
                )}
              >
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">{f.label}</h3>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{f.tagline}</p>
              <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-700">
                <p><span className="font-semibold text-ink-900">Seller:</span> {f.forSeller}</p>
                <p><span className="font-semibold text-ink-900">Buyer:</span> {f.forBuyer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Hero() {
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [paused])

  const current = HERO_SLIDES[slide]

  return (
    <section
      className="relative flex min-h-[88vh] items-center overflow-hidden bg-graphite-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={slide}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 0.45, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${current.image}')` }}
          aria-hidden
        />
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-brand-gradient opacity-75 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.14),transparent_55%)]" />
      <DottedWorldTexture />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-graphite-950/60 via-graphite-950/50 to-graphite-950/95" />

      <div className="relative mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-white" />
              </span>
              <span className="font-mono-data text-[11px] uppercase tracking-wider text-white/90">{current.eyebrow}</span>
            </div>

            <h1
              className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.25)' }}
            >
              {current.title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              {current.copy}
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-graphite-950 shadow-xl shadow-black/20 hover:bg-white/90">
                <Link to={current.ctaTo}>
                  {current.ctaLabel} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/15">
                <Link to="/login">Explore Marketplace</Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {HERO_SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className="group relative h-1.5 overflow-hidden rounded-full bg-white/20 transition-all duration-300"
              style={{ width: i === slide ? 28 : 8 }}
            >
              {i === slide && !paused && (
                <motion.span
                  key={`${slide}-progress`}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 6, ease: 'linear' }}
                  className="absolute inset-y-0 left-0 bg-white"
                />
              )}
              {i === slide && paused && <span className="absolute inset-0 bg-white" />}
            </button>
          ))}
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={4}
          className="mx-auto mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-md)] border border-white/15 bg-white/15 sm:grid-cols-4"
        >
          {STATS.map(({ icon: Icon, value, suffix, label }) => (
            <div key={label} className="bg-graphite-950/40 px-3 py-4 backdrop-blur">
              <Icon className="mx-auto size-3.5 text-white/70" strokeWidth={2} />
              <p className="mt-2 font-mono-data text-xl font-semibold tabular-nums text-white">
                <CountUpNumber value={value} />
                {suffix || ''}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-white/60">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Arrow nav */}
      <button
        onClick={() => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => setSlide((s) => (s + 1) % HERO_SLIDES.length)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
      >
        <ChevronRight className="size-5" />
      </button>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper-100 to-transparent" />
    </section>
  )
}

function SeeItInAction() {
  return (
    <section className="bg-graphite-900 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-400">See it in action</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-white">Sellers and buyers, connected live</h2>
          <p className="mt-3 text-sm text-white/50">Every listing routes through verification straight into a trading floor buyers can actually browse and bid on.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-10 max-w-3xl rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.02] p-2"
        >
          <TradeFlowAnimation className="relative" />
        </motion.div>
      </div>
    </section>
  )
}

const PEOPLE_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1598299803204-b73796f43289?auto=format&fit=crop&w=900&q=75', caption: 'Yard operations', desc: 'Sorting and grading lots before they ever go live.' },
  { url: 'https://images.unsplash.com/photo-1664382953403-fc1ac77073a0?auto=format&fit=crop&w=900&q=75', caption: 'Warehouse & logistics', desc: 'Coordinating pickup and dispatch on every won lot.' },
  { url: 'https://images.unsplash.com/photo-1536094627107-abf98dedaa8f?auto=format&fit=crop&w=900&q=75', caption: 'Verification desk', desc: 'Checking licenses before a single company can trade.' },
]

function PeopleSection() {
  return (
    <section className="bg-paper-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">Real people, real trades</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Behind every listing is a real team</h2>
          <p className="mt-3 text-sm text-ink-500">ScrapBridge isn't just software — verification, yard operations, and logistics people keep every trade honest.</p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PEOPLE_PHOTOS.map((p, i) => (
            <motion.div
              key={p.caption}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <img src={p.url} alt={p.caption} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/85 via-graphite-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-lg font-semibold text-white">{p.caption}</p>
                <p className="mt-0.5 text-xs text-white/75">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">The problem</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">Scrap disposal is broken at the source</h2>
          <p className="mt-3 text-sm text-ink-500">A high-value waste stream still traded on phone calls and personal networks.</p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="group rounded-[var(--radius-lg)] border border-paper-300 bg-paper-100 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-signal-down/30 hover:shadow-lg"
            >
              <div className="flex size-11 items-center justify-center rounded-md bg-gradient-to-br from-signal-down/15 to-signal-down/5 transition-transform duration-200 group-hover:scale-110">
                <p.icon className="size-5 text-signal-down" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{p.copy}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={4}
          className="mt-8 rounded-[var(--radius-md)] border border-copper-400/30 bg-copper-100/40 px-5 py-3 text-center text-sm font-medium text-copper-700"
        >
          Result: sellers lose 10–25% of realisable scrap value and weeks of working capital.
        </motion.p>
      </div>
    </section>
  )
}

function MarketOpportunity() {
  return (
    <section className="bg-graphite-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-400">Market opportunity</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-white">A large market moving toward the circular economy</h2>
          <p className="mt-3 text-sm text-white/50">Recycling demand, regulation and ESG targets are pulling scrap into formal channels.</p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {MARKET_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="group rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-copper-400/40 hover:bg-white/[0.06]"
            >
              <p className="bg-gradient-to-br from-copper-300 to-verdigris-300 bg-clip-text font-mono-data text-4xl font-bold text-transparent transition-transform duration-200 group-hover:scale-105 sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-white/60">{s.label}</p>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] italic text-white/30">
          Illustrative market sizing based on published industry estimates.
        </p>
      </div>
    </section>
  )
}

function HowItWorks() {
  const [tab, setTab] = useState('buyer')
  const steps = tab === 'buyer' ? BUYER_STEPS : SELLER_STEPS
  return (
    <section id="how-it-works" className="bg-paper-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">
            Three steps, whichever side of the trade you&apos;re on
          </h2>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-paper-300 bg-white p-1">
            {[
              { id: 'buyer', label: 'For buyers' },
              { id: 'seller', label: 'For sellers' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-graphite-900 text-white' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-copper-300/60 hover:shadow-lg"
            >
              <span className="font-mono-data text-xs text-ink-300">0{i + 1}</span>
              <div className="mt-3 flex size-11 items-center justify-center rounded-md bg-gradient-to-br from-copper-400 to-copper-600 shadow-sm shadow-copper-500/20 transition-transform duration-200 group-hover:scale-110">
                <s.icon className="size-5 text-white" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MaterialsBand() {
  return (
    <section id="materials" className="bg-gradient-to-b from-graphite-950 to-graphite-900 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
            <p className="font-mono-data text-xs uppercase tracking-wider text-copper-400">Live reference board</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-white">
              17 material categories, priced in real time
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              From copper and structural steel to e-waste and construction &amp; demolition
              debris — track reference pricing the same way a commodities desk would.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {MATERIAL_CATEGORIES.slice(0, 8).map((m) => (
                <Badge key={m.id} variant="outline" className="border-white/15 text-white/70">
                  {m.label}
                </Badge>
              ))}
              <Badge variant="outline" className="border-white/15 text-white/70">
                +{MATERIAL_CATEGORIES.length - 8} more
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] px-3"
          >
            <div className="h-72">
              <MaterialTicker />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function AuctionsFeature() {
  return (
    <section id="auctions" className="bg-paper-100 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
          <div className="flex size-11 items-center justify-center rounded-md bg-copper-100">
            <Gavel className="size-5 text-copper-600" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl text-ink-900">
            Live auctions, real price discovery
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
            Sellers can list high-volume lots as live auctions instead of fixed prices.
            Buyers bid in real time, track countdowns, and get instant outbid alerts —
            no broker, no back-and-forth calls.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink-700">
            {['8–15% higher realised price on bulk lots', 'Documented, auditable sale trail', 'No broker gatekeeping on who can bid', 'Faster clearance of ageing inventory'].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <ShieldCheck className="size-4 shrink-0 text-verdigris-500" /> {f}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="rounded-[var(--radius-lg)] border border-paper-300 bg-graphite-900 p-6"
        >
          <div className="flex items-center justify-between">
            <Badge variant="copper">Live</Badge>
            <span className="font-mono-data text-xs text-white/40">Lot #A-2201</span>
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-white">Grade A Copper Scrap · 12t</p>
          <p className="text-sm text-white/50">Gulf Recycling Industries · Dubai, UAE</p>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="font-mono-data text-[11px] uppercase tracking-wider text-white/40">Current bid</p>
              <p className="font-mono-data text-3xl font-semibold tabular-nums text-white">$8.24<span className="text-base text-white/40">/kg</span></p>
            </div>
            <div className="text-right">
              <p className="font-mono-data text-[11px] uppercase tracking-wider text-white/40">Ends in</p>
              <p className="font-mono-data text-lg font-medium tabular-nums text-copper-400">02:14:37</p>
            </div>
          </div>
          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-copper-500"
              initial={{ width: '20%' }}
              whileInView={{ width: '68%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 font-mono-data text-[11px] text-white/40">14 bids · 6 verified buyers watching</p>
        </motion.div>
      </div>
    </section>
  )
}

function ForBuyersSellers() {
  return (
    <section id="buyers-sellers" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">Built for both sides</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">One marketplace, two verified networks</h2>
        </motion.div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} custom={0} className="group rounded-[var(--radius-lg)] border border-paper-300 bg-paper-100 p-8 transition-all duration-200 hover:-translate-y-1 hover:border-verdigris-300/60 hover:shadow-lg">
            <div className="flex size-14 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-verdigris-400 to-verdigris-600 shadow-sm shadow-verdigris-500/20 transition-transform duration-200 group-hover:scale-110">
              <Factory className="size-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">For scrap generators</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Manufacturers, construction firms, factories and developers list scrap
              in minutes and reach a network of verified vendors — no time wasted
              chasing brokers for the first offer.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/register/seller">Register as a seller <ArrowRight className="size-4" /></Link>
            </Button>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={fadeUp} custom={1} className="group rounded-[var(--radius-lg)] border border-paper-300 bg-paper-100 p-8 transition-all duration-200 hover:-translate-y-1 hover:border-copper-300/60 hover:shadow-lg">
            <div className="flex size-14 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-copper-400 to-copper-600 shadow-sm shadow-copper-500/20 transition-transform duration-200 group-hover:scale-110">
              <Building2 className="size-7 text-white" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">For scrap buyers</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Registered dealers, recyclers, smelters and e-waste handlers source
              from KYC-verified sellers across hub cities. Bid live, track orders,
              and reorder from generators you already trust.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/register/buyer">Register as a buyer <ArrowRight className="size-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function WhyWeWin() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">Why we win</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">Trust and price discovery are the moat</h2>
          <p className="mt-3 text-sm text-ink-500">In a broker-led market, verification and transparency are what earn repeat business.</p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_WE_WIN.map((w, i) => (
            <motion.div
              key={w.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="group rounded-[var(--radius-lg)] border border-paper-300 bg-paper-100 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-verdigris-300/60 hover:shadow-lg"
            >
              <div className="flex size-11 items-center justify-center rounded-md bg-gradient-to-br from-verdigris-400 to-verdigris-600 shadow-sm shadow-verdigris-500/20 transition-transform duration-200 group-hover:scale-110">
                <w.icon className="size-5 text-white" />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{w.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="bg-paper-100 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mx-auto max-w-xl text-center">
          <p className="font-mono-data text-xs uppercase tracking-wider text-copper-600">Trusted on both sides</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl text-ink-900">What traders say</h2>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="rounded-[var(--radius-lg)] border border-paper-300 bg-white p-6"
            >
              <div className="flex gap-0.5 text-copper-500">
                {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="size-3.5 fill-current" />)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <p className="text-sm font-medium text-ink-900">{t.name}</p>
                <p className="text-xs text-ink-500">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-20">
      <DottedWorldTexture />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="font-display text-3xl font-bold text-white sm:text-4xl">
          Ready to trade smarter?
        </motion.h2>
        <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} custom={1} className="mt-3 text-white/85">
          Registration takes minutes. Verification keeps every trade on the marketplace safe.
        </motion.p>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} custom={2} className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-white text-graphite-950 shadow-xl shadow-black/20 hover:bg-white/90">
            <Link to="/register">Create your account <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/15">
            <Link to="/login">Sign in</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-graphite-950 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-copper-500">
            <Recycle className="size-4 text-white" />
          </div>
          <span className="font-display text-sm font-semibold text-white">ScrapBridge</span>
        </div>
        <p className="font-mono-data text-[11px] text-white/30">© {new Date().getFullYear()} ScrapBridge · Verified materials exchange</p>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper-100">
      <PublicNav />
      <Hero />
      <ThreeWaysToTrade />
      <SeeItInAction />
      <PeopleSection />
      <ProblemSection />
      <MarketOpportunity />
      <HowItWorks />
      <MaterialsBand />
      <AuctionsFeature />
      <ForBuyersSellers />
      <WhyWeWin />
      <Testimonials />
      <CtaBand />
      <Footer />
    </div>
  )
}
