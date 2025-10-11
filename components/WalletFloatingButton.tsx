'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Plus } from 'lucide-react'
import { useDemoMode } from '@/lib/hooks/useDemoMode'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'

export function WalletFloatingButton() {
  const router = useRouter()
  const { getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    router.push('/wallet')
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`
                relative
                h-14 w-14 
                rounded-full 
                bg-gradient-to-r from-blue-600 to-purple-600 
                hover:from-blue-700 hover:to-purple-700
                shadow-lg hover:shadow-xl
                transition-all duration-300 ease-out
                border-2 border-white/20
                group
                ${isHovered ? 'scale-110' : 'scale-100'}
              `}
              size="sm"
            >
              <div className="relative flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
                
                {/* Notification dot for new signals */}
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white animate-pulse" />
                
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="font-medium">My Signal Wallet</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Data Source:</span>
                <Badge className={`text-xs ${getDataSourceBadgeColor('wallet')}`}>
                  {getDataSourceLabel('wallet')}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                View your collectible signal tokens
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}