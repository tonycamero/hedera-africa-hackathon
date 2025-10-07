"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Settings } from "lucide-react"

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Circle of Trust Header with Visualization */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-medium text-white mb-6 tracking-tight">
          Your Circle of Trust
        </h1>
        
        {/* Trust Circle Visualization Card */}
        <Card className="backdrop-blur-md bg-white/5 border border-white/10 mx-auto max-w-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-center gap-6">
              <TrustCircleVisualization 
                allocatedOut={trustStats.allocatedOut}
                maxSlots={trustStats.maxSlots}
                bondedContacts={trustStats.bondedContacts}
              />
              
              <div className="text-left">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {trustStats.allocatedOut}
                  </span>
                  <span className="text-lg text-white/60">/ {trustStats.maxSlots}</span>
                </div>
                <p className="text-[#00F6FF] font-medium mb-3">Connections</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span className="text-sm text-white/80">{trustStats.bondedContacts} bonded contacts</span>
                  </div>
                  {availableSlots > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 opacity-60"></div>
                      <span className="text-sm text-white/60">{availableSlots} open slots</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Action Buttons */}
      <div className="flex justify-center gap-3 sm:gap-4">
        <Button 
          className="bg-transparent border border-[#00F6FF] text-[#00F6FF] hover:bg-[#00F6FF]/10 px-4 sm:px-6"
          onClick={() => {
            console.log('📡 Allocate Trust clicked')
            toast.success('Trust allocation started', { description: 'Select contacts to allocate trust' })
          }}
        >
          <Users className="w-4 h-4 mr-2" />
          Allocate Trust
        </Button>
        
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 px-4 sm:px-6"
          onClick={() => {
            console.log('🔄 Navigate to contacts')
            router.push('/contacts')
          }}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
        
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 px-3 sm:px-4"
          onClick={() => {
            console.log('⚙️ Settings clicked')
            toast.info('Circle settings', { description: 'Configure trust allocation rules' })
          }}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Professional Network Members */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-white text-center mb-4">Network Members</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            { name: 'Sarah Johnson', role: 'Senior Partner', company: 'Tech Ventures', trust: 85, status: 'active' },
            { name: 'Michael Chen', role: 'CTO', company: 'DataFlow Inc', trust: 92, status: 'active' },
            { name: 'Emma Rodriguez', role: 'Director', company: 'Innovation Lab', trust: 78, status: 'pending' }
          ].map((member, index) => (
            <Card key={index} className="backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => handleMemberClick(`tm-${member.name.toLowerCase().replace(' ', '-')}`)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#00F6FF] bg-[#00F6FF]/20 flex items-center justify-center text-white font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{member.name}</h3>
                    <p className="text-sm text-white/60">{member.role} at {member.company}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-[#00F6FF] font-medium">Trust: {member.trust}%</div>
                      <Badge className={`text-xs ${
                        member.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            className="text-white/40 hover:text-[#00F6FF] hover:bg-[#00F6FF]/10 text-sm"
            onClick={() => {
              console.log('🔍 View all members')
              router.push('/contacts')
            }}
          >
            View All Network Members →
          </Button>
        </div>
      </div>
    </div>
  )
}