"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Network, 
  Users, 
  Building2,
  Shield,
  Handshake,
  MessageSquare,
  Award,
  CheckCircle,
  TrendingUp
} from "lucide-react"
import { CouncilMemberModal } from "@/components/CouncilMemberModal"
import { CommunityClusterModal } from "@/components/CommunityClusterModal"

interface CouncilMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  organization: string;
  trustLevel: "core" | "close" | "allied";
  collaborationScore: number;
  engagement: number;
  lastInteraction: string;
  status: "active" | "inactive";
}

interface CouncilMetrics {
  totalMembers: number;
  activeMemberships: number;
  collaborationEfficiency: number;
  trustCoverage: number;
  engagementRate: number;
  responseTime: number;
}

// Municipal Council data
const councilMembers: CouncilMember[] = [
  {
    id: "sarah",
    name: "Sarah Chen",
    avatar: "👩‍💼",
    role: "Department Head",
    organization: "Public Works",
    trustLevel: "core",
    collaborationScore: 95,
    engagement: 88,
    lastInteraction: "2h ago",
    status: "active"
  },
  {
    id: "alex",
    name: "Alex Martinez",
    avatar: "👨‍💻",
    role: "Community Leader",
    organization: "Downtown Association",
    trustLevel: "core",
    collaborationScore: 92,
    engagement: 85,
    lastInteraction: "4h ago",
    status: "active"
  },
  {
    id: "maria",
    name: "Maria Rodriguez",
    avatar: "👩‍🔬",
    role: "Policy Advisor",
    organization: "Municipal Planning",
    trustLevel: "core",
    collaborationScore: 89,
    engagement: 92,
    lastInteraction: "1d ago",
    status: "active"
  },
  {
    id: "david",
    name: "David Kim",
    avatar: "👨‍🎨",
    role: "Civic Representative",
    organization: "Arts Council",
    trustLevel: "close",
    collaborationScore: 76,
    engagement: 70,
    lastInteraction: "3d ago",
    status: "active"
  },
  {
    id: "lisa",
    name: "Lisa Wilson",
    avatar: "👩‍💼",
    role: "Business Liaison",
    organization: "Chamber of Commerce",
    trustLevel: "close",
    collaborationScore: 82,
    engagement: 75,
    lastInteraction: "2d ago",
    status: "active"
  },
  {
    id: "james",
    name: "James Roberts",
    avatar: "👨‍📊",
    role: "Community Organizer",
    organization: "Neighborhood Watch",
    trustLevel: "allied",
    collaborationScore: 68,
    engagement: 65,
    lastInteraction: "5d ago",
    status: "active"
  }
];

const councilMetrics: CouncilMetrics = {
  totalMembers: 9,
  activeMemberships: 6,
  collaborationEfficiency: 87,
  trustCoverage: 94,
  engagementRate: 78,
  responseTime: 2.4
};

