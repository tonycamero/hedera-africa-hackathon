"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
import { useTopicRegistry } from "@/lib/hooks/useTopicRegistry"
import { 
  MapPin, 
  Globe, 
  Github, 
  Twitter, 
  MessageCircle,
  Mail,
  Shield,
  Star,
  Calendar,
  Copy,
  ExternalLink,
  Link,
  Users,
  Award,
  Building,
  Tag,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  Crown,
  Send,
  Coins,
  Trophy,
  Gift,
  UserMinus
} from "lucide-react"
import { toast } from "sonner"

interface ProfileData {
  handle?: string
  displayName?: string
  fullName?: string
  bio?: string
  skills?: string[]
  location?: string
  avatar?: string
  website?: string
  github?: string
  twitter?: string
  discord?: string
  email?: string
  verified?: boolean
  reputation?: number
  joinedAt?: number
  visibility?: string
  onlineStatus?: 'online' | 'offline' | 'idle' | 'unknown'
  organization?: string
  category?: string[]
  source?: string
  contextDomain?: 'social' | 'academic' | 'professional'
  lastActiveAt?: number
  trustScore?: number
  connections?: number
  recognitionsReceived?: number
}

interface ProfileResponse {
  ok: boolean
  profile?: ProfileData
  error?: string
  hrl?: string
  source?: string
}

// Circle member IDs for checking membership
const CIRCLE_MEMBER_IDS = [
  'tm-alice-cooper', 'tm-bob-builder', 'tm-carol-cryptos', 
  'tm-dave-data', 'tm-eve-network', 'tm-frank-fintech'
]

