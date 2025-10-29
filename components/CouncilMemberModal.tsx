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
import { Button } from "@/components/ui/button"
import { 
  Building2,
  Clock,
  TrendingUp,
  Users,
  Shield,
  MessageSquare,
  Award,
  Calendar,
  MapPin,
  Activity,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Network,
  Eye,
  Wallet
} from "lucide-react"

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

interface HCSClusterData {
  clusterId: string;
  clusterName: string;
  memberRole: string;
  trustMetrics: {
    consensusScore: number;
    validationCount: number;
    reputationWeight: number;
    networkConnections: number;
  };
  activityStats: {
    messagesSent: number;
    messagesReceived: number;
    topicContributions: number;
    lastActiveTimestamp: string;
  };
  governanceData: {
    proposalsInitiated: number;
    votesParticipated: number;
    consensusReached: number;
    stakeholderInfluence: number;
  };
  organizationData?: {
    trustGraph: {
      internalNodes: number;
      externalConnections: number;
      trustFlowIn: number;
      trustFlowOut: number;
      networkDensity: number;
    };
    financialActivity: {
      budgetAllocated: number;
      budgetSpent: number;
      localSpending: number;
      vendorPayments: number;
      contractValue: number;
      fundingReceived: number;
    };
    operationalMetrics: {
      projectsActive: number;
      projectsCompleted: number;
      employeeCount: number;
      publicInteractions: number;
      serviceRequests: number;
      complianceScore: number;
    };
  };
}

interface CouncilMemberModalProps {
  member: CouncilMember;
  children: React.ReactNode;
}

