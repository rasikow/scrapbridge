import { motion } from 'framer-motion'
import { Factory, Recycle, Building2, ShieldCheck } from 'lucide-react'

const PARTICLE_COLORS = ['#C1793F', '#5b968c', '#D3925E', '#3f7d74']

/**
 * A single lane carrying looping particles from (x1,y1) to (x2,y2). Uses
 * plain cx/cy keyframe animation (not CSS offset-path) so it renders
 * identically across every browser — no video asset required.
 */
function FlowLane({ x1, y1, x2, y2, count = 4, duration = 2.6, delayBase = 0 }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
      {Array.from({ length: count }).map((_, i) => (
        <motion.circle
          key={i}
          r={3.4}
          fill={PARTICLE_COLORS[i % PARTICLE_COLORS.length]}
          initial={{ cx: x1, cy: y1, opacity: 0 }}
          animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
            delay: delayBase + (i / count) * duration,
          }}
        />
      ))}
    </>
  )
}

const SELLER_Y = [90, 210, 330]
const BUYER_Y = [90, 210, 330]
const HUB = { x: 320, y: 210 }
const SELLER_X = 90
const BUYER_X = 550

/**
 * A self-contained, looping animation (no external video asset needed):
 * sellers on the left feed material into the ScrapBridge hub, which
 * verifies and routes it out to buyers on the right.
 */
export function TradeFlowAnimation({ className }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 640 420" className="h-full w-full" role="img" aria-label="Animated diagram of sellers trading verified materials with buyers through ScrapBridge">
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C1793F" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C1793F" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={HUB.x} cy={HUB.y} r="150" fill="url(#hubGlow)" />

        {SELLER_Y.map((y, i) => (
          <FlowLane key={`s${y}`} x1={SELLER_X} y1={y} x2={HUB.x} y2={HUB.y} duration={2.4 + i * 0.3} delayBase={i * 0.3} />
        ))}
        {BUYER_Y.map((y, i) => (
          <FlowLane key={`b${y}`} x1={HUB.x} y1={HUB.y} x2={BUYER_X} y2={y} duration={2.2 + i * 0.3} delayBase={0.6 + i * 0.3} />
        ))}

        {SELLER_Y.map((y, i) => (
          <motion.circle
            key={`sn${y}`}
            cx={SELLER_X}
            cy={y}
            r="26"
            fill="#1c2528"
            stroke="#5b968c"
            strokeWidth="1.5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12 * i, duration: 0.5 }}
          />
        ))}

        {BUYER_Y.map((y, i) => (
          <motion.circle
            key={`bn${y}`}
            cx={BUYER_X}
            cy={y}
            r="26"
            fill="#1c2528"
            stroke="#d3925e"
            strokeWidth="1.5"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12 * i, duration: 0.5 }}
          />
        ))}

        <motion.circle
          cx={HUB.x}
          cy={HUB.y}
          r="46"
          fill="#12181b"
          stroke="#C1793F"
          strokeWidth="2"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.circle
          cx={HUB.x}
          cy={HUB.y}
          r="46"
          fill="none"
          stroke="#C1793F"
          strokeWidth="1"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
      </svg>

      {/* HTML overlay for crisp icon + label rendering atop the SVG */}
      <div className="pointer-events-none relative -mt-[420px] mx-auto h-[420px] w-full max-w-[640px]">
        {SELLER_Y.map((y) => (
          <div
            key={y}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${(SELLER_X / 640) * 100}%`, top: `${(y / 420) * 100}%` }}
          >
            <Factory className="size-5 text-verdigris-400" />
          </div>
        ))}
        {BUYER_Y.map((y) => (
          <div
            key={y}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${(BUYER_X / 640) * 100}%`, top: `${(y / 420) * 100}%` }}
          >
            <Building2 className="size-5 text-copper-400" />
          </div>
        ))}

        <div
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          style={{ left: `${(HUB.x / 640) * 100}%`, top: `${(HUB.y / 420) * 100}%` }}
        >
          <Recycle className="size-7 text-copper-400" />
        </div>

        <div className="absolute top-[2%] -translate-x-1/2 whitespace-nowrap font-mono-data text-[10px] uppercase tracking-wider text-white/40" style={{ left: `${(SELLER_X / 640) * 100}%` }}>
          Sellers
        </div>
        <div className="absolute top-[2%] -translate-x-1/2 whitespace-nowrap font-mono-data text-[10px] uppercase tracking-wider text-white/40" style={{ left: `${(BUYER_X / 640) * 100}%` }}>
          Buyers
        </div>
        <div
          className="absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono-data text-[9px] uppercase tracking-wider text-white/50"
          style={{ left: `${(HUB.x / 640) * 100}%`, top: `${((HUB.y + 68) / 420) * 100}%` }}
        >
          <ShieldCheck className="size-2.5 text-copper-400" /> Verified exchange
        </div>
      </div>
    </div>
  )
}
