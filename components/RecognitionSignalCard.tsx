import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RecognitionSignalCardProps {
  name: string
  description: string
  category: 'social' | 'academic' | 'professional'
  number: number
  icon: string
  isActive: boolean
  onClick?: () => void
}

export function RecognitionSignalCard({ 
  name, 
  description, 
  category, 
  number, 
  icon, 
  isActive,
  onClick
}: RecognitionSignalCardProps) {
  // Use our universal theme CSS variables for category borders
  const categoryBorderStyles = {
    social: 'border-[var(--social)]', // Electric cyan from our theme
    academic: 'border-[var(--academic)]', // Electric purple from our theme  
    professional: 'border-[var(--professional)]' // Electric blue from our theme
  }

  return (
    <Card 
      className={`
        bg-card 
        border-2 
        ${categoryBorderStyles[category]} 
        hover:shadow-lg 
        hover:scale-105
        transition-all 
        duration-200
        cursor-pointer
        min-h-[140px]
        flex
        flex-col
      `}
      onClick={onClick}
    >
      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        {/* Icon area - bigger and more prominent with green glow */}
        <div className="flex justify-center mb-3">
          <div className="w-18 h-18 bg-card rounded-lg border-2 border-[hsl(var(--neon-green))] flex items-center justify-center text-3xl shadow-lg shadow-[hsl(var(--neon-green))]/30">
            {icon}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 text-center">
          <h3 className="text-foreground font-semibold text-xs sm:text-sm mb-1 truncate">
            {name}
          </h3>
          <p className="text-[hsl(var(--text-muted))] text-xs leading-tight line-clamp-2">
            {description}
          </p>
        </div>

        {/* Bottom area with number and active badge */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[hsl(var(--text-subtle))] text-xs">
            #{number}
          </span>
          {isActive && (
            <Badge 
              variant="secondary" 
              className="bg-[hsl(var(--neon-cyan))] text-[hsl(var(--background))] text-xs px-1.5 py-0.5"
            >
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}