"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  Network,
  BarChart3,
  Activity,
  Zap,
  Shield,
  Eye
} from 'lucide-react'

// Mock intelligence data for 6 community clusters
const clusterInsights = [
  {
    id: 'tech-innovators',
    name: 'Tech Innovators',
    type: 'GROWTH',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    insight: '+32% trust allocation this week',
    details: 'New blockchain developers joining rapidly. Strong collaboration metrics.',
    trustFlow: 85,
    activity: 'HIGH',
    members: 156
  },
  {
    id: 'community-organizers',
    name: 'Community Organizers',
    type: 'STABLE',
    icon: Users,
    color: 'from-green-500 to-emerald-500', 
    insight: 'Consistent engagement patterns',
    details: 'Regular meetups driving trust formation. Event coordination excellence.',
    trustFlow: 78,
    activity: 'STEADY',
    members: 234
  },
  {
    id: 'local-businesses',
    name: 'Local Businesses',
    type: 'OPPORTUNITY',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    insight: 'Untapped collaboration potential',
    details: 'Low inter-cluster trust but high internal cohesion. Bridge opportunity.',
    trustFlow: 45,
    activity: 'MODERATE',
    members: 89
  },
  {
    id: 'educators',
    name: 'Educators',
    type: 'CONCERN',
    icon: Shield,
    color: 'from-red-500 to-pink-500',
    insight: 'Trust fragmentation detected',
    details: 'Multiple sub-clusters forming. Need intervention for unity.',
    trustFlow: 32,
    activity: 'LOW',
    members: 67
  },
  {
    id: 'artists-creators',
    name: 'Artists & Creators',
    type: 'EMERGING',
    icon: Eye,
    color: 'from-purple-500 to-violet-500',
    insight: 'New trust patterns forming',
    details: 'Cross-pollination with tech cluster creating innovation.',
    trustFlow: 68,
    activity: 'GROWING',
    members: 123
  },
  {
    id: 'civic-leaders',
    name: 'Civic Leaders',
    type: 'CRITICAL',
    icon: Network,
    color: 'from-indigo-500 to-blue-600',
    insight: 'Central hub strengthening',
    details: 'High trust allocation from all other clusters. Key network node.',
    trustFlow: 94,
    activity: 'CRITICAL',
    members: 45
  }
]

// Cross-cluster trend metrics
const trendMetrics = [
  { 
    label: 'Inter-Cluster Trust',
    value: '+18%',
    trend: 'up',
    description: 'Trust flowing between different clusters'
  },
  {
    label: 'Network Density',
    value: '0.73',
    trend: 'stable',
    description: 'Overall network connectivity strength'
  },
  {
    label: 'Active Bridges',
    value: '12',
    trend: 'up',
    description: 'Key members connecting multiple clusters'
  },
  {
    label: 'Trust Velocity',
    value: '2.4x',
    trend: 'up',
    description: 'Speed of trust allocation across network'
  }
]

export default function IntelligencePage() {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'GROWTH': return <TrendingUp className="w-4 h-4" />
      case 'STABLE': return <CheckCircle className="w-4 h-4" />
      case 'OPPORTUNITY': return <Eye className="w-4 h-4" />
      case 'CONCERN': return <AlertTriangle className="w-4 h-4" />
      case 'EMERGING': return <Activity className="w-4 h-4" />
      case 'CRITICAL': return <Zap className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'GROWTH': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'STABLE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'OPPORTUNITY': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      case 'CONCERN': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'EMERGING': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'CRITICAL': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Brain className="w-5 h-5 text-[#00F6FF]" />
          Community Intelligence
        </h1>
        <p className="text-sm text-white/80">
          Daily Analytics Summary • Cross-Cluster Insights
        </p>
      </div>

      {/* Cross-Cluster Trends */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00F6FF]" />
            Cross-Cluster Trends
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {trendMetrics.map((metric, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">{metric.label}</span>
                  <div className={`flex items-center gap-1 ${
                    metric.trend === 'up' ? 'text-green-400' : 
                    metric.trend === 'down' ? 'text-red-400' : 'text-white/60'
                  }`}>
                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                     metric.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : 
                     <div className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                </div>
                <div className="text-lg font-bold text-white mb-1">{metric.value}</div>
                <div className="text-xs text-white/50">{metric.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cluster Intelligence Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Network className="w-4 h-4 text-[#00F6FF]" />
          Cluster Highlights
        </h3>
        
        {clusterInsights.map((cluster) => {
          const Icon = cluster.icon
          const isExpanded = expandedInsight === cluster.id
          
          return (
            <Card 
              key={cluster.id}
              className={`bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 cursor-pointer transition-all duration-300 ${
                isExpanded ? 'border-[#00F6FF]/30 shadow-lg' : 'hover:border-white/30'
              }`}
              onClick={() => setExpandedInsight(isExpanded ? null : cluster.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${cluster.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{cluster.name}</span>
                      <div className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getInsightColor(cluster.type)}`}>
                        {getInsightIcon(cluster.type)}
                        {cluster.type}
                      </div>
                    </div>
                    <div className="text-xs text-[#00F6FF] font-medium">{cluster.insight}</div>
                  </div>
                </div>

                {/* Telescopic expansion */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-white/80">{cluster.details}</p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{cluster.trustFlow}%</div>
                        <div className="text-xs text-white/60">Trust Flow</div>
                        <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full bg-gradient-to-r ${cluster.color}`}
                            style={{ width: `${cluster.trustFlow}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{cluster.members}</div>
                        <div className="text-xs text-white/60">Members</div>
                        <div className="mt-1">
                          <Users className="w-3 h-3 mx-auto text-white/40" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          cluster.activity === 'HIGH' ? 'text-green-400 bg-green-400/10' :
                          cluster.activity === 'CRITICAL' ? 'text-cyan-400 bg-cyan-400/10' :
                          cluster.activity === 'GROWING' ? 'text-purple-400 bg-purple-400/10' :
                          cluster.activity === 'STEADY' ? 'text-blue-400 bg-blue-400/10' :
                          cluster.activity === 'MODERATE' ? 'text-amber-400 bg-amber-400/10' :
                          'text-red-400 bg-red-400/10'
                        }`}>
                          {cluster.activity}
                        </div>
                        <div className="text-xs text-white/60 mt-1">Activity</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
