"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { signalsStore, type SignalEvent } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Users, 
  Shield, 
  Activity,
  Zap,
  Trophy,
  Star,
  Sparkles,
  TrendingUp,
  Award,
  UserPlus,
  MessageSquare,
  ArrowUp,
  ChevronDown,
  Filter,
  Search,
  Flame,
  Clock,
  Coins,
  Send,
  Plus
} from "lucide-react"
import { toast } from "sonner"

interface SignalCardProps {
  signal: SignalEvent
  onLike: (id: string) => void
  onComment: (id: string) => void
  onShare: (id: string) => void
  onBookmark: (id: string) => void
  isLiked: boolean
  isBookmarked: boolean
  likes: number
  comments: number
}

const SignalCard = ({ signal, onLike, onComment, onShare, onBookmark, isLiked, isBookmarked, likes, comments }: SignalCardProps) => {
  
  const getSignalTypeInfo = (type: string) => {
    const typeMap = {
      'CONTACT_REQUEST': { 
        icon: UserPlus, 
        color: 'from-blue-500 to-purple-500', 
        title: 'Connection Request',
        description: 'wants to connect with you! 🤝',
        isNFT: false
      },
      'CONTACT_ACCEPT': { 
        icon: Users, 
        color: 'from-green-500 to-emerald-500', 
        title: 'Connection Accepted',
        description: 'accepted your connection! 🎉',
        isNFT: false
      },
      'TRUST_ALLOCATE': { 
        icon: Coins, 
        color: 'from-purple-500 to-pink-500', 
        title: 'Trust Allocated',
        description: 'sent you some trust tokens! ⚡',
        isNFT: false
      },
      'RECOGNITION_MINT': { 
        icon: Trophy, 
        color: 'from-yellow-500 to-orange-500', 
        title: 'Recognition NFT Earned',
        description: 'earned a recognition NFT! 🏆✨',
        isNFT: true
      },
      'PROFILE_UPDATE': { 
        icon: Sparkles, 
        color: 'from-indigo-500 to-purple-500', 
        title: 'Profile Updated',
        description: 'updated their profile! ✨',
        isNFT: false
      }
    }
    
    return typeMap[type as keyof typeof typeMap] || {
      icon: Activity,
      color: 'from-gray-500 to-slate-500',
      title: 'Network Activity',
      description: 'is active on the network! 📡',
      isNFT: false
    }
  }

  const typeInfo = getSignalTypeInfo(signal.type)
  const IconComponent = typeInfo.icon

  const getDisplayName = (actorId: string) => {
    if (actorId.startsWith('tm-') && actorId.length > 3) {
      const namepart = actorId.slice(3).replace(/-/g, ' ')
      return namepart.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
    return actorId.length > 20 ? `${actorId.slice(0, 8)}...${actorId.slice(-4)}` : actorId
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  const displayName = getDisplayName(signal.actor)
  const isOnline = Math.random() > 0.3 // Mock online status

  const handleSendSignal = () => {
    toast.success(`⚡ Signal sent to ${displayName}!`, {
      description: "Your signal is on its way"
    })
  }

  const handleSendTrust = () => {
    toast.success(`💰 $TRST sent to ${displayName}!`, {
      description: "Trust tokens transferred successfully"
    })
  }

  const handleSendMessage = () => {
    toast.info(`💬 Message to ${displayName}`, {
      description: "Opening chat window..."
    })
  }

  return (
    // Horizontal landscape card - taller to accommodate vertical buttons
    <div className="relative w-full h-40 bg-gradient-to-r from-slate-900/95 to-slate-800/95 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl group hover:border-[#00F6FF]/40 transition-all duration-300 hover:scale-[1.02]">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00F6FF]/20 via-transparent to-purple-500/20" />
      </div>

      {/* 1:2 Grid Layout */}
      <div className="relative z-10 h-full flex">
        
        {/* Left side (1) - Token/Icon OR NFT Card */}
        <div className="w-32 flex-shrink-0 flex items-center justify-center">
          {typeInfo.isNFT ? (
            /* NFT Card for Recognition Tokens */
            <div className="w-28 h-28 rounded-xl overflow-hidden shadow-2xl group-hover:scale-110 transition-transform duration-300 relative border-2 border-yellow-400/50">
              {/* NFT Background with gradient and pattern */}
              <div className={`absolute inset-0 bg-gradient-to-br ${typeInfo.color}`} />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                  backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpolygon points=\"10,0 20,10 10,20 0,10\"/%3E%3C/g%3E%3C/svg%3E')"
                }} />
              </div>
              
              {/* NFT Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                {/* NFT Icon */}
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2 backdrop-blur-sm">
                  <IconComponent className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                
                {/* NFT Label */}
                <div className="text-center">
                  <div className="text-white text-xs font-bold drop-shadow-lg">
                    {signal.metadata?.nftName || 'Recognition'}
                  </div>
                  <div className="text-white/80 text-[10px] font-medium">
                    #{signal.metadata?.tokenId || Math.floor(Math.random() * 9999).toString().padStart(4, '0')}
                  </div>
                </div>
              </div>
              
              {/* NFT Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform rotate-45 translate-x-full group-hover:translate-x-[-100%] transition-transform duration-1000" />
              
              {/* Online status indicator for NFT */}
              {isOnline && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-yellow-400 animate-pulse" />
              )}
              
              {/* NFT Badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                <Sparkles className="w-3 h-3 text-slate-900" />
              </div>
            </div>
          ) : (
            /* Regular Token/Icon */
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${typeInfo.color} p-4 shadow-xl group-hover:scale-110 transition-transform duration-300 relative`}>
              <IconComponent className="w-full h-full text-white drop-shadow-lg" />
              {/* Online status indicator */}
              {isOnline && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Right side (2) - Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          
          {/* Top row - Name and time */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-base">{displayName}</h3>
              {isOnline && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-white/40 text-xs">{formatTimeAgo(signal.ts)}</span>
          </div>

          {/* Content description */}
          <div className="mb-2 flex-1">
            <p className="text-white/80 text-sm">
              {displayName} {typeInfo.description}
            </p>
            
            {/* NFT Metadata */}
            {typeInfo.isNFT && (
              <div className="mt-2 space-y-1">
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30 text-xs px-2 py-0.5">
                    ✨ NFT
                  </Badge>
                  {signal.metadata?.rarity && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs px-2 py-0.5">
                      {signal.metadata.rarity}
                    </Badge>
                  )}
                  {signal.metadata?.category && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30 text-xs px-2 py-0.5">
                      {signal.metadata.category}
                    </Badge>
                  )}
                </div>
                
                {signal.metadata?.nftDescription && (
                  <p className="text-white/60 text-xs italic">
                    "{signal.metadata.nftDescription}"
                  </p>
                )}
                
                {/* NFT Properties */}
                {signal.metadata?.properties && (
                  <div className="flex gap-1 text-xs">
                    {Object.entries(signal.metadata.properties).slice(0, 2).map(([key, value]) => (
                      <span key={key} className="text-white/50">
                        {key}: <span className="text-white/70">{value as string}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom row - Actions and engagement */}
          <div className="flex items-center justify-between">
            
            {/* Action buttons - Vertical Stack */}
            <div className="flex flex-col gap-0.5">
              {typeInfo.isNFT ? (
                /* NFT-specific actions */
                <>
                  <Button 
                    size="sm" 
                    onClick={() => toast.success("🎆 NFT viewed!", { description: "Opening NFT details..." })}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => toast.info("🔥 Burn for $TRST!", { description: "Convert NFT to trust tokens" })}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Flame className="w-3 h-3 mr-1" />
                    Burn
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Congrats
                  </Button>
                </>
              ) : (
                /* Regular signal actions */
                <>
                  <Button 
                    size="sm" 
                    onClick={handleSendSignal}
                    className="bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Signal
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendTrust}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Coins className="w-3 h-3 mr-1" />
                    $TRST
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-xs px-1 py-0.5 h-5 w-14"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </>
              )}
            </div>

            {/* Engagement buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onLike(signal.id || '')}
                className="flex items-center gap-1 group"
              >
                <div className={`p-1 rounded-full transition-all duration-200 ${
                  isLiked 
                    ? 'text-red-400' 
                    : 'text-white/40 hover:text-red-400'
                }`}>
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-white/40 text-xs">{likes}</span>
              </button>

              <button
                onClick={() => onComment(signal.id || '')}
                className="flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4 text-white/40 hover:text-blue-400 transition-colors" />
                <span className="text-white/40 text-xs">{comments}</span>
              </button>

              <button onClick={() => onBookmark(signal.id || '')}>
                <Bookmark className={`w-4 h-4 transition-colors ${
                  isBookmarked ? 'text-yellow-400 fill-current' : 'text-white/40 hover:text-yellow-400'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F6FF]/20 via-transparent to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm" />
    </div>
  )
}

interface StunningSignalsFeedProps {
  className?: string
}

export default function StunningSignalsFeed({ className = "" }: StunningSignalsFeedProps) {
  const [signals, setSignals] = useState<SignalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'signals' | 'recognition'>('signals')
  const [filter, setFilter] = useState<'all' | 'connections' | 'trust' | 'achievements'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedSignals, setLikedSignals] = useState<Set<string>>(new Set())
  const [bookmarkedSignals, setBookmarkedSignals] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadSignals = () => {
      try {
        const sessionId = getSessionId()
        
        // Add some sample NFT recognition events if store is empty or has few signals
        const existingEvents = signalsStore.getAll()
        const nftEvents = existingEvents.filter(s => s.type === 'RECOGNITION_MINT')
        
        if (nftEvents.length < 3) {
          // Create sample NFT recognition events
          const sampleNFTs = [
            {
              id: `nft_${Date.now()}_1`,
              type: 'RECOGNITION_MINT',
              actor: 'tm-alice-cooper',
              target: sessionId,
              ts: Date.now() - 1000 * 60 * 30, // 30 minutes ago
              topicId: '0.0.12345',
              source: 'hcs' as const,
              metadata: {
                nftName: 'TSG Feedback Champion',
                tokenId: '1337',
                nftDescription: 'Earned for providing exceptional feedback to the Trust Signal Graph',
                rarity: 'Rare',
                category: 'Feedback',
                properties: {
                  'Level': 'Expert',
                  'Type': 'Community',
                  'Reward': '50 TRST'
                }
              }
            },
            {
              id: `nft_${Date.now()}_2`,
              type: 'RECOGNITION_MINT',
              actor: 'tm-bob-builder',
              target: sessionId,
              ts: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
              topicId: '0.0.12346',
              source: 'hcs' as const,
              metadata: {
                nftName: 'Network Pioneer',
                tokenId: '0420',
                nftDescription: 'First 100 users to join the TrustMesh network',
                rarity: 'Legendary',
                category: 'Achievement',
                properties: {
                  'Tier': 'Genesis',
                  'Batch': '1',
                  'Bonus': '100 TRST'
                }
              }
            },
            {
              id: `nft_${Date.now()}_3`,
              type: 'RECOGNITION_MINT',
              actor: 'tm-carol-cryptos',
              target: sessionId,
              ts: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
              topicId: '0.0.12347',
              source: 'hcs' as const,
              metadata: {
                nftName: 'Referral Master',
                tokenId: '2024',
                nftDescription: 'Successfully referred 5+ new members to the network',
                rarity: 'Epic',
                category: 'Social',
                properties: {
                  'Referrals': '7',
                  'Status': 'Active',
                  'Multiplier': '1.5x'
                }
              }
            }
          ]
          
          // Add the sample NFTs to the store
          sampleNFTs.forEach(nft => signalsStore.add(nft))
          console.log(`[StunningSignalsFeed] Added ${sampleNFTs.length} sample NFT events`)
        }
        
        const allEvents = signalsStore.getAll()
        
        // Get recent signals and add mock engagement data
        const recentSignals = allEvents.slice(0, 20).map(signal => ({
          ...signal,
          likes: Math.floor(Math.random() * 50) + 5,
          comments: Math.floor(Math.random() * 20) + 1
        }))
        
        setSignals(recentSignals)
        setLoading(false)
        
        console.log(`[StunningSignalsFeed] Loaded ${recentSignals.length} signals`)
      } catch (error) {
        console.error('[StunningSignalsFeed] Failed to load signals:', error)
        setLoading(false)
      }
    }

    loadSignals()

    // Subscribe to updates
    const unsubscribe = signalsStore.subscribe(loadSignals)
    return unsubscribe
  }, [])

  // Filter signals
  const filteredSignals = signals.filter(signal => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!signal.type.toLowerCase().includes(query) && 
          !signal.actor.toLowerCase().includes(query)) {
        return false
      }
    }

    if (filter === 'connections') {
      return signal.type.includes('CONTACT')
    } else if (filter === 'trust') {
      return signal.type.includes('TRUST')
    } else if (filter === 'achievements') {
      return signal.type.includes('RECOGNITION')
    }

    return true
  })

  const handleLike = (signalId: string) => {
    const newLiked = new Set(likedSignals)
    if (newLiked.has(signalId)) {
      newLiked.delete(signalId)
      toast.success("❤️ Liked removed!")
    } else {
      newLiked.add(signalId)
      toast.success("❤️ Signal liked!", {
        description: "Added to your liked signals",
      })
    }
    setLikedSignals(newLiked)
  }

  const handleComment = (signalId: string) => {
    toast.info("💬 Comments coming soon!", {
      description: "This feature will be available in the next update",
    })
  }

  const handleShare = (signalId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/signals/${signalId}`)
    toast.success("🔗 Link copied!", {
      description: "Signal link copied to clipboard",
    })
  }

  const handleBookmark = (signalId: string) => {
    const newBookmarked = new Set(bookmarkedSignals)
    if (newBookmarked.has(signalId)) {
      newBookmarked.delete(signalId)
      toast.success("🔖 Bookmark removed!")
    } else {
      newBookmarked.add(signalId)
      toast.success("🔖 Signal bookmarked!", {
        description: "Added to your saved signals",
      })
    }
    setBookmarkedSignals(newBookmarked)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-spin">
            <div className="w-full h-full rounded-full border-4 border-white/20 border-t-[#00F6FF] animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-white/80 text-lg font-medium">Loading Signals</p>
            <p className="text-white/50 text-sm">Fetching the latest network activity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen ${className}`}>
      
      {/* Header with tabs and actions */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
        
        {/* Page Title */}
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Network Signals</h1>
          <p className="text-white/60 text-sm">Stay connected with your professional network</p>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-white/20 text-white placeholder-white/40 focus:border-[#00F6FF]/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex bg-slate-800/80 backdrop-blur-xl rounded-xl p-1">
            {[
              { key: 'signals', label: 'Signals', icon: Zap },
              { key: 'recognition', label: 'Recognition', icon: Trophy }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === key
                    ? 'bg-[#00F6FF] text-slate-900 shadow-lg'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => toast.success("⚡ Signal broadcast!", { description: "Your signal is out there!" })}
              className="bg-[#00F6FF]/20 hover:bg-[#00F6FF]/30 text-[#00F6FF] border border-[#00F6FF]/30"
            >
              <Zap className="w-4 h-4 mr-2" />
              Send Signal
            </Button>
            <Button 
              size="sm"
              onClick={() => toast.success("💰 $TRST ready!", { description: "Select a recipient to send trust tokens" })}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
            >
              <Coins className="w-4 h-4 mr-2" />
              Send $TRST
            </Button>
            <Button 
              size="sm"
              onClick={() => toast.info("💬 Messages", { description: "Opening message center..." })}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
            >
              <Send className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="px-6 py-6">
        
        {/* Signals Tab Content */}
        {activeTab === 'signals' && (
          <>
            {/* Filter Pills */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { key: 'all', label: 'All', icon: Activity },
                { key: 'connections', label: 'Connections', icon: Users },
                { key: 'trust', label: 'Trust', icon: Shield },
                { key: 'achievements', label: 'Achievements', icon: Trophy }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                    filter === key
                      ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
                      : 'bg-slate-800 text-white/60 hover:text-white/80 hover:bg-slate-700 border border-white/10'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Signals Feed */}
            <div className="space-y-4">
              {filteredSignals.length === 0 ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-white/30" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-white/80 text-lg font-medium">No signals found</h3>
                      <p className="text-white/50">Try adjusting your search or filters</p>
                    </div>
                  </div>
                </div>
              ) : (
                filteredSignals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                    isLiked={likedSignals.has(signal.id || '')}
                    isBookmarked={bookmarkedSignals.has(signal.id || '')}
                    likes={signal.likes || 0}
                    comments={signal.comments || 0}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Recognition Tab Content */}
        {activeTab === 'recognition' && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white/80 text-lg font-medium">Recognition Coming Soon</h3>
                <p className="text-white/50">Achievement and recognition features will be available soon!</p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}