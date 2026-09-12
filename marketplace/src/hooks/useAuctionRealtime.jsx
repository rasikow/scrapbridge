import { useEffect, useRef, useState, useCallback } from 'react'
import { auctionService } from '@/services/auction.service'

/**
 * Runs the auction scheduler tick on an interval for the lifetime of the
 * app, and relays every `storage` event (localStorage writes from *other*
 * browser tabs) into the same-tab auction bus — this is what makes a bid
 * placed in one tab appear live in another without a manual refresh.
 * Mount once, near the root (see `App.jsx`).
 */
export function useAuctionScheduler() {
  useEffect(() => {
    auctionService.tick()
    const interval = setInterval(() => auctionService.tick(), 4000)

    function onStorage(e) {
      if (e.key && e.key.startsWith('marketplace_mock_auction')) {
        auctionService.bus.dispatchEvent(new CustomEvent('changed', { detail: { kind: 'storage' } }))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', onStorage)
    }
  }, [])
}

/**
 * Subscribes a component to live auction data — a single auction (by id or
 * productId) or a filtered list — re-fetching whenever the auction bus
 * fires (a bid was placed, the scheduler closed an auction, etc). This is
 * the "no refresh needed" mechanism behind the buyer bid panel, the seller
 * live-monitor and the admin auction table.
 */
export function useLiveAuction({ auctionId, productId }) {
  const [auction, setAuction] = useState(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  const reload = useCallback(() => {
    const fetcher = auctionId
      ? auctionService.getAuction(auctionId)
      : productId
        ? auctionService.getAuctionByProduct(productId)
        : Promise.resolve(null)
    fetcher.then((a) => {
      if (mounted.current) {
        setAuction(a)
        setLoading(false)
      }
    })
  }, [auctionId, productId])

  useEffect(() => {
    mounted.current = true
    reload()
    const handler = () => reload()
    auctionService.bus.addEventListener('changed', handler)
    const interval = setInterval(reload, 3000) // countdown/live refresh even with no bus event
    return () => {
      mounted.current = false
      auctionService.bus.removeEventListener('changed', handler)
      clearInterval(interval)
    }
  }, [reload])

  return { auction, loading, reload }
}

export function useLiveBidHistory(auctionId) {
  const [bids, setBids] = useState([])

  const reload = useCallback(() => {
    if (!auctionId) return
    auctionService.listBidsForAuction(auctionId).then(setBids)
  }, [auctionId])

  useEffect(() => {
    reload()
    const handler = () => reload()
    auctionService.bus.addEventListener('changed', handler)
    return () => auctionService.bus.removeEventListener('changed', handler)
  }, [reload])

  return { bids, reload }
}
