"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle } from "lucide-react"

// Circle of Trust LED Visualization Component with Enhanced Fire Effects
function TrustCircleVisualization({ allocatedOut, maxSlots, bondedContacts }: { 
  allocatedOut: number; 
  maxSlots: number; 
  bondedContacts: number;
}) {
  const totalSlots = maxSlots
  const [pulse, setPulse] = useState(0)
  
  // Create pulsing animation for active LEDs
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 4)
    }, 800)
    return () => clearInterval(interval)
  }, [])
  
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 42 // Slightly larger radius for more dramatic effect
    const x = Math.cos(radian) * radius + 60 // 60 is center for larger container
    const y = Math.sin(radian) * radius + 60

    // Create staggered pulse animation for active LEDs
    const pulseDelay = (i * 200) % 800
    const isPulsingNow = (pulse * 200) % 800 === pulseDelay
    
    if (i < allocatedOut) {
      // Active trust LEDs - Fire theme with enhanced realism
      return (
        <div
          key={i}
          className="absolute transform -translate-x-3 -translate-y-3"
          style={{ 
            left: x, 
            top: y,
            animation: `pulse 2s ease-in-out infinite`,
            animationDelay: `${i * 150}ms`
          }}
        >
          {/* Outer glow ring */}
          <div className={`absolute inset-0 w-6 h-6 rounded-full bg-gradient-radial from-orange-400/60 via-red-500/40 to-transparent blur-sm ${isPulsingNow ? 'scale-150' : 'scale-100'} transition-transform duration-300`} />
          
          {/* Main LED body */}
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 via-red-500 to-red-700 border-2 border-orange-200 shadow-lg">
            {/* Inner fire core */}
            <div className="absolute inset-0.5 rounded-full bg-gradient-radial from-yellow-200 via-orange-400 to-red-600 animate-pulse" />
            
            {/* LED highlight spot */}
            <div className="absolute top-0.5 left-1 w-2 h-2 rounded-full bg-gradient-to-br from-white via-yellow-100 to-transparent opacity-90" />
            
            {/* Fire flicker overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-conic from-transparent via-yellow-300/30 to-transparent animate-spin" style={{ animationDuration: '3s' }} />
            
            {/* Additional inner glow */}
            <div className="absolute inset-1 rounded-full bg-gradient-radial from-yellow-400/80 via-orange-500/50 to-transparent" />
          </div>
          
          {/* Outer shadow for depth */}
          <div className="absolute inset-0 w-6 h-6 rounded-full shadow-[0_0_20px_rgba(251,146,60,0.8)] opacity-70" />
        </div>
      )
    } else {
      // Inactive slot LEDs - Dimmed but still realistic
      return (
        <div
          key={i}
          className="absolute transform -translate-x-3 -translate-y-3 opacity-30"
          style={{ left: x, top: y }}
        >
          {/* Main LED body - inactive */}
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700 border-2 border-slate-300">
            {/* Inactive inner surface */}
            <div className="absolute inset-0.5 rounded-full bg-gradient-radial from-slate-300 via-slate-400 to-slate-600" />
            
            {/* Subtle highlight on inactive LEDs */}
            <div className="absolute top-0.5 left-1 w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      )
    }
  })

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0">
      {/* Background circle with subtle glow */}
      <div className="absolute inset-2 rounded-full bg-gradient-radial from-orange-500/10 via-red-500/5 to-transparent blur-xl" />
      
      {dots}
      
      {/* Center fire effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Outer fire glow */}
        <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-radial from-orange-400/40 via-red-500/20 to-transparent blur-lg animate-pulse" />
        
        {/* Fire core container */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-red-700 border border-orange-300 shadow-2xl overflow-hidden">
          {/* Animated fire layers */}
          <div className="absolute inset-0 bg-gradient-radial from-yellow-200 via-orange-400 to-red-600 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-conic from-transparent via-yellow-300/50 to-transparent animate-spin" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-gradient-conic from-orange-300/30 via-transparent to-red-500/30 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          
          {/* Fire flicker effect */}
          <div className="absolute inset-1 rounded-full bg-gradient-radial from-yellow-300/60 via-orange-500/40 to-transparent animate-pulse" style={{ animationDuration: '1.5s' }} />
          
          {/* Users icon with fire overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
          </div>
          
          {/* Inner highlight */}
          <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-white/80 to-yellow-100/40 blur-sm" />
        </div>
        
        {/* Additional fire glow layers */}
        <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_0_40px_rgba(251,146,60,0.6)]" />
      </div>
    </div>
  )
}

export default function CirclePage() {
  // Mobile responsive update - force reload
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  // Mock data - in real app this would come from state/API
  const trustStats = {
    allocatedOut: 6,
    maxSlots: 9,
    bondedContacts: 3
  }

  const handleMemberClick = (memberId: string) => {
    console.log('🖱️ Member clicked:', memberId)
    setSelectedMember(memberId)
    toast.info(`Opening profile for ${memberId}`)
  }

  const availableSlots = trustStats.maxSlots - trustStats.allocatedOut

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Circle of Trust Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-medium text-white tracking-tight flex items-center gap-2">
            <Circle className="w-5 h-5 text-[#00F6FF]" />
            Your Circle of Trust
          </h1>
          <p className="text-sm text-white/60 mt-1">{trustStats.allocatedOut}/{trustStats.maxSlots} filled · Build your professional network</p>
        </div>
      </div>
      
      {/* Main Trust Circle Card */}
      <Card className="backdrop-blur-md bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <TrustCircleVisualization 
              allocatedOut={trustStats.allocatedOut}
              maxSlots={trustStats.maxSlots}
              bondedContacts={trustStats.bondedContacts}
            />
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-white">{trustStats.allocatedOut}</span>
                <span className="text-white/60">members</span>
                <span className="text-white/40">•</span>
                <span className="text-[#00F6FF]">{availableSlots} slots left</span>
              </div>
              <p className="text-sm text-white/60">Fill {Math.min(2, availableSlots)} more slots for network boost!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
          console.log('👥 Professional Circle clicked')
          toast.success('Opening professional circle builder')
        }}>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-[#00F6FF] mx-auto mb-2" />
            <h3 className="font-medium text-white mb-1">Professional Circle</h3>
            <p className="text-xs text-white/60 mb-3">Invite colleagues to connect</p>
            <Button size="sm" className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10 text-xs">
              <UserPlus className="w-3 h-3 mr-1" />
              Send Invite
            </Button>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
          console.log('💼 Allocate Trust clicked')
          toast.success('Trust allocation started')
        }}>
          <CardContent className="p-4 text-center">
            <Circle className="w-8 h-8 text-[#00F6FF] mx-auto mb-2" />
            <h3 className="font-medium text-white mb-1">Allocate TRST</h3>
            <p className="text-xs text-white/60 mb-3">{trustStats.allocatedOut * 25}/150 Balance</p>
            <Button size="sm" className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10 text-xs">
              <Settings className="w-3 h-3 mr-1" />
              Allocate 25
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card className="backdrop-blur-md bg-white/5 border border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">Progress</span>
            <span className="text-sm text-[#00F6FF]">Level up your network</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Fill {Math.min(2, availableSlots)} more for boost</span>
              <span className="text-white/60">{Math.round((trustStats.allocatedOut / trustStats.maxSlots) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#00F6FF] to-cyan-400 h-2 rounded-full transition-all" 
                style={{ width: `${(trustStats.allocatedOut / trustStats.maxSlots) * 100}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">Next: Unlock professional circles & premium features</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}