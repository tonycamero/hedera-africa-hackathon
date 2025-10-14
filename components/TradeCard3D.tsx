'use client'

type Rarity = "common" | "rare" | "epic" | "legendary"

export interface TradeCard3DProps {
  title: string
  template: string
  fill: string
  note?: string
  senderHandle: string
  recipientHandle: string
  rarity?: Rarity
  boostCount?: number
  emoji?: string
  timestamp?: string
  compact?: boolean
  className?: string
  onClick?: () => void
}

const rarityRings: Record<Rarity, string> = {
  common:     "ring-slate-300/40",
  rare:       "ring-cyan-300/50", 
  epic:       "ring-purple-300/50",
  legendary:  "ring-orange-300/60"
}

const rarityGlow: Record<Rarity, string> = {
  common:     "from-slate-400/18 to-slate-600/14",
  rare:       "from-cyan-400/20 to-blue-500/14",
  epic:       "from-fuchsia-400/20 to-purple-500/14",
  legendary:  "from-amber-400/22 to-rose-500/16"
}

const getRarityFromBoostCount = (boostCount: number): Rarity => {
  if (boostCount >= 100) return 'legendary'
  if (boostCount >= 50) return 'epic'
  if (boostCount >= 10) return 'rare'
  return 'common'
}

export default function TradeCard3D({
  title,
  template,
  fill,
  note,
  senderHandle,
  recipientHandle,
  rarity: providedRarity,
  boostCount = 0,
  emoji = "🔥",
  timestamp,
  compact = false,
  className = "",
  onClick
}: TradeCard3DProps) {

  const rarity = providedRarity || getRarityFromBoostCount(boostCount)
  const praiseText = template.replace('___', `"${fill}"`)

  // Compact mobile card for 3-column grid
  if (compact) {
    return (
      <div className={`perspective-1200 ${className}`}>
        <div
          className={`
            group relative w-full aspect-[3/4] preserve-3d rounded-lg
            bg-gradient-to-br from-[#0e0f13] to-[#121521]
            ring-2 ${rarityRings[rarity]} card-edge-glow
            animate-[idle-tilt_6s_ease-in-out_infinite] idle-tilt
            will-change-transform cursor-pointer
            transition-transform duration-500
            hover:rotate-y-3 hover:-rotate-x-2
          `}
          onClick={onClick}
          aria-label={`${title} trading card, tap to expand`}
          role="button"
          tabIndex={0}
        >
          {/* Edge highlight (outer acrylic) */}
          <div
            className={`
              pointer-events-none absolute inset-0 rounded-lg
              bg-gradient-to-r ${rarityGlow[rarity]}
              opacity-60 blur-[6px] -z-10
            `}
            style={{ transform: "translateZ(-2px)" }}
          />

          {/* Specular sheen sweep */}
          <div
            className="sheen pointer-events-none absolute -inset-2 rounded-lg 
                       bg-[linear-gradient(105deg,rgba(255,255,255,0)_0%,rgba(255,255,255,.25)_50%,rgba(255,255,255,0)_100%)]
                       mix-blend-screen animate-[sheen_6s_linear_infinite]"
            style={{ transform: "translateZ(14px)" }}
          />

          {/* Compact boost count */}
          {boostCount > 0 && (
            <div 
              className="absolute top-1 left-1 text-[8px] font-bold text-white bg-black/60 px-1 rounded z-10"
              style={{ transform: "translateZ(12px)" }}
            >
              {boostCount}
            </div>
          )}

          {/* Compact rarity indicator */}
          <div 
            className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-gradient-to-r ${rarityGlow[rarity]} z-10`}
            style={{ transform: "translateZ(12px)" }}
          />

          {/* Printed panel */}
          <div
            className="absolute inset-[6px] rounded-[6px] overflow-hidden card-inner-border bg-[#161926]"
            style={{ transform: "translateZ(8px)" }}
          >
            {/* Compact header */}
            <div className={`h-10 bg-gradient-to-br ${rarityGlow[rarity]} flex items-center justify-center relative`}>
              <div className="text-lg">{emoji}</div>
              {rarity === 'legendary' && (
                <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" />
              )}
            </div>

            {/* Compact content */}
            <div className="p-1.5 flex-1 flex flex-col justify-between text-white">
              <div className="text-[8px] font-bold leading-tight line-clamp-2 mb-1">
                {fill.slice(0, 25)}{fill.length > 25 ? '...' : ''}
              </div>
              <div className="flex justify-between text-[6px] text-gray-400">
                <span>{senderHandle.split('.')[0]}</span>
                <span className="font-bold uppercase">{rarity[0]}</span>
              </div>
            </div>
          </div>

          {/* Tap indicator */}
          <div 
            className="absolute bottom-1 right-1 text-[8px] text-gray-400"
            style={{ transform: "translateZ(14px)" }}
          >
            👆
          </div>
        </div>
      </div>
    )
  }

  // Full-size 3D trading card
  return (
    <div className={`perspective-1200 ${className}`}>
      <div
        className={`
          group relative w-[280px] h-[420px] sm:w-[320px] sm:h-[480px]
          mx-auto preserve-3d rounded-[20px]
          bg-gradient-to-br from-[#0e0f13] to-[#121521]
          ring-2 ${rarityRings[rarity]} card-edge-glow
          animate-[idle-tilt_6s_ease-in-out_infinite] idle-tilt
          will-change-transform cursor-pointer
          transition-transform duration-500
          hover:rotate-y-3 hover:-rotate-x-2
        `}
        onClick={onClick}
        aria-label={`${title} trading card`}
        role="article"
      >
        {/* Edge highlight (outer acrylic) */}
        <div
          className={`
            pointer-events-none absolute inset-0 rounded-[20px]
            bg-gradient-to-r ${rarityGlow[rarity]}
            opacity-60 blur-[6px] -z-10
          `}
          style={{ transform: "translateZ(-2px)" }}
        />

        {/* Specular sheen sweep */}
        <div
          className="sheen pointer-events-none absolute -inset-6 rounded-[24px] 
                     bg-[linear-gradient(105deg,rgba(255,255,255,0)_0%,rgba(255,255,255,.25)_50%,rgba(255,255,255,0)_100%)]
                     mix-blend-screen animate-[sheen_6s_linear_infinite]"
          style={{ transform: "translateZ(14px)" }}
        />

        {/* Boost count badge */}
        {boostCount > 0 && (
          <div 
            className="absolute top-3 left-3 px-2 py-1 text-xs font-bold text-white bg-black/35 ring-1 ring-white/15 rounded-full z-10"
            style={{ transform: "translateZ(12px)" }}
          >
            🔥 {boostCount}
          </div>
        )}

        {/* Rarity badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wide
                     bg-gradient-to-r ${rarityGlow[rarity]} text-white rounded-full z-10`}
          style={{ transform: "translateZ(12px)" }}
        >
          {rarity}
        </div>

        {/* Printed panel (the art) */}
        <div
          className="absolute inset-[14px] rounded-[14px] overflow-hidden card-inner-border bg-[#161926]"
          style={{ transform: "translateZ(8px)" }}
        >
          {/* Header section */}
          <div className={`h-[45%] bg-gradient-to-br ${rarityGlow[rarity]} flex items-center justify-center relative overflow-hidden`}>
            <div className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg">{emoji}</div>
            
            {/* Sparkle effects for legendary */}
            {rarity === "legendary" && (
              <>
                <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full md:animate-ping motion-reduce:animate-none"></div>
                <div className="absolute bottom-6 right-6 w-1 h-1 bg-white rounded-full md:animate-pulse motion-reduce:animate-none"></div>
                <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white rounded-full md:animate-bounce motion-reduce:animate-none"></div>
              </>
            )}

            {/* Epic effects */}
            {rarity === "epic" && (
              <>
                <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-white rounded-full md:animate-pulse motion-reduce:animate-none"></div>
                <div className="absolute bottom-8 right-8 w-1 h-1 bg-white rounded-full md:animate-bounce motion-reduce:animate-none"></div>
              </>
            )}
          </div>

          {/* Lower content slab */}
          <div className="h-[55%] px-4 py-3 grid grid-rows-[auto_auto_1fr] gap-1 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight line-clamp-1">{title}</h3>
            </div>

            <div className="text-[11px] sm:text-xs leading-snug line-clamp-2">
              <blockquote className="font-bold">"{praiseText}"</blockquote>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-col gap-1 text-[10px] text-gray-300">
                  <span>from @{senderHandle}</span>
                  <span>for @{recipientHandle}</span>
                </div>
                {note && (
                  <p className="text-[9px] text-gray-400 line-clamp-2 mt-1">"{note}"</p>
                )}
              </div>

              {timestamp && (
                <span 
                  className="text-[8px] text-gray-500 shrink-0"
                  style={{ transform: "translateZ(10px)" }}
                >
                  {new Date(timestamp).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inner rim gloss */}
        <div
          className="pointer-events-none absolute inset-[6px] rounded-[16px]
                     bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,.18)_0%,rgba(255,255,255,0)_60%)]
                     opacity-60"
          style={{ transform: "translateZ(10px)" }}
        />
      </div>
    </div>
  )
}