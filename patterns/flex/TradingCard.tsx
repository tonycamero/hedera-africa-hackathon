export interface TradingCardProps {
  title: string
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
  avatar: string
  description: string
  issuer?: string
  timestamp?: string
  glowEffect?: boolean
}

const rarityConfig = {
  common: {
    gradient: "from-slate-400 to-slate-600",
    glow: "shadow-slate-500/20",
    border: "border-slate-300",
    text: "text-slate-700",
  },
  rare: {
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-500/30",
    border: "border-blue-300",
    text: "text-blue-700",
  },
  epic: {
    gradient: "from-purple-400 to-purple-600",
    glow: "shadow-purple-500/40",
    border: "border-purple-300",
    text: "text-purple-700",
  },
  legendary: {
    gradient: "from-orange-400 to-red-500",
    glow: "shadow-orange-500/50",
    border: "border-orange-300",
    text: "text-orange-700",
  },
}

export function TradingCard({
  title,
  category,
  rarity,
  avatar,
  description,
  issuer,
  timestamp,
  glowEffect = false,
}: TradingCardProps) {
  const config = rarityConfig[rarity]

  return (
    <div
      className={`
      relative bg-white rounded-xl border-2 ${config.border} 
      shadow-lg ${config.glow} hover:shadow-xl 
      transform hover:scale-105 transition-all duration-300
      ${glowEffect ? "animate-pulse" : ""}
      overflow-hidden
    `}
    >
      {/* Rarity indicator */}
      <div
        className={`absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold uppercase tracking-wide`}
      >
        {rarity}
      </div>

      {/* Avatar section */}
      <div
        className={`h-32 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative text-6xl font-bold text-white drop-shadow-lg">{avatar}</div>
        {/* Sparkle effects for legendary */}
        {rarity === "legendary" && (
          <>
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-6 right-6 w-1 h-1 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-8 right-8 w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
          </>
        )}
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight">{title}</h3>
          <p className={`text-sm font-medium uppercase tracking-wide ${config.text}`}>{category}</p>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

        {issuer && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>By {issuer}</span>
            {timestamp && <span>{new Date(timestamp).toLocaleDateString()}</span>}
          </div>
        )}
      </div>

      {/* Holographic effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}
