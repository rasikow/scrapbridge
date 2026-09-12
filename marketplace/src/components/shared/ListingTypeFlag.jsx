import { Tag, HandCoins, Gavel, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { LISTING_TYPES } from '@/data/auctionConstants'
import { cn } from '@/lib/utils'

/**
 * A single, unambiguous "flag" identifying how a listing is sold — Fixed
 * Price, Accept Offers, Auction, or Auction + Buy Now. Every product on the
 * marketplace carries exactly one of these, in the same top-left position
 * on its card, so buyers can tell how to transact at a glance without
 * opening the listing.
 */
const FLAG_CONFIG = {
  [LISTING_TYPES.FIXED]: {
    label: 'Fixed Price',
    icon: Tag,
    className: 'bg-graphite-900 text-white',
  },
  [LISTING_TYPES.ACCEPT_BIDS]: {
    label: 'Accepting Offers',
    icon: HandCoins,
    className: 'bg-verdigris-500 text-white',
  },
  [LISTING_TYPES.AUCTION]: {
    label: 'Live Auction',
    icon: Gavel,
    className: 'bg-signal-down text-white',
    pulse: true,
  },
  [LISTING_TYPES.AUCTION_BUYNOW]: {
    label: 'Auction + Buy Now',
    icon: Zap,
    className: 'bg-copper-500 text-white',
    pulse: true,
  },
}

export function ListingTypeFlag({ listingType, auctionLive, className }) {
  const config = FLAG_CONFIG[listingType] || FLAG_CONFIG[LISTING_TYPES.FIXED]
  const Icon = config.icon
  const showPulse = config.pulse && auctionLive === true

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm',
        config.className,
        className
      )}
    >
      {showPulse && (
        <span className="relative flex size-1.5">
          <motion.span
            className="absolute inline-flex size-full rounded-full bg-white/80"
            animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
      )}
      <Icon className="size-3" />
      {config.label}
    </span>
  )
}
