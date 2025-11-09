"use client"

interface TrustCircleVisualizationProps {
  allocatedOut: number
  maxSlots: number
  bondedContacts: number
  onPress?: () => void
}

export function TrustCircleVisualization({ 
  allocatedOut, 
  maxSlots, 
  bondedContacts, 
  onPress 
}: TrustCircleVisualizationProps) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle - using enhanced mobile-friendly sizing
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 35 // Increased radius for mobile visibility
    const x = Math.cos(radian) * radius + 48 // 48 is center (96/2) - scaled up
    const y = Math.sin(radian) * radius + 48

    // Determine LED state: CYAN (trust allocated), gray (available slot)
    let ledStyle = ""
    let innerStyle = ""
    let pulseEffect = ""
    
    if (i < allocatedOut) {
      // CYAN LEDs for trust allocations - enhanced with metallic glow
      ledStyle = "bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_0_12px_rgba(0,246,255,0.6),0_0_24px_rgba(0,246,255,0.3)] border-2 border-purple-300"
      innerStyle = "bg-gradient-to-br from-purple-300 to-purple-500"
      pulseEffect = "animate-pulse"
    } else {
      // Gray LEDs for available trust slots - slightly more visible
      ledStyle = "bg-gradient-to-br from-gray-300 to-gray-500 shadow-md shadow-gray-400/30 border-2 border-gray-200 opacity-50"
      innerStyle = "bg-gradient-to-br from-gray-200 to-gray-400"
    }

    return (
      <div
        key={i}
        className={`absolute w-5 h-5 rounded-full transform -translate-x-2.5 -translate-y-2.5 ${ledStyle} ${pulseEffect}`}
        style={{ left: x, top: y }}
      >
        {/* LED inner glow effect */}
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        {/* LED highlight spot */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-70" />
      </div>
    )
  })

  // Make the whole circle tappable if onPress provided
  const CircleContent = (
    <div className="relative w-24 h-24 flex-shrink-0">
      {dots}
      {/* Center fire emoji - enhanced for mobile */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
        <span className="text-xl animate-pulse">🔥</span>
      </div>
    </div>
  )

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="active:scale-95 transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-[#00F6FF]/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full"
        aria-label="Manage circle members"
      >
        {CircleContent}
      </button>
    )
  }

  return CircleContent
}