// Mock HCS cluster data for each council member - structured as if from HCS consensus service
function getHCSClusterData(memberId: string): HCSClusterData[] {
  const clusterDataMap: Record<string, HCSClusterData[]> = {
    "sarah": [
      {
        clusterId: "hcs_municipal_core_001",
        clusterName: "Municipal Core",
        memberRole: "Cluster Coordinator",
        trustMetrics: {
          consensusScore: 98.5,
          validationCount: 847,
          reputationWeight: 0.95,
          networkConnections: 23
        },
        activityStats: {
          messagesSent: 156,
          messagesReceived: 203,
          topicContributions: 42,
          lastActiveTimestamp: "2024-10-09T04:22:15Z"
        },
        governanceData: {
          proposalsInitiated: 8,
          votesParticipated: 34,
          consensusReached: 31,
          stakeholderInfluence: 87
        },
        organizationData: {
          trustGraph: {
            internalNodes: 47,
            externalConnections: 128,
            trustFlowIn: 2847,
            trustFlowOut: 3192,
            networkDensity: 0.73
          },
          financialActivity: {
            budgetAllocated: 4200000,
            budgetSpent: 3876420,
            localSpending: 2840560,
            vendorPayments: 1890340,
            contractValue: 6750000,
            fundingReceived: 4850000
          },
          operationalMetrics: {
            projectsActive: 23,
            projectsCompleted: 187,
            employeeCount: 47,
            publicInteractions: 1456,
            serviceRequests: 892,
            complianceScore: 96
          }
        }
      },
      {
        clusterId: "hcs_education_sector_003",
        clusterName: "Education Sector",
        memberRole: "Advisory Member",
        trustMetrics: {
          consensusScore: 92.1,
          validationCount: 234,
          reputationWeight: 0.78,
          networkConnections: 12
        },
        activityStats: {
          messagesSent: 43,
          messagesReceived: 67,
          topicContributions: 18,
          lastActiveTimestamp: "2024-10-08T16:45:32Z"
        },
        governanceData: {
          proposalsInitiated: 2,
          votesParticipated: 15,
          consensusReached: 14,
          stakeholderInfluence: 34
        }
      }
    ],
    "alex": [
      {
        clusterId: "hcs_business_industry_004",
        clusterName: "Business & Industry",
        memberRole: "Stakeholder Representative",
        trustMetrics: {
          consensusScore: 94.7,
          validationCount: 512,
          reputationWeight: 0.89,
          networkConnections: 18
        },
        activityStats: {
          messagesSent: 89,
          messagesReceived: 134,
          topicContributions: 27,
          lastActiveTimestamp: "2024-10-09T02:18:44Z"
        },
        governanceData: {
          proposalsInitiated: 5,
          votesParticipated: 28,
          consensusReached: 25,
          stakeholderInfluence: 72
        }
      },
      {
        clusterId: "hcs_municipal_core_001",
        clusterName: "Municipal Core",
        memberRole: "Community Liaison",
        trustMetrics: {
          consensusScore: 89.3,
          validationCount: 156,
          reputationWeight: 0.72,
          networkConnections: 9
        },
        activityStats: {
          messagesSent: 34,
          messagesReceived: 48,
          topicContributions: 12,
          lastActiveTimestamp: "2024-10-08T22:55:17Z"
        },
        governanceData: {
          proposalsInitiated: 1,
          votesParticipated: 19,
          consensusReached: 18,
          stakeholderInfluence: 45
        }
      }
    ],
    "maria": [
      {
        clusterId: "hcs_municipal_core_001",
        clusterName: "Municipal Core",
        memberRole: "Policy Architect",
        trustMetrics: {
          consensusScore: 96.8,
          validationCount: 623,
          reputationWeight: 0.91,
          networkConnections: 21
        },
        activityStats: {
          messagesSent: 127,
          messagesReceived: 189,
          topicContributions: 38,
          lastActiveTimestamp: "2024-10-08T18:32:09Z"
        },
        governanceData: {
          proposalsInitiated: 12,
          votesParticipated: 31,
          consensusReached: 28,
          stakeholderInfluence: 93
        }
      }
    ],
    "david": [
      {
        clusterId: "hcs_arts_culture_006",
        clusterName: "Arts & Culture",
        memberRole: "Creative Director",
        trustMetrics: {
          consensusScore: 88.4,
          validationCount: 298,
          reputationWeight: 0.76,
          networkConnections: 15
        },
        activityStats: {
          messagesSent: 67,
          messagesReceived: 92,
          topicContributions: 23,
          lastActiveTimestamp: "2024-10-06T14:27:55Z"
        },
        governanceData: {
          proposalsInitiated: 3,
          votesParticipated: 16,
          consensusReached: 14,
          stakeholderInfluence: 58
        }
      },
      {
        clusterId: "hcs_municipal_core_001",
        clusterName: "Municipal Core",
        memberRole: "Cultural Advisor",
        trustMetrics: {
          consensusScore: 82.1,
          validationCount: 87,
          reputationWeight: 0.65,
          networkConnections: 7
        },
        activityStats: {
          messagesSent: 21,
          messagesReceived: 35,
          topicContributions: 9,
          lastActiveTimestamp: "2024-10-07T11:43:22Z"
        },
        governanceData: {
          proposalsInitiated: 1,
          votesParticipated: 8,
          consensusReached: 7,
          stakeholderInfluence: 28
        }
      }
    ],
    "lisa": [
      {
        clusterId: "hcs_business_industry_004",
        clusterName: "Business & Industry",
        memberRole: "Economic Coordinator",
        trustMetrics: {
          consensusScore: 91.6,
          validationCount: 445,
          reputationWeight: 0.84,
          networkConnections: 16
        },
        activityStats: {
          messagesSent: 78,
          messagesReceived: 115,
          topicContributions: 31,
          lastActiveTimestamp: "2024-10-07T20:14:38Z"
        },
        governanceData: {
          proposalsInitiated: 4,
          votesParticipated: 23,
          consensusReached: 21,
          stakeholderInfluence: 67
        }
      }
    ],
    "james": [
      {
        clusterId: "hcs_neighborhood_councils_005",
        clusterName: "Neighborhood Councils",
        memberRole: "District Organizer",
        trustMetrics: {
          consensusScore: 85.9,
          validationCount: 267,
          reputationWeight: 0.71,
          networkConnections: 13
        },
        activityStats: {
          messagesSent: 54,
          messagesReceived: 81,
          topicContributions: 19,
          lastActiveTimestamp: "2024-10-04T09:16:47Z"
        },
        governanceData: {
          proposalsInitiated: 2,
          votesParticipated: 14,
          consensusReached: 12,
          stakeholderInfluence: 49
        }
      }
    ]
  };

  return clusterDataMap[memberId] || [];
}

function getTrustLevelColor(level: string) {
  switch (level) {
    case "core": return "var(--data-blue)";
    case "close": return "var(--data-purple)";
    case "allied": return "var(--data-success)";
    default: return "var(--muted-foreground)";
  }
}

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Simple chart components
function TrustFlowChart({ trustIn, trustOut }: { trustIn: number, trustOut: number }) {
  const maxFlow = Math.max(trustIn, trustOut);
  const inWidth = (trustIn / maxFlow) * 100;
  const outWidth = (trustOut / maxFlow) * 100;
  
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <ArrowDownRight className="w-3 h-3 text-green-400" />
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
            style={{ width: `${inWidth}%` }}
          />
        </div>
        <span className="text-xs text-green-400 w-12 text-right">{trustIn.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <ArrowUpRight className="w-3 h-3 text-orange-400" />
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full"
            style={{ width: `${outWidth}%` }}
          />
        </div>
        <span className="text-xs text-orange-400 w-12 text-right">{trustOut.toLocaleString()}</span>
      </div>
    </div>
  );
}