// Municipal council component functions
function CouncilMetricsCard({ metrics }: { metrics: CouncilMetrics }) {
  const metricsData = [
    { label: "Members", value: metrics.totalMembers.toString(), icon: <Users className="h-3 w-3" />, color: "var(--data-blue)" },
    { label: "Active", value: metrics.activeMemberships.toString(), icon: <CheckCircle className="h-3 w-3" />, color: "var(--data-success)" },
    { label: "Efficiency", value: `${metrics.collaborationEfficiency}%`, icon: <TrendingUp className="h-3 w-3" />, color: "var(--data-purple)" },
    { label: "Coverage", value: `${metrics.trustCoverage}%`, icon: <Shield className="h-3 w-3" />, color: "var(--data-info)" },
    { label: "Engagement", value: `${metrics.engagementRate}%`, icon: <Award className="h-3 w-3" />, color: "var(--data-warning)" },
    { label: "Response", value: `${metrics.responseTime}h`, icon: <MessageSquare className="h-3 w-3" />, color: "var(--data-indigo)" }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {metricsData.map((metric, index) => (
        <div key={index} className="flex flex-col items-center text-center py-2 px-1">
          <div className="flex items-center justify-center mb-1" style={{ color: metric.color }}>
            {metric.icon}
          </div>
          <div className="text-sm font-bold text-white leading-none">
            {metric.value}
          </div>
          <div className="text-xs text-white/60 leading-none mt-0.5">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}


export default function CommunityEcosystemPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [members] = useState(councilMembers)
  const [metrics] = useState(councilMetrics)
  const [filterLevel, setFilterLevel] = useState<string>("all")

  const filteredMembers = useMemo(() => {
    if (filterLevel === "all") return members;
    return members.filter(member => member.trustLevel === filterLevel);
  }, [members, filterLevel]);

  const levelFilters = [
    { value: "all", label: "All Members", color: "var(--muted-foreground)" },
    { value: "core", label: "Core", color: "var(--data-blue)" },
    { value: "close", label: "Close", color: "var(--data-purple)" },
    { value: "allied", label: "Allied", color: "var(--data-success)" }
  ];

  // Community Ecosystem Clusters Data
  const communityScopes = [
    { id: "municipal", name: "Municipal Core", members: 87, trust: 87, color: "var(--data-blue)", icon: "🏛️" },
    { id: "faith", name: "Faith Communities", members: 1812, trust: 87, color: "var(--data-purple)", icon: "⛪" },
    { id: "education", name: "Education Sector", members: 1788, trust: 93, color: "var(--data-success)", icon: "🏫" },
    { id: "business", name: "Business & Industry", members: 624, trust: 81, color: "var(--data-warning)", icon: "🏭" },
    { id: "neighborhood", name: "Neighborhood Councils", members: 132, trust: 79, color: "var(--data-info)", icon: "🏘️" },
    { id: "cultural", name: "Arts & Culture", members: 238, trust: 84, color: "var(--data-indigo)", icon: "🎨" }
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Header: Community Ecosystem Focus */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Network className="w-5 h-5 text-[#00F6FF]" />
          Community Ecosystem
        </h1>
        <div className="text-center">
          <p className="text-sm text-white/80">
            Trust Network Overview • Live Cluster Data
          </p>
        </div>
      </div>

      {/* Community Ecosystem Clusters */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#00F6FF]" />
            Community Clusters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {communityScopes.map((scope) => (
              <CommunityClusterModal key={scope.id} cluster={scope}>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 rounded-lg p-3 hover:from-slate-800/70 hover:to-slate-900/70 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{scope.icon}</span>
                    <div className="text-xs" style={{ color: scope.color }}>
                      {scope.trust}% trust
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white">{scope.name}</div>
                    <div className="text-xs text-white/60">{scope.members} members</div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${scope.trust}%`, 
                          backgroundColor: scope.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CommunityClusterModal>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Council Members */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00F6FF]" />
            Council Members ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Level Filter */}
          <div className="flex gap-1 overflow-x-auto mb-3">
            {levelFilters.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={filterLevel === filter.value ? "default" : "outline"}
                onClick={() => setFilterLevel(filter.value)}
                className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 h-6 ${
                  filterLevel === filter.value 
                    ? 'bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/20'
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: filter.color }}
                ></div>
                {filter.label}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <CouncilMemberModal key={member.id} member={member}>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{member.avatar}</div>
                    <div>
                      <div className="text-sm font-medium text-white">{member.name}</div>
                      <div className="text-xs text-white/60">{member.role} • {member.organization}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-white/50">{member.lastInteraction}</div>
                    <div className="text-xs text-[#00F6FF] bg-[#00F6FF]/10 px-2 py-1 rounded border border-[#00F6FF]/20">
                      HCS Data
                    </div>
                  </div>
                </div>
              </CouncilMemberModal>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Council Metrics Grid */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00F6FF]" />
            Council Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CouncilMetricsCard metrics={metrics} />
        </CardContent>
      </Card>
    </div>
  )
}
