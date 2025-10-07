"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings, Circle } from "lucide-react"

// Circle of Trust LED Visualization Component
function TrustCircleVisualization({ allocatedOut, maxSlots, bondedContacts }: { 
  allocatedOut: number; 
  maxSlots: number; 
  bondedContacts: number;
}) {
  const totalSlots = maxSlots
  const dots = Array.from({ length: totalSlots }, (_, i) => {
    // Arrange dots in a circle
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 35 // Distance from center for larger professional look
    const x = Math.cos(radian) * radius + 50 // 50 is center (100/2)
    const y = Math.sin(radian) * radius + 50

    // Determine LED state: cyan (trust allocated), gray (available slot)
    let ledStyle = ""
    let innerStyle = ""
    let glowStyle = ""
    
    if (i < allocatedOut) {
      // Cyan LEDs for trust allocations - Professional theme
      ledStyle = "bg-gradient-to-br from-cyan-400 to-cyan-600 border-2 border-cyan-300"
      innerStyle = "bg-gradient-to-br from-cyan-300 to-cyan-500"
      glowStyle = "shadow-lg shadow-cyan-500/50"
    } else {
      // Gray LEDs for available trust slots
      ledStyle = "bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-gray-300 opacity-40"
      innerStyle = "bg-gradient-to-br from-gray-300 to-gray-500"
      glowStyle = "shadow-md shadow-gray-400/20"
    }

    return (
      <div
        key={i}
        className={`absolute w-5 h-5 rounded-full transform -translate-x-2.5 -translate-y-2.5 ${ledStyle} ${glowStyle}`}
        style={{ left: x, top: y }}
      >
        {/* LED inner glow effect */}
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        {/* LED highlight spot */}
        <div className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-60" />
      </div>
    )
  })

  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
      {dots}
      {/* Center professional icon */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-sm border border-white/20">
        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#00F6FF]" />
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
    <div className="max-w-lg mx-auto px-3 py-4 space-y-6">
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