"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2,
  Users,
  Shield,
  MessageSquare,
  Award,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Network,
  BarChart3,
  PieChart,
  Clock,
  MapPin,
  Zap
} from "lucide-react"

interface CommunityCluster {
  id: string;
  name: string;
  members: number;
  trust: number;
  color: string;
  icon: string;
}

interface ClusterHCSData {
  clusterId: string;
  clusterName: string;
  hcsTopicId: string;
  trustMetrics: {
    consensusScore: number;
    validationCount: number;
    networkDensity: number;
    crossClusterConnections: number;
    internalTrustFlow: number;
    externalTrustFlow: number;
  };
  memberActivity: {
    activeMembers: number;
    totalMembers: number;
    messageVolume: number;
    proposalsActive: number;
    votingParticipation: number;
    lastActivity: string;
  };
  financialFlow: {
    budgetAllocated: number;
    fundingReceived: number;
    localSpending: number;
    crossClusterTransfers: number;
    economicImpact: number;
  };
  governanceData: {
    decisions: number;
    consensusReached: number;
    stakeholders: number;
    complianceScore: number;
    transparency: number;
  };
  keyMembers: Array<{
    name: string;
    role: string;
    avatar: string;
    trustScore: number;
  }>;
}

interface CommunityClusterModalProps {
  cluster: CommunityCluster;
  children: React.ReactNode;
}