function BudgetDonutChart({ allocated, spent, local }: { allocated: number, spent: number, local: number }) {
  const spentPercentage = (spent / allocated) * 100;
  const localPercentage = (local / spent) * 100;
  const circumference = 2 * Math.PI * 20;
  const spentOffset = circumference - (spentPercentage / 100) * circumference;
  
  return (
    <div className="flex items-center justify-center mt-2">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={spentOffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white font-medium">{spentPercentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="ml-3 space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-white/80">Spent: ${(spent/1000000).toFixed(1)}M</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span className="text-white/80">Local: {localPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function ProjectStatusChart({ active, completed }: { active: number, completed: number }) {
  const total = active + completed;
  const completedPercentage = (completed / total) * 100;
  const activePercentage = (active / total) * 100;
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/60">Project Status</span>
        <span className="text-white/60">{total} total</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-full"
            style={{ width: `${completedPercentage}%` }}
          />
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-500 h-full"
            style={{ width: `${activePercentage}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-green-400">✅ {completed} done</span>
        <span className="text-blue-400">🏗️ {active} active</span>
      </div>
    </div>
  );
}

function NetworkDensityGauge({ density }: { density: number }) {
  const percentage = density * 100;
  const rotation = (density * 180) - 90;
  
  return (
    <div className="flex flex-col items-center mt-2">
      <div className="relative w-20 h-10 overflow-hidden">
        <div className="absolute inset-0 border-4 border-white/20 rounded-t-full" />
        <div 
          className="absolute bottom-0 left-1/2 w-0.5 h-8 bg-purple-400 origin-bottom transform-gpu transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full transform -translate-x-1/2" />
      </div>
      <div className="text-xs text-purple-400 font-medium mt-1">
        {percentage.toFixed(0)}% dense
      </div>
    </div>
  );
}

export function CouncilMemberModal({ member, children }: CouncilMemberModalProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const hcsClusterData = getHCSClusterData(member.id);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <span className="text-2xl">{member.avatar}</span>
            <div>
              <div className="text-lg">{member.name}</div>
              <div className="text-sm text-white/60 font-normal">{member.role} • {member.organization}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Overview */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00F6FF]" />
                HCS Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getTrustLevelColor(member.trustLevel) }}
                    />
                    <span className="text-sm text-white/80">Trust Level: {member.trustLevel.charAt(0).toUpperCase() + member.trustLevel.slice(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-sm text-white/80">Collaboration: {member.collaborationScore}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-sm text-white/80">Engagement: {member.engagement}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span className="text-sm text-white/80">Last Active: {member.lastInteraction}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HCS Cluster Participation */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#00F6FF]" />
                HCS Cluster Participation ({hcsClusterData.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hcsClusterData.map((cluster) => (
                <div 
                  key={cluster.clusterId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCluster === cluster.clusterId 
                      ? 'border-[#00F6FF]/50 bg-[#00F6FF]/5' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedCluster(
                    selectedCluster === cluster.clusterId ? null : cluster.clusterId
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{cluster.clusterName}</h3>
                      <p className="text-sm text-white/60">{cluster.memberRole}</p>
                    </div>
                    <Badge className="bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/30">
                      Consensus: {cluster.trustMetrics.consensusScore.toFixed(1)}%
                    </Badge>
                  </div>

                  {selectedCluster === cluster.clusterId && (
                    <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                      {/* Trust Metrics from HCS */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          HCS Trust Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Validation Count:</span>
                              <span className="text-white">{cluster.trustMetrics.validationCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Reputation Weight:</span>
                              <span className="text-white">{cluster.trustMetrics.reputationWeight.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Network Connections:</span>
                              <span className="text-white">{cluster.trustMetrics.networkConnections}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Consensus Score:</span>
                              <span className="text-green-400">{cluster.trustMetrics.consensusScore.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activity Stats from HCS */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" />
                          HCS Activity Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Messages Sent:</span>
                              <span className="text-white">{cluster.activityStats.messagesSent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Messages Received:</span>
                              <span className="text-white">{cluster.activityStats.messagesReceived}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Topic Contributions:</span>
                              <span className="text-white">{cluster.activityStats.topicContributions}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Last Active:</span>
                              <span className="text-blue-400">{formatTimestamp(cluster.activityStats.lastActiveTimestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Governance Data from HCS */}
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                          <Award className="w-3 h-3" />
                          HCS Governance Participation
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Proposals Initiated:</span>
                              <span className="text-white">{cluster.governanceData.proposalsInitiated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Votes Participated:</span>
                              <span className="text-white">{cluster.governanceData.votesParticipated}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-white/60">Consensus Reached:</span>
                              <span className="text-green-400">{cluster.governanceData.consensusReached}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Stakeholder Influence:</span>
                              <span className="text-purple-400">{cluster.governanceData.stakeholderInfluence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Telescopic Organization Data */}
                      {cluster.organizationData && (
                        <>
                          {/* Trust Graph Deep Dive */}
                          <div className="border-t border-white/5 pt-4">
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <Network className="w-3 h-3" />
                              🔭 Organization Trust Graph ({cluster.clusterName})
                            </h4>
                            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-500/20">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Network Stats */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-blue-300/80">Internal Nodes:</span>
                                    <span className="text-blue-300 font-medium">{cluster.organizationData.trustGraph.internalNodes}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-300/80">External Connections:</span>
                                    <span className="text-blue-300 font-medium">{cluster.organizationData.trustGraph.externalConnections}</span>
                                  </div>
                                  <div className="flex justify-between mb-2">
                                    <span className="text-purple-300/80">Net Flow:</span>
                                    <span className={`font-medium ${
                                      cluster.organizationData.trustGraph.trustFlowOut > cluster.organizationData.trustGraph.trustFlowIn 
                                        ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {cluster.organizationData.trustGraph.trustFlowOut > cluster.organizationData.trustGraph.trustFlowIn ? '+' : ''}
                                      {(cluster.organizationData.trustGraph.trustFlowOut - cluster.organizationData.trustGraph.trustFlowIn).toLocaleString()}
                                    </span>
                                  </div>
                                  <NetworkDensityGauge density={cluster.organizationData.trustGraph.networkDensity} />
                                </div>
                                {/* Trust Flow Chart */}
                                <div>
                                  <TrustFlowChart 
                                    trustIn={cluster.organizationData.trustGraph.trustFlowIn} 
                                    trustOut={cluster.organizationData.trustGraph.trustFlowOut}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Financial Activity Deep Dive */}
                          <div className="border-t border-white/5 pt-4">
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <DollarSign className="w-3 h-3" />
                              💰 Financial Activity & Local Spending
                            </h4>
                            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg p-3 border border-green-500/20">
                              <div className="grid grid-cols-2 gap-4">
                                {/* Financial Stats */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-green-300/80">Budget Allocated:</span>
                                    <span className="text-green-400 font-medium">${(cluster.organizationData.financialActivity.budgetAllocated / 1000000).toFixed(1)}M</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-300/80">Vendor Payments:</span>
                                    <span className="text-blue-400 font-medium">${(cluster.organizationData.financialActivity.vendorPayments / 1000000).toFixed(1)}M</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-purple-300/80">Contract Value:</span>
                                    <span className="text-purple-400 font-medium">${(cluster.organizationData.financialActivity.contractValue / 1000000).toFixed(1)}M</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-emerald-300/80">Funding Received:</span>
                                    <span className="text-emerald-400 font-medium">${(cluster.organizationData.financialActivity.fundingReceived / 1000000).toFixed(1)}M</span>
                                  </div>
                                  <div className="mt-1 pt-1 border-t border-white/10">
                                    <div className="flex justify-between">
                                      <span className="text-white/60">💳 Local Impact:</span>
                                      <span className="text-yellow-400 font-bold">
                                        {((cluster.organizationData.financialActivity.localSpending / cluster.organizationData.financialActivity.budgetSpent) * 100).toFixed(1)}% local
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Budget Donut Chart */}
                                <div className="flex justify-center">
                                  <BudgetDonutChart 
                                    allocated={cluster.organizationData.financialActivity.budgetAllocated}
                                    spent={cluster.organizationData.financialActivity.budgetSpent}
                                    local={cluster.organizationData.financialActivity.localSpending}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Operational Metrics Deep Dive */}
                          <div className="border-t border-white/5 pt-4">
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <BarChart3 className="w-3 h-3" />
                              📊 Operational Performance
                            </h4>
                            <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/20 rounded-lg p-3 border border-indigo-500/20">
                              <div className="space-y-3">
                                {/* Project Status Chart */}
                                <ProjectStatusChart 
                                  active={cluster.organizationData.operationalMetrics.projectsActive}
                                  completed={cluster.organizationData.operationalMetrics.projectsCompleted}
                                />
                                
                                {/* Operational Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-blue-300/80">👥 Employee Count:</span>
                                      <span className="text-blue-400 font-medium">{cluster.organizationData.operationalMetrics.employeeCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-purple-300/80">🗣️ Public Interactions:</span>
                                      <span className="text-purple-400 font-medium">{cluster.organizationData.operationalMetrics.publicInteractions.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-orange-300/80">📋 Service Requests:</span>
                                      <span className="text-orange-400 font-medium">{cluster.organizationData.operationalMetrics.serviceRequests}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-emerald-300/80">✅ Compliance:</span>
                                      <span className="text-emerald-400 font-medium">{cluster.organizationData.operationalMetrics.complianceScore}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* HCS Status Indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span>Data synchronized from HCS Topic {Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}