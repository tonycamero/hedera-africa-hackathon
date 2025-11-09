"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Users,
  Settings,
  DollarSign,
  MessageSquare,
  Clock,
  Target,
  Activity,
  Network,
  Eye,
  PlayCircle,
  CheckCircle,
  ArrowUp,
  Command,
  Gauge,
  Radio,
  UserCheck,
  AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function TrustOperationsCenter() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<"operations" | "alerts" | "resources">("operations")
  const [profileStatus, setProfileStatus] = useState<{ hasProfile: boolean; handle?: string; accountId?: string }>({ hasProfile: false })

  useEffect(() => {
    const users = localStorage.getItem('tm:users')
    if (users) {
      try {
        const [u] = JSON.parse(users)
        if (u?.handle && u?.hederaAccountId) {
          setProfileStatus({ hasProfile: true, handle: u.handle, accountId: u.hederaAccountId })
        } else if (u?.hederaAccountId) {
          setProfileStatus({ hasProfile: false, accountId: u.hederaAccountId })
        }
      } catch {}
    }
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Command className="w-5 h-5 text-[#00F6FF]" />
          Trust Operations
        </h1>
        <div className="text-center">
          <p className="text-sm text-white/80">
            Municipal Control Center • Live Status
          </p>
        </div>
      </div>

      {/* Profile Status Alert */}
      {!profileStatus.hasProfile && profileStatus.accountId && (
        <Card className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border-2 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-white mb-1">Profile Update Required</div>
                <div className="text-xs text-white/80 mb-3">
                  Your bonded contacts won't appear until you publish your profile to HCS-11.
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/me')}
                  className="h-8 px-4 text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Update Profile Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Status - Success */}
      {profileStatus.hasProfile && (
        <Card className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border border-emerald-500/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <div className="flex-1">
                <div className="text-xs text-white/90">
                  Profile Active: <span className="font-semibold text-emerald-400">{profileStatus.handle}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push('/me')}
                className="h-6 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#00F6FF]" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center py-2 px-1 bg-white/5 rounded-lg">
              <CheckCircle className="h-3 w-3 text-green-400 mb-1" />
              <div className="text-sm font-bold text-white">Online</div>
              <div className="text-xs text-white/60">Status</div>
            </div>
            <div className="flex flex-col items-center text-center py-2 px-1 bg-white/5 rounded-lg">
              <Target className="h-3 w-3 text-blue-400 mb-1" />
              <div className="text-sm font-bold text-white">3</div>
              <div className="text-xs text-white/60">Operations</div>
            </div>
            <div className="flex flex-col items-center text-center py-2 px-1 bg-white/5 rounded-lg">
              <DollarSign className="h-3 w-3 text-purple-400 mb-1" />
              <div className="text-sm font-bold text-white">$237K</div>
              <div className="text-xs text-white/60">Deployed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Operations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Operations</h2>
          <Button size="sm" className="h-7 px-3 text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            <PlayCircle className="w-3 h-3 mr-1" />
            New Operation
          </Button>
        </div>
        
        {/* Operation Cards */}
        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-l-4 border-l-orange-500 hover:from-slate-800/70 hover:to-slate-900/70 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏘️</span>
                <div>
                  <h4 className="font-medium text-sm text-white">Civic Engagement Enhancement</h4>
                  <p className="text-xs text-white/60">Neighborhood Councils</p>
                </div>
              </div>
              <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                high
              </Badge>
            </div>
            <p className="text-xs text-white/80 mb-3">Deploy community organizers to boost 74% voting participation rate</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Expected 15% participation increase</span>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-[#00F6FF] hover:bg-[#00F6FF]/10">
                <Eye className="w-3 h-3 mr-1" />
                Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-l-4 border-l-amber-500 hover:from-slate-800/70 hover:to-slate-900/70 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏭</span>
                <div>
                  <h4 className="font-medium text-sm text-white">Economic Incentive Expansion</h4>
                  <p className="text-xs text-white/60">Business & Industry</p>
                </div>
              </div>
              <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                medium
              </Badge>
            </div>
            <p className="text-xs text-white/80 mb-3">Increase local spending incentives to maximize $45.2M economic multiplier</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60">Projected 8% increase in local economic flow</span>
              <Button size="sm" className="h-6 px-2 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30">
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/60">
        <Radio className="w-3 h-3 text-green-400 animate-pulse" />
        <span>Command Center Online • HCS Network Synchronized</span>
      </div>
    </div>
  )
}