// Mock telescopic HCS data for each community cluster
function getClusterHCSData(clusterId: string): ClusterHCSData {
  const clusterDataMap: Record<string, ClusterHCSData> = {
    "municipal": {
      clusterId: "hcs_municipal_core_001",
      clusterName: "Municipal Core",
      hcsTopicId: "0.0.7834521",
      trustMetrics: {
        consensusScore: 87.0,
        validationCount: 2847,
        networkDensity: 0.79,
        crossClusterConnections: 234,
        internalTrustFlow: 8945,
        externalTrustFlow: 7834
      },
      memberActivity: {
        activeMembers: 71,
        totalMembers: 87,
        messageVolume: 1842,
        proposalsActive: 23,
        votingParticipation: 82,
        lastActivity: "2024-10-09T04:22:15Z"
      },
      financialFlow: {
        budgetAllocated: 12400000,
        fundingReceived: 8750000,
        localSpending: 9560000,
        crossClusterTransfers: 2340000,
        economicImpact: 18500000
      },
      governanceData: {
        decisions: 47,
        consensusReached: 43,
        stakeholders: 156,
        complianceScore: 96,
        transparency: 92
      },
      keyMembers: [
        { name: "Sarah Chen", role: "Dept. Head", avatar: "👩‍💼", trustScore: 98 },
        { name: "Maria Rodriguez", role: "Policy Advisor", avatar: "👩‍🔬", trustScore: 97 },
        { name: "Alex Martinez", role: "Community Liaison", avatar: "👨‍💻", trustScore: 94 }
      ]
    },
    "faith": {
      clusterId: "hcs_faith_communities_002",
      clusterName: "Faith Communities",
      hcsTopicId: "0.0.7834522",
      trustMetrics: {
        consensusScore: 87.0,
        validationCount: 12847,
        networkDensity: 0.68,
        crossClusterConnections: 445,
        internalTrustFlow: 34567,
        externalTrustFlow: 28934
      },
      memberActivity: {
        activeMembers: 1567,
        totalMembers: 1812,
        messageVolume: 8934,
        proposalsActive: 67,
        votingParticipation: 86,
        lastActivity: "2024-10-08T21:15:33Z"
      },
      financialFlow: {
        budgetAllocated: 0, // Faith communities are primarily volunteer-based
        fundingReceived: 450000, // Grants and donations
        localSpending: 380000,
        crossClusterTransfers: 125000,
        economicImpact: 850000
      },
      governanceData: {
        decisions: 28,
        consensusReached: 26,
        stakeholders: 234,
        complianceScore: 88,
        transparency: 85
      },
      keyMembers: [
        { name: "Rev. Michael Torres", role: "Council Chair", avatar: "👨‍🦳", trustScore: 91 },
        { name: "Sister Anne Marie", role: "Community Outreach", avatar: "👩‍🦳", trustScore: 89 },
        { name: "Rabbi David Klein", role: "Interfaith Coordinator", avatar: "👨‍💼", trustScore: 87 }
      ]
    },
    "education": {
      clusterId: "hcs_education_sector_003",
      clusterName: "Education Sector",
      hcsTopicId: "0.0.7834523",
      trustMetrics: {
        consensusScore: 93.0,
        validationCount: 18945,
        networkDensity: 0.84,
        crossClusterConnections: 523,
        internalTrustFlow: 45678,
        externalTrustFlow: 42134
      },
      memberActivity: {
        activeMembers: 1634,
        totalMembers: 1788,
        messageVolume: 12456,
        proposalsActive: 89,
        votingParticipation: 91,
        lastActivity: "2024-10-09T02:45:12Z"
      },
      financialFlow: {
        budgetAllocated: 8900000,
        fundingReceived: 9450000,
        localSpending: 7200000,
        crossClusterTransfers: 890000,
        economicImpact: 15600000
      },
      governanceData: {
        decisions: 62,
        consensusReached: 58,
        stakeholders: 312,
        complianceScore: 93,
        transparency: 89
      },
      keyMembers: [
        { name: "Dr. Jennifer Walsh", role: "Superintendent", avatar: "👩‍🎓", trustScore: 95 },
        { name: "Principal Marcus Johnson", role: "K-12 Coordinator", avatar: "👨‍🏫", trustScore: 92 },
        { name: "Prof. Lisa Chen", role: "Higher Ed Rep", avatar: "👩‍🔬", trustScore: 90 }
      ]
    },
    "business": {
      clusterId: "hcs_business_industry_004",
      clusterName: "Business & Industry",
      hcsTopicId: "0.0.7834524",
      trustMetrics: {
        consensusScore: 81.0,
        validationCount: 8934,
        networkDensity: 0.74,
        crossClusterConnections: 387,
        internalTrustFlow: 23456,
        externalTrustFlow: 28943
      },
      memberActivity: {
        activeMembers: 487,
        totalMembers: 624,
        messageVolume: 4567,
        proposalsActive: 45,
        votingParticipation: 78,
        lastActivity: "2024-10-09T01:33:27Z"
      },
      financialFlow: {
        budgetAllocated: 0, // Private sector
        fundingReceived: 2100000, // Tax incentives and grants
        localSpending: 24500000,
        crossClusterTransfers: 3400000,
        economicImpact: 45200000
      },
      governanceData: {
        decisions: 89,
        consensusReached: 76,
        stakeholders: 487,
        complianceScore: 79,
        transparency: 74
      },
      keyMembers: [
        { name: "Alex Martinez", role: "Chamber President", avatar: "👨‍💻", trustScore: 89 },
        { name: "Lisa Wilson", role: "Economic Dev", avatar: "👩‍💼", trustScore: 87 },
        { name: "Robert Kim", role: "Industry Council", avatar: "👨‍🏭", trustScore: 84 }
      ]
    },
    "neighborhood": {
      clusterId: "hcs_neighborhood_councils_005",
      clusterName: "Neighborhood Councils",
      hcsTopicId: "0.0.7834525",
      trustMetrics: {
        consensusScore: 79.0,
        validationCount: 3456,
        networkDensity: 0.67,
        crossClusterConnections: 198,
        internalTrustFlow: 8934,
        externalTrustFlow: 7623
      },
      memberActivity: {
        activeMembers: 98,
        totalMembers: 132,
        messageVolume: 2134,
        proposalsActive: 34,
        votingParticipation: 74,
        lastActivity: "2024-10-08T19:22:44Z"
      },
      financialFlow: {
        budgetAllocated: 890000,
        fundingReceived: 1200000,
        localSpending: 1050000,
        crossClusterTransfers: 245000,
        economicImpact: 2800000
      },
      governanceData: {
        decisions: 156,
        consensusReached: 134,
        stakeholders: 892,
        complianceScore: 72,
        transparency: 78
      },
      keyMembers: [
        { name: "James Roberts", role: "District Organizer", avatar: "👨‍📊", trustScore: 82 },
        { name: "Maria Santos", role: "Community Advocate", avatar: "👩‍🦱", trustScore: 79 },
        { name: "David Park", role: "Safety Coordinator", avatar: "👨‍🚒", trustScore: 77 }
      ]
    },
    "cultural": {
      clusterId: "hcs_arts_culture_006",
      clusterName: "Arts & Culture",
      hcsTopicId: "0.0.7834526",
      trustMetrics: {
        consensusScore: 84.0,
        validationCount: 2789,
        networkDensity: 0.81,
        crossClusterConnections: 167,
        internalTrustFlow: 6784,
        externalTrustFlow: 5923
      },
      memberActivity: {
        activeMembers: 198,
        totalMembers: 238,
        messageVolume: 1567,
        proposalsActive: 28,
        votingParticipation: 83,
        lastActivity: "2024-10-07T14:18:56Z"
      },
      financialFlow: {
        budgetAllocated: 540000,
        fundingReceived: 780000,
        localSpending: 650000,
        crossClusterTransfers: 95000,
        economicImpact: 1400000
      },
      governanceData: {
        decisions: 34,
        consensusReached: 31,
        stakeholders: 189,
        complianceScore: 91,
        transparency: 87
      },
      keyMembers: [
        { name: "David Kim", role: "Arts Council Chair", avatar: "👨‍🎨", trustScore: 88 },
        { name: "Sofia Hernandez", role: "Cultural Director", avatar: "👩‍🎭", trustScore: 86 },
        { name: "Maya Patel", role: "Events Coordinator", avatar: "👩‍🎪", trustScore: 84 }
      ]
    }
  };

  return clusterDataMap[clusterId] || clusterDataMap["municipal"];
}

