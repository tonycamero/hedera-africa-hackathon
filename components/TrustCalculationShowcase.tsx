"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { enhancedHCSDataService } from '@/lib/services/EnhancedHCSDataService'
import { getSessionId } from '@/lib/session'
import { 
  Users, 
  Heart, 
  Award, 
  Clock,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react'

interface TrustBreakdown {
  contactTrust: number
  trustAllocation: number
  recognition: number
  total: number
  hcsTimestamp?: string
  consensusProof: boolean
}

interface ContactTrustData {
  peerId: string
  name: string
  role: string
  company: string
  country?: string
  trustBreakdown: TrustBreakdown
}

export function TrustCalculationShowcase() {
  const [contacts, setContacts] = useState<ContactTrustData[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const currentSessionId = getSessionId() || 'tm-alex-chen'
        setSessionId(currentSessionId)
        
        const enhancedContacts = await enhancedHCSDataService.getEnhancedContacts(currentSessionId)
        const trustAllocations = await enhancedHCSDataService.getEnhancedTrustAllocations(currentSessionId)
        const achievements = await enhancedHCSDataService.getEnhancedAchievements(currentSessionId)
        
        // Calculate trust breakdown for each contact
        const trustData: ContactTrustData[] = enhancedContacts.slice(0, 6).map(contact => {
          // Contact trust: 0.1 if bonded
          const contactTrust = contact.status === 'bonded' ? 0.1 : 0
          
          // Trust allocation: 2.7 if allocated
          const allocation = trustAllocations.find(t => t.subject === contact.id)
          const trustAllocation = allocation ? 2.7 : 0
          
          // Recognition trust: variable up to 0.05
          const contactAchievements = achievements.filter(a => 
            a.metadata?.from === contact.id || a.metadata?.to === contact.id
          )
          const recognition = Math.min(0.05, contactAchievements.length * 0.01)
          
          const total = contactTrust + trustAllocation + recognition
          
          return {
            peerId: contact.id,
            name: contact.name,
            role: contact.role || 'Community Member',
            company: contact.company || 'Ubuntu Network',
            country: getAfricanCountry(contact.name),
            trustBreakdown: {
              contactTrust,
              trustAllocation,
              recognition,
              total,
              hcsTimestamp: contact.hcsTimestamp || allocation?.hcsTimestamp,
              consensusProof: !!(contact.hcsTimestamp || allocation?.hcsTimestamp)
            }
          }
        })
        
        // Sort by total trust score descending
        trustData.sort((a, b) => b.trustBreakdown.total - a.trustBreakdown.total)
        
        setContacts(trustData)
      } catch (error) {
        console.error('[TrustCalculationShowcase] Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getAfricanCountry = (name: string): string => {
    const countryMap: Record<string, string> = {
      'Amara': '🇳🇬 Nigeria',
      'Kofi': '🇬🇭 Ghana', 
      'Zara': '🇰🇪 Kenya',
      'Fatima': '🇲🇦 Morocco',
      'Kwame': '🇿🇦 South Africa',
      'Aisha': '🇸🇳 Senegal',
      'Boma': '🇳🇬 Nigeria',
      'Sekai': '🇿🇼 Zimbabwe',
      'Abena': '🇬🇭 Ghana',
      'Omar': '🇪🇬 Egypt'
    }
    
    const firstName = name.split(' ')[0]
    return countryMap[firstName] || '🌍 Africa'
  }

  const formatConsensusTime = (timestamp?: string) => {
    if (!timestamp) return 'Processing...'
    try {
      const date = new Date(parseFloat(timestamp) * 1000)
      return date.toLocaleString()
    } catch {
      return timestamp.substring(0, 16) + '...'
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00F6FF]" />
            Trust Calculation Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00F6FF]"></div>
            <span className="ml-3 text-white/60">Loading real HCS trust data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-[#00F6FF]/10 to-purple-600/10 border-[#00F6FF]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="w-6 h-6 text-[#00F6FF]" />
            Live Trust Calculation Engine
            <Badge className="bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/50">
              Hedera HCS Powered
            </Badge>
          </CardTitle>
          <p className="text-white/70 text-sm">
            Real-time trust scores computed from Hedera Consensus Service data • Ubuntu philosophy meets blockchain
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <Users className="w-6 h-6 mx-auto mb-1 text-blue-400" />
              <div className="text-lg font-semibold text-white">Contact</div>
              <div className="text-sm text-white/60">0.1 trust</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <Heart className="w-6 h-6 mx-auto mb-1 text-red-400" />
              <div className="text-lg font-semibold text-white">Trust</div>
              <div className="text-sm text-white/60">2.7 trust</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <Award className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
              <div className="text-lg font-semibold text-white">Recognition</div>
              <div className="text-sm text-white/60">≤0.05 trust</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Calculations */}
      <div className="grid gap-4">
        {contacts.map((contact, index) => (
          <Card key={contact.peerId} className="bg-white/5 border-white/10 hover:border-[#00F6FF]/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-purple-600/20 border border-[#00F6FF]/30 flex items-center justify-center">
                      <span className="text-[#00F6FF] font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{contact.name}</h3>
                      <p className="text-white/60 text-sm">{contact.role} • {contact.company}</p>
                      <p className="text-white/50 text-xs">{contact.country}</p>
                    </div>
                  </div>
                  
                  {contact.trustBreakdown.consensusProof && (
                    <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>HCS Consensus: {formatConsensusTime(contact.trustBreakdown.hcsTimestamp)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#00F6FF] mb-1">
                    {contact.trustBreakdown.total.toFixed(1)}
                  </div>
                  <div className="text-xs text-white/60">Total Trust</div>
                  <Progress 
                    value={(contact.trustBreakdown.total / 3.3) * 100} 
                    className="w-24 h-2 mt-2"
                  />
                </div>
              </div>
              
              {/* Trust Breakdown */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <Users className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <div className="font-semibold text-blue-300">Contact</div>
                  <div className="text-xl font-bold text-white">
                    {contact.trustBreakdown.contactTrust.toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-300/70">
                    {contact.trustBreakdown.contactTrust > 0 ? 'Bonded' : 'Not Connected'}
                  </div>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <Heart className="w-4 h-4 mx-auto mb-1 text-red-400" />
                  <div className="font-semibold text-red-300">Trust</div>
                  <div className="text-xl font-bold text-white">
                    {contact.trustBreakdown.trustAllocation.toFixed(1)}
                  </div>
                  <div className="text-xs text-red-300/70">
                    {contact.trustBreakdown.trustAllocation > 0 ? 'Circle of 9' : 'No Allocation'}
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                  <Award className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                  <div className="font-semibold text-yellow-300">Recognition</div>
                  <div className="text-xl font-bold text-white">
                    {contact.trustBreakdown.recognition.toFixed(1)}
                  </div>
                  <div className="text-xs text-yellow-300/70">
                    Skills & Achievements
                  </div>
                </div>
              </div>
              
              {/* Ubuntu Context */}
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-300 text-sm">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">Ubuntu: "I am because we are"</span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Trust flows through community relationships • Powered by Hedera consensus
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Footer Stats */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="text-center text-white/60 text-sm">
            <div className="flex justify-center items-center gap-4">
              <span>🌍 African Trust Network</span>
              <span>•</span>
              <span>⚡ Real-time HCS calculations</span>
              <span>•</span>
              <span>🔗 {contacts.length} live connections</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}