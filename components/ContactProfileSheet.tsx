"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signalsStore } from "@/lib/stores/signalsStore"
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

    // Get the peer's profile HRL from contact handshake
    const profileHrl = signalsStore.getPeerProfileHrl(peerId)
    setHrl(profileHrl || null)

    if (!profileHrl) {
      // No HRL on record, show basic profile
      setData({
        handle: peerId,
        bio: "No profile data available",
        visibility: "public"
      })
      setSource("local")
      return
    }

    // Fetch profile from HCS-11 via HRL
    setLoading(true)
    fetch(`/api/hcs/profile?hrl=${encodeURIComponent(profileHrl)}`)
      .then(r => r.json())
      .then((response: ProfileResponse) => {
        setData(response.profile || { handle: peerId })
        setSource(response.source || "unknown")
      })
      .catch(error => {
        console.error("Failed to fetch profile:", error)
        setData({
          handle: peerId,
          bio: "Failed to load profile",
          visibility: "public"
        })
        setSource("error")
      })
      .finally(() => setLoading(false))
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

            {/* Joined date */}
            {data.joinedAt && (
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <Calendar className="w-3 h-3" />
                <span>Joined {formatDate(data.joinedAt)}</span>
              </div>
            )}

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
                {source === "mirror_node" && <span className="ml-1 text-green-600">✓ Verified on-chain</span>}
                {source === "fallback" && <span className="ml-1 text-amber-600">⚠ Offline fallback</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-[hsl(var(--muted-foreground))]">
            <p>No profile data available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}