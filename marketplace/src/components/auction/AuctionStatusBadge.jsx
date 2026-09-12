import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AUCTION_STATUS, AUCTION_STATUS_LABEL, AUCTION_STATUS_TONE } from '@/data/auctionConstants'
import { cn } from '@/lib/utils'

export function AuctionStatusBadge({ status, className }) {
  return (
    <Badge variant={AUCTION_STATUS_TONE[status] || 'default'} className={className}>
      {AUCTION_STATUS_LABEL[status] || status}
    </Badge>
  )
}

export function LiveAuctionBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-signal-down px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm',
        className
      )}
    >
      <Flame className="size-3 fill-current" /> LIVE
    </span>
  )
}

export function auctionIsLive(status) {
  return status === AUCTION_STATUS.LIVE
}
