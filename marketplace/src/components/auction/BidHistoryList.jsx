import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { anonymizedLabel } from '@/lib/auctionEngine'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'

const STATUS_TONE = { winning: 'success', outbid: 'default', won: 'success', lost: 'outline', active: 'default', retracted: 'danger' }
const STATUS_LABEL = { winning: 'Winning', outbid: 'Outbid', won: 'Won', lost: 'Lost', active: 'Active', retracted: 'Retracted' }

export function BidHistoryList({ auction, bids, emptyLabel = 'No bids yet — be the first.' }) {
  const { user } = useAuth()

  if (!bids || bids.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-500">{emptyLabel}</p>
  }

  return (
    <div className="divide-y divide-paper-200 overflow-hidden rounded-[var(--radius-lg)] border border-paper-300 bg-white">
      {bids.map((bid) => {
        const label = auction ? anonymizedLabel({ auction, bidderId: bid.buyerId, bidderName: bid.buyerName, viewer: user }) : bid.buyerName
        return (
          <div key={bid.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-graphite-900 text-[11px] font-medium text-white">
                {label === 'You' ? 'Y' : label.replace('Bidder ', '#')}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{label}</p>
                <p className="text-[11px] text-ink-300">{new Date(bid.timestamp).toLocaleString()}</p>
              </div>
              {bid.isAutoBid && (
                <span title="Placed via auto-bid" className="flex items-center gap-0.5 text-[10px] text-verdigris-500">
                  <Bot className="size-3" /> auto
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-mono-data font-semibold text-ink-900">{formatCurrency(bid.amount, auction?.currency)}</span>
              <Badge variant={STATUS_TONE[bid.status] || 'default'}>{STATUS_LABEL[bid.status] || bid.status}</Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
