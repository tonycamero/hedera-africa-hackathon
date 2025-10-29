'use client'

import { useEffect, useState } from 'react'
import { signalsStore } from '@/lib/stores/signalsStore'
import { getBondedContactsFromHCS, getTrustLevelsPerContact } from '@/lib/services/HCSDataUtils'
import { GenZButton, GenZCard, GenZHeading, GenZText } from '@/components/ui/genz-design-system'
import { Trophy, Shield, Target, Flame, Crown, Gamepad2, UserPlus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PublicProfileProps {
  params: { userId: string }
}

export default function PublicProfilePage({ params }: PublicProfileProps) {
  const [loading, setLoading] = useState(true)
  const [profileStats, setProfileStats] = useState({
    friends: 0,
    propsSent: 0,
    propsReceived: 0,
    recognitions: 0
  })
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        
        // Get all signals and compute stats for this user
        const allEvents = signalsStore.getAll()
        const contacts = getBondedContactsFromHCS(allEvents, params.userId)
        const trustData = getTrustLevelsPerContact(allEvents, params.userId)
        
        // Calculate stats
        const propsSent = Array.from(trustData.values()).reduce((sum, trust) => sum + trust.allocatedTo, 0)
        const propsReceived = Array.from(trustData.values()).reduce((sum, trust) => sum + trust.receivedFrom, 0)
        const recognitions = allEvents.filter(e => 
          e.type === 'RECOGNITION_MINT' && e.target === params.userId
        ).length

        setProfileStats({
          friends: contacts.length,
          propsSent,
          propsReceived,
          recognitions
        })

        // Set display name
        const cleanUserId = params.userId.replace('tm-', '')
        setDisplayName(cleanUserId === 'alex-chen' ? 'Alex Chen' : `User ${cleanUserId}`)

      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [params.userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">⚡</div>
          <GenZText dim>Loading profile...</GenZText>
        </div>
      </div>
    )
  }

  // Calculate level and achievements
  const totalScore = profileStats.propsSent + profileStats.propsReceived + profileStats.recognitions * 5
  const level = Math.floor(totalScore / 50) + 1
  const xpToNext = (level * 50) - totalScore
  const xpProgress = ((totalScore % 50) / 50) * 100
  
  // Achievement badges based on stats
  const achievements = []
  if (profileStats.friends >= 10) achievements.push({ icon: '👥', name: 'Networker', desc: '10+ connections' })
  if (profileStats.propsSent >= 25) achievements.push({ icon: '⚡', name: 'Signal Master', desc: '25+ props sent' })
  if (profileStats.recognitions >= 5) achievements.push({ icon: '🏆', name: 'Recognized', desc: '5+ recognitions' })
  if (profileStats.propsReceived >= 20) achievements.push({ icon: '🌟', name: 'Popular', desc: '20+ props received' })
  if (level >= 5) achievements.push({ icon: '👑', name: 'Elite', desc: 'Level 5+ player' })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Gamer Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-500/10" />
          <div className="relative">
            {/* Level Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              LVL {level}
            </div>
            
            {/* Avatar & Info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 via-cyan-400 to-yellow-400 rounded-full flex items-center justify-center border-2 border-white/30">
                <Gamepad2 className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {displayName}
                </h1>
                <div className="text-purple-200 text-sm mb-2">
                  @{params.userId.replace('tm-', '')}
                </div>
                <div className="text-xs text-purple-300">
                  Trust Score: {totalScore} • XP to next level: {xpToNext}
                </div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Level {level}</span>
                <span>Level {level + 1}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gaming Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Player Stats
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {profileStats.friends}
              </div>
              <div className="text-xs text-white/60">Network Size</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {profileStats.propsSent}
              </div>
              <div className="text-xs text-white/60">Props Sent</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {profileStats.propsReceived}
              </div>
              <div className="text-xs text-white/60">Props Earned</div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Crown className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {profileStats.recognitions}
              </div>
              <div className="text-xs text-white/60">Achievements</div>
            </div>
          </div>
        </div>
        
        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Unlocked Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement, i) => (
                <div key={i} className="bg-gradient-to-r from-purple-500/20 to-purple-500/20 rounded-lg p-3 border border-white/20">
                  <div className="text-2xl mb-1 text-center">{achievement.icon}</div>
                  <div className="text-white text-xs font-bold text-center">{achievement.name}</div>
                  <div className="text-white/60 text-xs text-center">{achievement.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join The Game CTA */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-500/10" />
          <div className="relative text-center">
            <div className="text-4xl mb-3">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Join The Game
            </h2>
            <p className="text-white/80 mb-6">
              Level up your trust, earn recognition, dominate the leaderboards
            </p>
            
            <Link href="/">
              <button className="w-full bg-gradient-to-r from-purple-500 to-purple-500 hover:from-purple-400 hover:to-purple-400 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" />
                Start Playing
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* About The Game */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            How to Play TrustMesh
          </h3>
          <p className="text-white/70 text-sm">
            The blockchain social RPG where trust is your currency. Build connections, send props, earn recognition, and level up your reputation on-chain. Every interaction counts towards your Trust Score!
          </p>
        </div>
      </div>
    </div>
  )
}