export function ContactProfileSheet({ 
  peerId, 
  contactHandle,
  onClose 
}: { 
  peerId: string | null;
  contactHandle?: string;
  onClose: () => void 
}) {
  const topics = useTopicRegistry()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProfileData | null>(null)
  const [hrl, setHrl] = useState<string | null>(null)
  const [source, setSource] = useState<string>("") 
  const [basicDataLoaded, setBasicDataLoaded] = useState(false)
  
  // Check if this person is in the user's circle of trust
  const isInCircle = peerId ? CIRCLE_MEMBER_IDS.includes(peerId) : false

  useEffect(() => {
    if (!peerId) {
      setData(null)
      setHrl(null)
      setSource("")
      return
    }
    
    const loadProfileFromStore = () => {
      setLoading(true)
      setBasicDataLoaded(false)
      
      // Store-only approach - no HRL needed
      setHrl(null)
      
      // Get contact info from HCS events directly
      const currentSessionId = getSessionId()
      
      // Helper functions to extract actor/target from events (handles different schemas)
      const getActor = (e: any) => e?.actor ?? e?.actors?.from ?? e?.from ?? e?.payload?.from ?? e?.metadata?.from
      const getTarget = (e: any) => e?.target ?? e?.actors?.to ?? e?.to ?? e?.payload?.to ?? e?.metadata?.to
      
      // Find contact events for this peer using schema-tolerant field extraction
      const allEvents = signalsStore.getAll()
      console.log(`[ContactProfileSheet] Looking for peer ${peerId} in ${allEvents.length} events`)
      
      const peerEvents = allEvents.filter(event => {
        const actor = getActor(event)
        const target = getTarget(event) 
        const isMatch = event.type.includes('CONTACT') && 
                       (actor === peerId || target === peerId)
        if (isMatch) {
          console.log(`[ContactProfileSheet] Found event for ${peerId}:`, event)
        }
        return isMatch
      });
    
    console.log(`[ContactProfileSheet] Found ${peerEvents.length} events for peer ${peerId}`)
    
    // Extract comprehensive profile data from the contact events
    // Use contactHandle prop if provided (from server API), otherwise extract from events
    let handle = contactHandle || peerId;
    let displayName: string | undefined = contactHandle;
    let fullName: string | undefined = contactHandle;
    let bondedAt: number | undefined = undefined;
    let bonded = false;
    let organization: string | undefined = undefined;
    let category: string[] = [];
    let contextDomain: 'social' | 'academic' | 'professional' | undefined = undefined;
    let skills: string[] = [];
    let website: string | undefined = undefined;
    let github: string | undefined = undefined;
    let twitter: string | undefined = undefined;
    let discord: string | undefined = undefined;
    let email: string | undefined = undefined;
    let lastActiveAt = 0;
    
    // FIRST: Check for PROFILE_UPDATE events (HCS-11 profile data)
    console.log(`[ContactProfileSheet] Searching for PROFILE_UPDATE events. Total events: ${allEvents.length}`);
    console.log(`[ContactProfileSheet] Looking for peerId: ${peerId}`);
    
    // Debug: Log all PROFILE_UPDATE events
    const allProfileUpdates = allEvents.filter(e => e.type === 'PROFILE_UPDATE');
    console.log(`[ContactProfileSheet] Total PROFILE_UPDATE events in store: ${allProfileUpdates.length}`);
    if (allProfileUpdates.length > 0) {
      console.log('[ContactProfileSheet] Sample PROFILE_UPDATE event:', JSON.stringify(allProfileUpdates[0], null, 2));
    }
    
    const profileEvents = allEvents.filter(event => {
      if (event.type !== 'PROFILE_UPDATE') return false;
      
      // Extract sessionId from payload (direct or nested)
      const payload = event.payload || event.metadata?.payload || {};
      const sessionId = payload.sessionId || event.metadata?.sessionId || event.actor || (event as any).from;
      
      const matches = sessionId === peerId;
      
      if (matches) {
        console.log(`[ContactProfileSheet] ✅ MATCHED PROFILE_UPDATE for ${peerId}:`, {
          eventType: event.type,
          sessionId,
          peerId,
          payload: event.payload,
          fullEvent: event
        });
      }
      
      return matches;
    });
    
    console.log(`[ContactProfileSheet] Found ${profileEvents.length} PROFILE_UPDATE events for ${peerId}`);
    
    // Extract profile data from most recent PROFILE_UPDATE
    // Sort by HCS sequence number (from id like '0.0.7148066/64') for accurate ordering
    if (profileEvents.length > 0) {
      const latestProfile = profileEvents.sort((a, b) => {
        const getSeq = (id: string) => {
          const match = id?.match(/\/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        return getSeq(b.id) - getSeq(a.id);  // Higher sequence = more recent
      })[0];
      
      // Profile data could be in payload or metadata (check both)
      // HCS events have data nested in metadata.payload
      const profilePayload = latestProfile.metadata?.payload || latestProfile.payload || {};
      const profileMetadata = latestProfile.metadata || {};
      
      console.log('[ContactProfileSheet] Latest profile raw data:', {
        payload: profilePayload,
        metadata: profileMetadata,
        fullEvent: latestProfile
      });
      
      // Extract comprehensive profile info from HCS-11 PROFILE_UPDATE
      // Data is in metadata.payload for HCS events
      const profileHandle = profilePayload.handle || profileMetadata.handle;
      const profileBio = profilePayload.bio || profileMetadata.bio;
      const profileLocation = profilePayload.location || profileMetadata.location;
      const profileAvatar = profilePayload.avatar || profileMetadata.avatar;
      const profileVisibility = profilePayload.visibility || profileMetadata.visibility;
      
      console.log('[ContactProfileSheet] Extracted profile fields:', {
        profileHandle,
        profileBio,
        profileLocation,
        profileAvatar,
        profileVisibility
      });
      
      if (profileHandle || profileBio) {
        // We have HCS-11 profile data - use it!
        const richProfile = {
          handle: profileHandle || peerId,
          displayName: profileHandle,
          fullName: profileHandle,
          bio: profileBio || 'TrustMesh user',
          location: profileLocation,
          avatar: profileAvatar,
          visibility: profileVisibility || 'public',
          joinedAt: latestProfile.ts,
          lastActiveAt: latestProfile.ts,
          onlineStatus: 'unknown' as const
        };
        
        console.log('[ContactProfileSheet] ✅ Using HCS-11 profile:', richProfile);
        
        setData(richProfile);
        setSource('hcs-profile');
        setBasicDataLoaded(true);
        
        // Load enhanced stats in background
        setTimeout(() => {
          // Get trust and recognition stats
          const trustEvents = allEvents.filter(event => {
            const actor = getActor(event);
            const target = getTarget(event);
            return event.type === 'TRUST_ALLOCATE' && 
                   actor === currentSessionId && 
                   target === peerId;
          });
          
          let trustWeight: number | undefined = undefined;
          if (trustEvents.length > 0) {
            const latest = trustEvents.sort((a, b) => b.ts - a.ts)[0];
            trustWeight = latest.metadata?.weight;
          }
          
          const recognitionEvents = allEvents.filter(event => {
            const target = getTarget(event);
            return event.type === 'RECOGNITION_MINT' && target === peerId;
          });
          
          const connectionEvents = allEvents.filter(event => {
            const actor = getActor(event);
            const target = getTarget(event);
            return event.type.includes('CONTACT') && 
                   (actor === peerId || target === peerId) &&
                   (event.type === 'CONTACT_ACCEPT' || event.type === 'CONTACT_ACCEPTED');
          });
          
          setData({
            ...richProfile,
            trustScore: trustWeight,
            connections: Math.floor(connectionEvents.length / 2),
            recognitionsReceived: recognitionEvents.length
          });
          setLoading(false);
        }, 0);
        
        return; // Early return with rich profile data
      } else {
        console.warn('[ContactProfileSheet] ⚠️ PROFILE_UPDATE found but no handle/bio extracted');
      }
    } else {
      console.warn(`[ContactProfileSheet] ⚠️ No PROFILE_UPDATE events found for ${peerId}`);
    }
    
    // FALLBACK: If no PROFILE_UPDATE found, extract from contact events
    for (const event of peerEvents) {
      // Extract name information from multiple possible locations
      const eventHandle = event.metadata?.handle || event.payload?.handle;
      const eventDisplayName = event.metadata?.displayName || event.payload?.displayName || event.metadata?.name || event.payload?.name;
      const eventFullName = event.metadata?.fullName || event.payload?.fullName;
      
      // Priority: use the most specific name available
      if (eventFullName && !fullName) fullName = eventFullName;
      if (eventDisplayName && !displayName) displayName = eventDisplayName;
      if (eventHandle && !eventHandle.includes('-') && (!handle || handle === peerId)) handle = eventHandle;
      
      console.log(`[ContactProfileSheet] Extracted names from event:`, {
        eventHandle,
        eventDisplayName,
        eventFullName,
        currentHandle: handle,
        currentDisplayName: displayName,
        currentFullName: fullName
      });
      
      // Extract organizational and context data
      if (event.metadata?.organization || event.payload?.organization) {
        organization = event.metadata?.organization || event.payload?.organization;
      }
      
      // Extract categories and context domain
      if (event.metadata?.category) {
        const cats = Array.isArray(event.metadata.category) ? event.metadata.category : [event.metadata.category];
        category.push(...cats);
      }
      
      if (event.ctx?.domain) {
        contextDomain = event.ctx.domain;
      }
      
      // Extract skills
      if (event.metadata?.skills) {
        const eventSkills = Array.isArray(event.metadata.skills) ? event.metadata.skills : [event.metadata.skills];
        skills.push(...eventSkills);
      }
      
      // Extract social links
      if (event.metadata?.website || event.payload?.website) website = event.metadata?.website || event.payload?.website;
      if (event.metadata?.github || event.payload?.github) github = event.metadata?.github || event.payload?.github;
      if (event.metadata?.twitter || event.payload?.twitter) twitter = event.metadata?.twitter || event.payload?.twitter;
      if (event.metadata?.discord || event.payload?.discord) discord = event.metadata?.discord || event.payload?.discord;
      if (event.metadata?.email || event.payload?.email) email = event.metadata?.email || event.payload?.email;
      
      // Track bonding status and latest activity
      if (event.type === 'CONTACT_ACCEPT' || event.type === 'CONTACT_ACCEPTED') {
        bonded = true;
        bondedAt = event.ts;
      }
      
      if (event.ts > lastActiveAt) {
        lastActiveAt = event.ts;
      }
    }
    
    // Deduplicate and clean up arrays
    category = [...new Set(category.filter(Boolean))];
    skills = [...new Set(skills.filter(Boolean))];
    
    // Find trust events for this peer to determine trust level
    const trustEvents = allEvents.filter(event => {
      const actor = getActor(event)
      const target = getTarget(event)
      return event.type === 'TRUST_ALLOCATE' && 
             actor === currentSessionId && 
             target === peerId
    });
    
    let trustWeight: number | undefined = undefined;
    if (trustEvents.length > 0) {
      const latest = trustEvents.sort((a, b) => b.ts - a.ts)[0];
      trustWeight = latest.metadata?.weight;
    }
    
    // Count recognitions received by this peer
    const recognitionEvents = allEvents.filter(event => {
      const target = getTarget(event)
      return event.type === 'RECOGNITION_MINT' && target === peerId
    });
    
    // Count total connections (bidirectional contacts)
    const connectionEvents = allEvents.filter(event => {
      const actor = getActor(event)
      const target = getTarget(event)
      return event.type.includes('CONTACT') && 
             (actor === peerId || target === peerId) &&
             (event.type === 'CONTACT_ACCEPT' || event.type === 'CONTACT_ACCEPTED')
    });
    
    // Determine online status based on recent activity
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    let onlineStatus: 'online' | 'offline' | 'idle' | 'unknown' = 'unknown';
    
    if (lastActiveAt > fiveMinutesAgo) {
      onlineStatus = 'online';
    } else if (lastActiveAt > oneHourAgo) {
      onlineStatus = 'idle';
    } else if (lastActiveAt > 0) {
      onlineStatus = 'offline';
    }

    // Phase 1: Load basic contact info immediately
    const basicContactInfo = {
      handle: handle || peerId,
      displayName,
      fullName,
      bio: bonded 
        ? `Contact established via Hedera Consensus Service${organization ? ` • ${organization}` : ''}` 
        : "No on-chain profile found yet",
      skills: skills.length > 0 ? skills : undefined,
      website,
      github,
      twitter,
      discord,
      email,
      organization,
      category: category.length > 0 ? category : undefined,
      contextDomain,
      visibility: bonded ? "known_contact" : "unknown",
      joinedAt: bondedAt,
      lastActiveAt: lastActiveAt > 0 ? lastActiveAt : undefined,
      onlineStatus,
      reputation: trustWeight || undefined
    }
    
    console.log(`[ContactProfileSheet] Basic contact info loaded:`, basicContactInfo)
    
    // Set basic data immediately
    setData(basicContactInfo)
    setSource(bonded ? "hcs-cached" : "hcs")
    setBasicDataLoaded(true)
    
    // Phase 2: Load enhanced stats in the next tick (non-blocking)
    setTimeout(() => {
      const enhancedContactInfo = {
        ...basicContactInfo,
        trustScore: trustWeight,
        connections: Math.floor(connectionEvents.length / 2), // Divide by 2 since each connection has 2 events
        recognitionsReceived: recognitionEvents.length
      }
      
      console.log(`[ContactProfileSheet] Enhanced stats loaded:`, { 
        connections: enhancedContactInfo.connections, 
        recognitions: enhancedContactInfo.recognitionsReceived 
      })
      
      setData(enhancedContactInfo)
      setLoading(false)
    }, 0)
    }
    
    // Initial load from store
    loadProfileFromStore()
    
    // Subscribe to store updates
    const unsubscribe = signalsStore.subscribe(() => {
      console.log(`[ContactProfileSheet] Store updated, refreshing profile for ${peerId}`)
      loadProfileFromStore()
    })
    
    return unsubscribe
  }, [peerId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }
  
  // Exclusive circle engagement actions
  const handleCircleSignal = () => {
    if (!data) return
    const name = getDisplayName(data, peerId || '')
    toast.success(`⚡ Circle Signal sent to ${name}!`, {
      description: "High-priority signal sent to your trusted circle member"
    })
    // This would feed into the signals loop
    onClose()
  }
  
  const handleTrustBoost = () => {
    if (!data) return
    const name = getDisplayName(data, peerId || '')
    toast.success(`🚀 Trust boosted for ${name}!`, {
      description: "Circle member received enhanced trust allocation"
    })
    // This would feed into the trust/recognition loop
  }
  
  const handleGiftRecognition = () => {
    if (!data) return
    const name = getDisplayName(data, peerId || '')
    toast.success(`🎁 Recognition gifted to ${name}!`, {
      description: "Circle member received exclusive recognition NFT"
    })
    // This would feed into the recognition loop
    onClose()
  }
  
  const handlePrivateMessage = () => {
    if (!data) return
    const name = getDisplayName(data, peerId || '')
    toast.info(`💬 Private channel with ${name}`, {
      description: "Opening secure circle-only communication"
    })
    onClose()
  }
  
  const handleRemoveFromCircle = () => {
    if (!data) return
    const name = getDisplayName(data, peerId || '')
    toast.error(`💔 ${name} removed from circle`, {
      description: "Circle member has been removed from your trusted network"
    })
    onClose()
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown"
    return new Date(timestamp).toLocaleDateString()
  }
  
  const getDisplayName = (data: ProfileData, peerId: string) => {
    console.log('[getDisplayName] Available data:', {
      fullName: data.fullName,
      displayName: data.displayName, 
      handle: data.handle,
      peerId
    });
    
    if (data.fullName && data.fullName.trim()) return data.fullName.trim()
    if (data.displayName && data.displayName.trim()) return data.displayName.trim()
    if (data.handle && data.handle.trim() && !data.handle.includes('-') && data.handle !== peerId) {
      return data.handle.trim()
    }
    
    // For peer IDs like "tm-jordan-kim", extract a readable name
    if (peerId.startsWith('tm-') && peerId.length > 3) {
      const namepart = peerId.slice(3).replace(/-/g, ' ')
      const formatted = namepart.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
      return formatted
    }
    
    return peerId.length > 20 ? `${peerId.slice(0, 8)}...${peerId.slice(-4)}` : peerId
  }
  
  const getSecondaryName = (data: ProfileData, peerId: string) => {
    if (data.fullName && data.displayName && data.fullName !== data.displayName) return data.displayName
    if ((data.fullName || data.displayName) && data.handle && !data.handle.includes('-')) return data.handle
    return null
  }
  
  const getOnlineStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'idle': return 'text-yellow-400'
      case 'offline': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }
  
  const getOnlineStatusDot = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
      case 'idle': return 'bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
      case 'offline': return 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      default: return 'bg-gray-400'
    }
  }
  
  const generateHashScanUrl = (topicId: string) => {
    return `https://hashscan.io/testnet/topic/${topicId}`
  }
  
  const openHashScan = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!peerId) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Custom Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="
            max-w-md w-full max-h-[85vh] overflow-y-auto 
            modal-magenta-base sheen-sweep
            modal-magenta-border
            rounded-[10px] p-6
            relative
            before:absolute before:inset-0 before:rounded-[10px] before:p-[2px]
            before:bg-gradient-to-r before:from-[#FF6B35]/40 before:via-transparent before:to-[#FF6B35]/40
            before:-z-10 before:animate-pulse
          ">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-6 h-6 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
            {/* Modal Header */}
            <div className="mb-6 pb-4 border-b border-blue-500/20">
              <h2 className="text-white text-2xl font-bold bg-gradient-to-r from-white via-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                Contact Profile
              </h2>
            </div>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-2 ring-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-slate-800 text-blue-500 text-lg font-bold border border-blue-500/30">
                    {data.avatar || getDisplayName(data, peerId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Online Status Indicator */}
                {data.onlineStatus && data.onlineStatus !== 'unknown' && (
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${getOnlineStatusDot(data.onlineStatus)}`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{getDisplayName(data, peerId)}</h3>
                    {getSecondaryName(data, peerId) && (
                      <p className="text-sm text-white/60">{getSecondaryName(data, peerId)}</p>
                    )}
                  </div>
                  {data.verified && (
                    <Shield className="w-4 h-4 text-blue-400" />
                  )}
                  {data.onlineStatus && data.onlineStatus !== 'unknown' && (
                    <span className={`text-xs ${getOnlineStatusColor(data.onlineStatus)} font-medium`}>
                      {data.onlineStatus}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                  <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                    {(data.visibility || "unknown").toUpperCase()}
                  </Badge>
                  {isInCircle && (
                    <Badge className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-400/30">
                      <Crown className="w-3 h-3 mr-1" />
                      Circle Member
                    </Badge>
                  )}
                  {data.contextDomain && (
                    <Badge variant="secondary" className="text-xs">
                      {data.contextDomain}
                    </Badge>
                  )}
                  {data.reputation && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{data.reputation}</span>
                    </div>
                  )}
                </div>
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs text-white/50 mt-2">
                  {data.connections !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{data.connections} connections</span>
                    </div>
                  )}
                  {data.recognitionsReceived !== undefined && data.recognitionsReceived > 0 && (
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{data.recognitionsReceived} recognitions</span>
                    </div>
                  )}
                  {data.trustScore !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{data.trustScore} trust</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {data.bio && (
              <div className="bg-slate-800/30 p-4 rounded-[8px] border border-blue-500/10 backdrop-blur-sm">
                <p className="text-sm text-white/90 leading-relaxed">{data.bio}</p>
              </div>
            )}

            {/* Organization & Categories */}
            {(data.organization || (data.category && data.category.length > 0)) && (
              <div className="space-y-2">
                {data.organization && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Building className="w-4 h-4 text-white/60" />
                    <span>{data.organization}</span>
                  </div>
                )}
                {data.category && data.category.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="w-4 h-4 text-white/60 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {data.category.map((cat, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/70">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills */}
            {data.skills && data.skills.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {data.location && (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground))]">
                <MapPin className="w-4 h-4" />
                <span>{data.location}</span>
              </div>
            )}

            {/* Links */}
            <div className="space-y-2">
              {data.website && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--primary))]">{data.website}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(data.website!, "Website")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {data.github && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Github className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--foreground))]">@{data.github}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`https://github.com/${data.github}`, "GitHub")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {data.twitter && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Twitter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--foreground))]">@{data.twitter}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`https://twitter.com/${data.twitter}`, "Twitter")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {data.discord && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--foreground))]">{data.discord}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(data.discord!, "Discord")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {data.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[hsl(var(--foreground))]">{data.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(data.email!, "Email")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="space-y-1">
              {data.joinedAt && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Calendar className="w-3 h-3" />
                  <span>Contact established {formatDate(data.joinedAt)}</span>
                </div>
              )}
              {data.lastActiveAt && data.lastActiveAt !== data.joinedAt && (
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Activity className="w-3 h-3" />
                  <span>Last active {formatDate(data.lastActiveAt)}</span>
                </div>
              )}
            </div>

            {/* Exclusive Circle Actions */}
            {isInCircle && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-semibold text-yellow-300">Circle Member Actions</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleCircleSignal}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs h-8"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Circle Signal
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleTrustBoost}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs h-8"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trust Boost
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleGiftRecognition}
                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-xs h-8"
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    Gift NFT
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handlePrivateMessage}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-xs h-8"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Private Chat
                  </Button>
                </div>
                <div className="mt-3 pt-2 border-t border-yellow-400/20">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={handleRemoveFromCircle}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                  >
                    <UserMinus className="w-3 h-3 mr-1" />
                    Remove from Circle
                  </Button>
                </div>
              </div>
            )}

            {/* HashScan Links - Minimized */}
            <div className="border-t pt-2">
              <details className="group">
                <summary className="cursor-pointer text-xs text-white/50 hover:text-white/70 transition-colors flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  <span>Blockchain Explorer</span>
                  <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => openHashScan(generateHashScanUrl(topics.contacts))}
                    className="text-xs text-white/60 hover:text-blue-400 hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Contact & Trust Topic
                  </button>
                  <button
                    onClick={() => openHashScan(generateHashScanUrl(topics.recognition))}
                    className="text-xs text-white/60 hover:text-[#FF6B35] hover:underline flex items-center gap-1 w-full text-left"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Recognition Topic
                  </button>
                </div>
              </details>
            </div>

            {/* Technical info */}
            <div className="border-t pt-3 space-y-2">
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                <strong>Peer ID:</strong> {peerId}
              </div>
              {hrl && (
                <div className="text-xs text-[hsl(var(--muted-foreground))] break-all">
                  <strong>Profile HRL:</strong> 
                  <code className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-1 py-0.5 ml-1 rounded">
                    {hrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => copyToClipboard(hrl, "Profile HRL")}
                  >
                    <Copy className="w-2 h-2" />
                  </Button>
                </div>
              )}
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Source: {source}
                {source === "hcs-profile" && <span className="ml-1 text-green-600">✓ HCS-11 Profile</span>}
                {source === "mirror_node" && <span className="ml-1 text-green-600">✓ HCS Profile + Mirror Node</span>}
                {source === "hcs_signals" && <span className="ml-1 text-blue-600">✓ From HCS signals</span>}
                {source === "hcs_signals_only" && <span className="ml-1 text-blue-600">✓ HCS Contact (No Profile)</span>}
                {source === "hcs_contact_only" && <span className="ml-1 text-amber-600">⚠ Contact ID Only</span>}
                {source === "hcs-cached" && <span className="ml-1 text-blue-600">✓ HCS Cached</span>}
                {source === "fallback" && <span className="ml-1 text-amber-600">⚠ Offline fallback</span>}
                {source === "error" && <span className="ml-1 text-red-600">⚠ HCS Fetch Failed</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-white/70">
            <p>No profile data available</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
