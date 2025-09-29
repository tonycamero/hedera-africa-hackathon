"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"
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
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface ProfileData {
  handle?: string
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
}

interface ProfileResponse {
  ok: boolean
  profile?: ProfileData
  error?: string
  hrl?: string
  source?: string
}

export function ContactProfileSheet({ 
  peerId, 
  onClose 
}: { 
  peerId: string | null; 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProfileData | null>(null)
  const [hrl, setHrl] = useState<string | null>(null)
  const [source, setSource] = useState<string>("")

  useEffect(() => {
    if (!peerId) {
      setData(null)
      setHrl(null)
      setSource("")
      return
    }

    // We no longer use getPeerProfileHrl, just show basic contact info
    const profileHrl = null; // No more direct dependency on getPeerProfileHrl
    setHrl(profileHrl)
    
    // Get contact info from HCS events directly
    const currentSessionId = getSessionId()
    
    // Find contact events for this peer
    const peerEvents = signalsStore.getAll().filter(event => 
      event.type.includes('CONTACT') && 
      (event.actor === peerId || event.target === peerId)
    );
    
    // Extract handle from the contact events if available
    let handle = peerId;
    let bondedAt: number | undefined = undefined;
    let bonded = false;
    
    for (const event of peerEvents) {
      if (event.metadata?.handle) {
        handle = event.metadata.handle;
      }
      
      if (event.type === 'CONTACT_ACCEPT') {
        bonded = true;
        bondedAt = event.ts;
      }
    }
    
    // Find trust events for this peer to determine trust level
    const trustEvents = signalsStore.getAll().filter(event => 
      event.type === 'TRUST_ALLOCATE' && 
      event.actor === currentSessionId && 
      event.target === peerId
    );
    
    let trustWeight: number | undefined = undefined;
    if (trustEvents.length > 0) {
      const latest = trustEvents.sort((a, b) => b.ts - a.ts)[0];
      trustWeight = latest.metadata?.weight;
    }

    // No HCS profile HRL found - show basic contact info from HCS signals only
    const contactInfo = {
      handle: handle || peerId,
      bio: bonded 
        ? `Contact established via Hedera Consensus Service` 
        : "Profile not published to HCS",
      visibility: "unknown",
      joinedAt: bondedAt,
      reputation: trustWeight || undefined
    }
    
    setData(contactInfo)
    setSource(bonded ? "hcs_signals_only" : "hcs_contact_only")
  }, [peerId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown"
    return new Date(timestamp).toLocaleDateString()
  }

  if (!peerId) return null

  return (
    <Sheet open={!!peerId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Contact Profile</SheetTitle>
        </SheetHeader>

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
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                  {data.avatar || (data.handle || peerId).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{data.handle || peerId}</h3>
                  {data.verified && (
                    <Shield className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                  <Badge variant="outline" className="text-xs">
                    {(data.visibility || "public").toUpperCase()}
                  </Badge>
                  {data.reputation && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{data.reputation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {data.bio && (
              <div className="bg-[hsl(var(--muted))] p-3 rounded-lg">
                <p className="text-sm text-[hsl(var(--foreground))]">{data.bio}</p>
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
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <span>{data.location}</span>
              </div>
            )}

            {/* Links */}
            <div className="space-y-2">
              {data.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <a 
                    href={data.website.startsWith('http') ? data.website : `https://${data.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    {data.website.replace(/^https?:\/\//i, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {data.github && (
                <div className="flex items-center gap-2 text-sm">
                  <Github className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <a 
                    href={`https://github.com/${data.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    {data.github}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {data.twitter && (
                <div className="flex items-center gap-2 text-sm">
                  <Twitter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <a 
                    href={`https://twitter.com/${data.twitter}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    @{data.twitter}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {data.discord && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <span>{data.discord}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyToClipboard(data.discord!, 'Discord')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {data.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <a 
                    href={`mailto:${data.email}`} 
                    className="text-blue-500 hover:underline"
                  >
                    {data.email}
                  </a>
                </div>
              )}
            </div>

            {/* Joined date */}
            {data.joinedAt && (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(data.joinedAt)}</span>
              </div>
            )}

            {/* Source indicator */}
            <div className="mt-6 text-xs text-center text-[hsl(var(--muted-foreground))]">
              {source === 'hcs_signals_only' && 'Profile from Hedera Consensus Service'}
              {source === 'hcs_contact_only' && 'Basic contact info only'}
              {source === 'hcs11_profile' && 'HCS-11 Profile'}
              {source === 'error' && 'Error loading profile data'}
              {source === 'unknown' && 'Unknown data source'}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-[hsl(var(--muted-foreground))]">
            No profile data available
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}