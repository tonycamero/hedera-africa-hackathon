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
    // Arrange dots in a circle - using exact original positioning
    const angle = (i * 360) / totalSlots - 90 // Start from top
    const radian = (angle * Math.PI) / 180
    const radius = 20 // Distance from center - original working value
    const x = Math.cos(radian) * radius + 32 // 32 is center (64/2) - original working value
    const y = Math.sin(radian) * radius + 32

    // Determine LED state: GREEN (trust allocated), gray (available slot)
    let ledStyle = ""
    let innerStyle = ""
    
    if (i < allocatedOut) {
      // CYAN LEDs for trust allocations - matching theme #00F6FF
      ledStyle = "bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/50 border-2 border-cyan-300"
      innerStyle = "bg-gradient-to-br from-cyan-300 to-cyan-500"
    } else {
      // Gray LEDs for available trust slots
      ledStyle = "bg-gradient-to-br from-gray-300 to-gray-500 shadow-md shadow-gray-400/20 border-2 border-gray-200 opacity-40"
      innerStyle = "bg-gradient-to-br from-gray-200 to-gray-400"
    }

    return (
      <div
        key={i}
        className={`absolute w-4 h-4 rounded-full transform -translate-x-2 -translate-y-2 ${ledStyle}`}
        style={{ left: x, top: y }}
      >
        {/* LED inner glow effect */}
        <div className={`absolute inset-1 rounded-full ${innerStyle}`} />
        {/* LED highlight spot */}
        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white opacity-60" />
      </div>
    )
  })

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      {dots}
      {/* Center fire emoji */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
        <span className="text-base">🔥</span>
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
      
      {/* Compact 1/3 + 2/3 Layout */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 1/3 - Circle Visualization */}
            <div className="flex-shrink-0">
              <TrustCircleVisualization 
                allocatedOut={trustStats.allocatedOut}
                maxSlots={trustStats.maxSlots}
                bondedContacts={trustStats.bondedContacts}
              />
            </div>
            
            {/* 2/3 - Content & CTA */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-white">{trustStats.allocatedOut}</span>
                  <span className="text-white/60 text-sm">of {trustStats.maxSlots}</span>
                  <span className="text-[#00F6FF] text-sm font-medium">({availableSlots} open)</span>
                </div>
                <p className="text-xs text-white/70">Your professional trust circle</p>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-[#00F6FF] to-cyan-400 h-1.5 rounded-full transition-all" 
                  style={{ width: `${(trustStats.allocatedOut / trustStats.maxSlots) * 100}%` }}
                />
              </div>
              
              {/* Completion Status */}
              <div className="text-xs text-white/60">
                {availableSlots === 0 ? (
                  <span className="text-[#00F6FF]">🎉 Circle Complete!</span>
                ) : (
                  <span>Fill {availableSlots} more to unlock premium features</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Compelling Completion CTA */}
      {availableSlots > 0 && (
        <Card className="bg-gradient-to-r from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30 hover:border-[#00F6FF]/50 cursor-pointer transition-all duration-300 hover:scale-[1.02]" onClick={() => {
          console.log('🚀 Complete Circle clicked')
          toast.success('Let\'s complete your circle!', {
            description: `Add ${availableSlots} more trusted connections`,
            duration: 3000
          })
        }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00F6FF]/20 flex items-center justify-center border border-[#00F6FF]/30">
                <span className="text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Complete Your Circle
                  <Badge className="bg-[#00F6FF]/20 text-[#00F6FF] text-xs px-2 py-0.5">
                    {availableSlots} left
                  </Badge>
                </h3>
                <p className="text-sm text-white/80 mb-2">Unlock exclusive network benefits & premium features</p>
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <span>✨ Priority support</span>
                  <span>🔗 Advanced networking</span>
                  <span>📊 Analytics dashboard</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#00F6FF] font-medium mb-1">Next Level</div>
                <div className="text-2xl font-bold text-white">{Math.round((trustStats.allocatedOut / trustStats.maxSlots) * 100)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}