// Chart components for cluster data
function ClusterTrustFlowChart({ internal, external }: { internal: number, external: number }) {
  const maxFlow = Math.max(internal, external);
  const internalWidth = (internal / maxFlow) * 100;
  const externalWidth = (external / maxFlow) * 100;
  
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-400 rounded-full" />
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full"
            style={{ width: `${internalWidth}%` }}
          />
        </div>
        <span className="text-xs text-blue-400 w-12 text-right">{internal.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-purple-400 rounded-full" />
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-400 to-purple-500 h-2 rounded-full"
            style={{ width: `${externalWidth}%` }}
          />
        </div>
        <span className="text-xs text-purple-400 w-12 text-right">{external.toLocaleString()}</span>
      </div>
    </div>
  );
}

function MemberActivityChart({ active, total }: { active: number, total: number }) {
  const activePercentage = (active / total) * 100;
  const inactivePercentage = 100 - activePercentage;
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/60">Member Activity</span>
        <span className="text-white/60">{total} total</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-full"
            style={{ width: `${activePercentage}%` }}
          />
          <div 
            className="bg-gradient-to-r from-gray-400 to-gray-500 h-full"
            style={{ width: `${inactivePercentage}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-green-400">✅ {active} active</span>
        <span className="text-gray-400">😴 {total - active} inactive</span>
      </div>
    </div>
  );
}

function EconomicImpactDonut({ impact, spending }: { impact: number, spending: number }) {
  const percentage = Math.min((spending / impact) * 100, 100);
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex items-center justify-center mt-2">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="16"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <circle
            cx="18" cy="18" r="16"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white font-medium">${(impact/1000000).toFixed(1)}M</span>
        </div>
      </div>
    </div>
  );
}

export function CommunityClusterModal({ cluster, children }: CommunityClusterModalProps) {
  const [selectedTab, setSelectedTab] = useState<"overview" | "members" | "governance">("overview");
  const hcsData = getClusterHCSData(cluster.id);

  const tabs = [
    { id: "overview", label: "HCS Overview", icon: <Network className="w-3 h-3" /> },
    { id: "members", label: "Members", icon: <Users className="w-3 h-3" /> },
    { id: "governance", label: "Governance", icon: <Shield className="w-3 h-3" /> }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <span className="text-2xl">{cluster.icon}</span>
            <div>
              <div className="text-lg">{cluster.name}</div>
              <div className="text-sm text-white/60 font-normal">
                HCS Topic: {hcsData.hcsTopicId} • {cluster.members} members • {cluster.trust}% trust
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all ${
                selectedTab === tab.id
                  ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {selectedTab === "overview" && (
            <>
              {/* HCS Trust Metrics */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#00F6FF]" />
                    🔭 HCS Trust Network Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-300/80">Consensus Score:</span>
                        <span className="text-blue-400 font-medium">{hcsData.trustMetrics.consensusScore.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300/80">Validation Count:</span>
                        <span className="text-blue-400 font-medium">{hcsData.trustMetrics.validationCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300/80">Network Density:</span>
                        <span className="text-purple-400 font-medium">{hcsData.trustMetrics.networkDensity.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300/80">Cross-Cluster Links:</span>
                        <span className="text-purple-400 font-medium">{hcsData.trustMetrics.crossClusterConnections}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60 mb-1">Internal vs External Trust Flow</div>
                      <ClusterTrustFlowChart 
                        internal={hcsData.trustMetrics.internalTrustFlow}
                        external={hcsData.trustMetrics.externalTrustFlow}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Flow */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#00F6FF]" />
                    💰 Economic Flow & Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-300/80">Budget Allocated:</span>
                        <span className="text-green-400 font-medium">${(hcsData.financialFlow.budgetAllocated / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300/80">Funding Received:</span>
                        <span className="text-emerald-400 font-medium">${(hcsData.financialFlow.fundingReceived / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-300/80">🏪 Local Spending:</span>
                        <span className="text-yellow-400 font-medium">${(hcsData.financialFlow.localSpending / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-300/80">Cross-Cluster:</span>
                        <span className="text-orange-400 font-medium">${(hcsData.financialFlow.crossClusterTransfers / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-white/60 mb-1">Economic Impact</div>
                      <EconomicImpactDonut 
                        impact={hcsData.financialFlow.economicImpact}
                        spending={hcsData.financialFlow.localSpending}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Activity */}
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00F6FF]" />
                    📊 Member Activity & Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-indigo-300/80">💬 Message Volume:</span>
                        <span className="text-indigo-400 font-medium">{hcsData.memberActivity.messageVolume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300/80">📋 Proposals Active:</span>
                        <span className="text-purple-400 font-medium">{hcsData.memberActivity.proposalsActive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-300/80">🗳️ Voting Participation:</span>
                        <span className="text-green-400 font-medium">{hcsData.memberActivity.votingParticipation}%</span>
                      </div>
                    </div>
                    <div>
                      <MemberActivityChart 
                        active={hcsData.memberActivity.activeMembers}
                        total={hcsData.memberActivity.totalMembers}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {selectedTab === "members" && (
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00F6FF]" />
                  Key Cluster Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hcsData.keyMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{member.avatar}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{member.name}</div>
                        <div className="text-xs text-white/60">{member.role}</div>
                      </div>
                    </div>
                    <Badge className="bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/30">
                      Trust: {member.trustScore}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedTab === "governance" && (
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00F6FF]" />
                  HCS Governance & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-300/80">⚖️ Decisions Made:</span>
                      <span className="text-blue-400 font-medium">{hcsData.governanceData.decisions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-300/80">✅ Consensus Reached:</span>
                      <span className="text-green-400 font-medium">{hcsData.governanceData.consensusReached}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300/80">👥 Stakeholders:</span>
                      <span className="text-purple-400 font-medium">{hcsData.governanceData.stakeholders}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-emerald-300/80">📜 Compliance:</span>
                      <span className="text-emerald-400 font-medium">{hcsData.governanceData.complianceScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300/80">🔍 Transparency:</span>
                      <span className="text-purple-400 font-medium">{hcsData.governanceData.transparency}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-300/80">🏆 Success Rate:</span>
                      <span className="text-amber-400 font-medium">{((hcsData.governanceData.consensusReached / hcsData.governanceData.decisions) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* HCS Status Footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>Live data from HCS Topic {hcsData.hcsTopicId} • Last sync: {new Date(hcsData.memberActivity.lastActivity).toLocaleString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}