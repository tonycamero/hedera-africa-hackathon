"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getRecentSignalsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"
import { 
  Activity, 
  Users, 
  Heart, 
  UserPlus, 
  AlertCircle,
  Check,
  Clock,
  Coins,
  Zap,
  Trophy,
  Award,
  Star,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Gift
} from "lucide-react"
import { toast } from "sonner"

// Mock achievement data - in real app would come from recognition system
const mockAchievements = [
  { 
    id: "eco-helper", 
    name: "Eco Helper", 
    emoji: "🌱", 
    rarity: "rare", 
    xp: 20, 
    description: "Helped organize community cleanup",
    earnedAt: Date.now() - 86400000,
    category: "community"
  },
  { 
    id: "trust-builder", 
    name: "Trust Builder", 
    emoji: "🤝", 
    rarity: "common", 
    xp: 10, 
    description: "Connected 5+ people in your network",
    earnedAt: Date.now() - 172800000,
    category: "social"
  },
  { 
    id: "early-adopter", 
    name: "Early Adopter", 
    emoji: "🚀", 
    rarity: "epic", 
    xp: 50, 
    description: "One of the first 100 TrustMesh users",
    earnedAt: Date.now() - 259200000,
    category: "special"
  }
]

const mockChallenges = [
  {
    id: "weekly-connect",
    name: "Weekly Connector",
    emoji: "🔗",
    progress: 3,
    target: 5,
    reward: 15,
    description: "Connect with 5 new people this week",
    timeLeft: "4 days"
  },
  {
    id: "trust-circle",
    name: "Circle Master",
    emoji: "🔄",
    progress: 6,
    target: 9,
    reward: 25,
    description: "Fill your complete Circle of Trust",
    timeLeft: "No limit"
  }
]

const getRarityStyles = (rarity: string) => {
  const styles = {
    common: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700" },
    rare: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
    epic: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
    legendary: { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-700" }
  }
  return styles[rarity as keyof typeof styles] || styles.common
}

export default function SignalsPageV1() {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [sessionId, setSessionId] = useState("")
  const [selectedTab, setSelectedTab] = useState<"signals" | "achievements">("signals")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSignals = () => {
      try {
        const currentSessionId = getSessionId()
        const effectiveSessionId = currentSessionId || 'tm-alex-chen'
        setSessionId(effectiveSessionId)
        
        const allEvents = signalsStore.getAll()
        const recentSignals = getRecentSignalsFromHCS(allEvents, effectiveSessionId, 50)
        
        setSignals(recentSignals)
        setLoading(false)
        
        console.log('✅ [SignalsPage] Loaded signals:', recentSignals.length)
      } catch (error) {
        console.error('❌ [SignalsPage] Failed to load signals:', error)
        setLoading(false)
      }
    }

    loadSignals()
    
    // Subscribe to updates
    const unsubscribe = signalsStore.subscribe(() => {
      console.log('📡 [SignalsPage] SignalsStore updated, refreshing...')
      loadSignals()
    })
    
    return unsubscribe
  }, [])

  const handleClaimReward = (challengeId: string) => {
    toast.success("🎉 Challenge completed!", {
      description: "Reward added to your profile",
      duration: 3000,
    })
  }

  const totalXP = mockAchievements.reduce((sum, achievement) => sum + achievement.xp, 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Professional Header */}
      <div className="text-center">
        <h1 className="text-3xl font-medium text-white mb-2 tracking-tight">
          Signals & Achievements
        </h1>
      </div>

      {/* Professional Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTab("signals")}
            className={`px-8 py-3 rounded-lg transition-all duration-300 ${
              selectedTab === "signals" 
                ? "bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30" 
                : "text-white/60 hover:text-white/90"
            }`}
          >
            Signals
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTab("achievements")}
            className={`px-8 py-3 rounded-lg transition-all duration-300 ${
              selectedTab === "achievements" 
                ? "bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30" 
                : "text-white/60 hover:text-white/90"
            }`}
          >
            Achievements
          </Button>
        </div>
      </div>

      {/* Signals Tab - Vertical Feed */}
      {selectedTab === "signals" && (
        <div className="space-y-4">
          {signals.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p className="text-white/60">No signals yet</p>
              <p className="text-white/40 text-sm">Activity will appear here when you connect with others</p>
            </div>
          ) : (
            signals.slice(0, 10).map((signal) => {
              const getSignalIcon = () => {
                if (signal.class === 'contact') return <Users className="w-4 h-4" />
                if (signal.class === 'trust') return <Heart className="w-4 h-4" />
                return <Activity className="w-4 h-4" />
              }
              
              const getSignalColor = () => {
                if (signal.class === 'contact') return 'text-blue-400'
                if (signal.class === 'trust') return 'text-green-400'
                return 'text-purple-400'
              }
              
              return (
                <div key={signal.id} className="flex items-start gap-4 py-4 px-6 backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl hover:border-[#00F6FF]/30 transition-all duration-300">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${getSignalColor()} border-current bg-current/20`}>
                    {getSignalIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">
                        {signal.type === 'CONTACT_REQUEST' && 'Contact request sent'}
                        {signal.type === 'CONTACT_ACCEPT' && 'Contact bonded'}
                        {signal.type === 'TRUST_ALLOCATE' && 'Trust allocated'}
                        {!['CONTACT_REQUEST', 'CONTACT_ACCEPT', 'TRUST_ALLOCATE'].includes(signal.type) && 
                          signal.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
                        }
                      </p>
                      <span className="text-xs text-white/50">
                        {new Date(signal.ts).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      {signal.class === 'contact' && 'Academic Signal'}
                      {signal.class === 'trust' && 'Social Signal'}
                      {signal.class === 'recognition' && 'Professional Signal'}
                      {!['contact', 'trust', 'recognition'].includes(signal.class || '') && 'Network Signal'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Achievements Tab - Collections */}
      {selectedTab === "achievements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAchievements.map((achievement) => {
            const getCategoryColor = () => {
              if (achievement.category === 'community') return 'border-green-400/30 bg-green-400/10'
              if (achievement.category === 'social') return 'border-blue-400/30 bg-blue-400/10'
              if (achievement.category === 'special') return 'border-purple-400/30 bg-purple-400/10'
              return 'border-white/20 bg-white/5'
            }
            
            return (
              <div
                key={achievement.id}
                className={`backdrop-blur-sm border rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer ${getCategoryColor()}`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{achievement.emoji}</div>
                  <h3 className="font-medium text-white mb-2">{achievement.name}</h3>
                  <p className="text-sm text-white/60 mb-4">{achievement.description}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-full border ${
                      achievement.category === 'community' ? 'border-green-400/50 text-green-400' :
                      achievement.category === 'social' ? 'border-blue-400/50 text-blue-400' :
                      achievement.category === 'special' ? 'border-purple-400/50 text-purple-400' :
                      'border-white/30 text-white/60'
                    } capitalize`}>
                      {achievement.category}
                    </span>
                    <span className="text-white/50">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}