export interface TokenCardProps {
  type: "contact" | "recognition" | "circle"
  count: number
  available: number
  description: string
}

const tokenConfig = {
  contact: {
    emoji: "🤝",
    gradient: "from-green-400 to-emerald-500",
    glow: "shadow-green-500/30",
    name: "Contact",
  },
  recognition: {
    emoji: "⭐",
    gradient: "from-yellow-400 to-orange-500",
    glow: "shadow-yellow-500/30",
    name: "Recognition",
  },
  circle: {
    emoji: "💎",
    gradient: "from-blue-400 to-indigo-500",
    glow: "shadow-blue-500/30",
    name: "Circle",
  },
}

export function TokenCard({ type, count, available, description }: TokenCardProps) {
  const config = tokenConfig[type]

  return (
    <div
      className={`
      relative bg-white rounded-xl border-2 border-gray-200
      shadow-lg ${config.glow} hover:shadow-xl 
      transform hover:scale-105 transition-all duration-300
      overflow-hidden
    `}
    >
      {/* Token type header */}
      <div className={`h-24 bg-gradient-to-br ${config.gradient} flex items-center justify-center relative`}>
        <div className="text-4xl mb-2">{config.emoji}</div>
        <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-white text-xs font-bold">{available} left</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 text-center space-y-2">
        <h3 className="font-serif font-bold text-lg text-gray-900">{config.name}</h3>
        <div className="text-3xl font-bold text-gray-800">{count}</div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-full hover:translate-x-[-200%] transition-transform duration-1000 pointer-events-none"></div>
    </div>
  )
}
