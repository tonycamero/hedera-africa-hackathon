import { cn } from "@/lib/utils"

interface CircularTokenDisplayProps {
  activeTokens: number
  waitingTokens: number
  className?: string
}

export function CircularTokenDisplay({ activeTokens, waitingTokens, className }: CircularTokenDisplayProps) {
  const totalTokens = 9
  const reservedTokens = totalTokens - activeTokens - waitingTokens

  // Create array of token states
  const tokens = Array.from({ length: totalTokens }, (_, index) => {
    if (index < activeTokens) return "active"
    if (index < activeTokens + waitingTokens) return "waiting"
    return "reserved"
  })

  return (
    <div className={cn("relative w-64 h-64 mx-auto", className)}>
      {/* Center circle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-card border-2 border-border flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold font-serif text-foreground">{activeTokens}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>
      </div>

      {/* Token circles arranged in a circle */}
      {tokens.map((state, index) => {
        const angle = (index * 360) / totalTokens - 90 // Start from top
        const radian = (angle * Math.PI) / 180
        const radius = 100 // Distance from center
        const x = Math.cos(radian) * radius
        const y = Math.sin(radian) * radius

        return (
          <div
            key={index}
            className="absolute w-8 h-8 rounded-full transition-all duration-300"
            style={{
              left: `calc(50% + ${x}px - 16px)`,
              top: `calc(50% + ${y}px - 16px)`,
            }}
          >
            <div
              className={cn("w-full h-full rounded-full border-2 transition-all duration-300", {
                // Active tokens - green with glow
                "bg-green-500 border-green-400 shadow-lg shadow-green-500/50 animate-pulse": state === "active",
                // Waiting tokens - yellow
                "bg-yellow-500 border-yellow-400 shadow-md shadow-yellow-500/30": state === "waiting",
                // Reserved tokens - gray
                "bg-gray-300 border-gray-400": state === "reserved",
              })}
            >
              {/* Inner glow for active tokens */}
              {state === "active" && <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />}
            </div>

            {/* Connection line to center for active tokens */}
            {state === "active" && (
              <div
                className="absolute w-0.5 bg-gradient-to-r from-green-500/50 to-transparent origin-bottom"
                style={{
                  height: `${radius - 16}px`,
                  left: "50%",
                  bottom: "16px",
                  transform: `translateX(-50%) rotate(${angle + 90}deg)`,
                }}
              />
            )}
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
            <span className="text-muted-foreground">Active ({activeTokens})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-muted-foreground">Waiting ({waitingTokens})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-muted-foreground">Reserved ({reservedTokens})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
