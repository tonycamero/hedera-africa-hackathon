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
  const [selectedTab, setSelectedTab] = useState<"earned" | "challenges">("earned")
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
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      {/* Header with XP Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏆 Signals & Achievements
            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
          </h1>
          <div className="flex items-center gap-4 text-sm mt-1">
            <span className="text-muted-foreground">{mockAchievements.length} earned</span>
            <span className="text-yellow-600">•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-600" />
              <span className="text-muted-foreground">{totalXP} XP total</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-600">{totalXP}</div>
          <div className="text-xs text-muted-foreground">Experience Points</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <Button
          variant={selectedTab === "earned" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("earned")}
          className="flex-1"
        >
          <Trophy className="w-4 h-4 mr-1" />
          Earned ({mockAchievements.length})
        </Button>
        <Button
          variant={selectedTab === "challenges" ? "default" : "ghost"}
          size="sm"
          onClick={() => setSelectedTab("challenges")}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-1" />
          Challenges ({mockChallenges.length})
        </Button>
      </div>

      {/* Earned Achievements Gallery */}
      {selectedTab === "earned" && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Achievement Gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockAchievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium mb-1">No achievements yet!</p>
                <p className="text-sm">Complete challenges to earn your first signals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAchievements.map((achievement) => {
                  const rarityStyles = getRarityStyles(achievement.rarity)
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-xl border-2 ${rarityStyles.border} ${rarityStyles.bg} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl animate-bounce">
                          {achievement.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900">
                              {achievement.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-600" />
                              <span className="text-sm font-medium">+{achievement.xp}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <Badge
                              variant="secondary"
                              className={`${rarityStyles.text} capitalize`}
                            >
                              {achievement.rarity}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(achievement.earnedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Challenges */}
      {selectedTab === "challenges" && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Active Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockChallenges.map((challenge) => {
              const progressPercent = (challenge.progress / challenge.target) * 100
              const isCompleted = challenge.progress >= challenge.target
              
              return (
                <div
                  key={challenge.id}
                  className="p-4 border rounded-xl hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">{challenge.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium">{challenge.name}</h3>
                        <div className="flex items-center gap-1">
                          <Gift className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium">+{challenge.reward} XP</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{challenge.progress}/{challenge.target} completed</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {challenge.timeLeft}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={progressPercent} className="h-2" />
                    {isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimReward(challenge.id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        Claim Reward
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="text-center pt-4 border-t">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                View More Challenges
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here when you interact with others</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.slice(0, 5).map((signal) => (
                <div
                  key={signal.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {signal.class === 'contact' && <Users className="w-4 h-4 text-blue-600" />}
                    {signal.class === 'trust' && <Heart className="w-4 h-4 text-red-600" />}
                    {signal.class === 'recognition' && <Award className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {signal.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(signal.ts).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    {signal.status === 'onchain' ? '✓' : '⏳'}
                  </Badge>
                </div>
              ))}
              
              {signals.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View All Activity ({signals.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}