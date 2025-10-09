"use client"

import { Card, CardContent } from '@/components/ui/card'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

// Quick Stats for Action Dashboard - Compact Table Data
const quickStats = [
  { metric: 'Total Budget', value: '$8.2M', change: '+5.2%', status: 'up', action: 'Monitor allocation' },
  { metric: 'Active Members', value: '4,216', change: '+12.3%', status: 'up', action: 'Expand capacity' },
  { metric: 'Trust Health', value: '78%', change: '-3.1%', status: 'down', action: 'Investigate clusters' },
  { metric: 'Decisions/Month', value: '234', change: '+8.7%', status: 'up', action: 'Maintain pace' },
  { metric: 'Response Time', value: '2.1h', change: '-15%', status: 'up', action: 'Continue improvement' },
  { metric: 'Risk Level', value: 'Medium', change: '0%', status: 'stable', action: 'Tech cluster needs attention' }
]

// Community Investment Opportunities - Action-oriented
const investmentOpportunities = [
  {
    title: 'Tech Cluster Recovery',
    budget: '$450K',
    priority: 'CRITICAL',
    impact: 'High',
    timeline: '30 days',
    description: 'Trust rebuilding program for struggling tech innovators',
    metrics: { members: 1247, trustLoss: '-28%', riskLevel: 'HIGH' },
    action: 'Deploy emergency trust recovery resources'
  },
  {
    title: 'Community Org Expansion',
    budget: '$180K',
    priority: 'HIGH',
    impact: 'Medium',
    timeline: '45 days',
    description: 'Scale successful community programs across neighborhoods',
    metrics: { members: 892, growth: '+18%', satisfaction: '94%' },
    action: 'Fund expansion to 3 new districts'
  },
  {
    title: 'Arts District Initiative',
    budget: '$320K',
    priority: 'MEDIUM',
    impact: 'High',
    timeline: '60 days',
    description: 'Creative economy development and cultural investment',
    metrics: { members: 756, potential: '+45%', engagement: '82%' },
    action: 'Approve cultural district funding'
  }
]

// Resource Allocation Priorities
const resourceAllocations = [
  { cluster: 'Civic Leaders', allocated: '$3.2M', utilized: '88%', effectiveness: 'Excellent', needsAction: false },
  { cluster: 'Tech Innovators', allocated: '$1.2M', utilized: '92%', effectiveness: 'Poor', needsAction: true },
  { cluster: 'Community Orgs', allocated: '$850K', utilized: '76%', effectiveness: 'Good', needsAction: false },
  { cluster: 'Local Business', allocated: '$1.5M', utilized: '80%', effectiveness: 'Fair', needsAction: false },
  { cluster: 'Arts & Creators', allocated: '$680K', utilized: '75%', effectiveness: 'Good', needsAction: false },
  { cluster: 'Educators', allocated: '$920K', utilized: '80%', effectiveness: 'Declining', needsAction: true }
]

export default function OperationsPage() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-400" />
      case 'down': return <ArrowDown className="w-3 h-3 text-red-400" />
      case 'stable': return <Minus className="w-3 h-3 text-amber-400" />
      default: return <Minus className="w-3 h-3 text-white/60" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-white/10 text-white/60 border-white/20'
    }
  }

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'Excellent': return 'text-green-400'
      case 'Good': return 'text-blue-400'
      case 'Fair': return 'text-amber-400'
      case 'Poor': return 'text-red-400'
      case 'Declining': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Target className="w-5 h-5 text-[#00F6FF]" />
          Operations Dashboard
        </h1>
        <p className="text-sm text-white/80">
          Intelligence → Action • Community Investment Focus
        </p>
      </div>

      {/* Compact Quick Stats Table */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-3">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00F6FF]" />
            Quick Stats & Actions
          </h3>
          <div className="space-y-2">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-white/5 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white w-20">{stat.metric}</span>
                    <span className="text-xs font-bold text-[#00F6FF]">{stat.value}</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(stat.status)}
                      <span className={`text-xs ${
                        stat.status === 'up' ? 'text-green-400' :
                        stat.status === 'down' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>{stat.change}</span>
                    </div>
                  </div>
                  <span className="text-xs text-white/60 italic">{stat.action}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Investment Opportunities */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-3">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#00F6FF]" />
            Investment Opportunities
          </h3>
          <div className="space-y-3">
            {investmentOpportunities.map((opportunity, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">{opportunity.title}</h4>
                  <div className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(opportunity.priority)}`}>
                    {opportunity.priority}
                  </div>
                </div>
                <p className="text-xs text-white/70 mb-2">{opportunity.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-xs">
                    <span className="text-white/60">Budget: </span>
                    <span className="text-green-400 font-medium">{opportunity.budget}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-white/60">Timeline: </span>
                    <span className="text-white font-medium">{opportunity.timeline}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#00F6FF]/10 to-cyan-500/10 border border-[#00F6FF]/20 rounded p-2 mb-2">
                  <div className="text-xs text-[#00F6FF] font-medium mb-1">ACTION REQUIRED:</div>
                  <div className="text-xs text-white">{opportunity.action}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Impact: <span className="text-amber-400">{opportunity.impact}</span></span>
                  <span className="text-white/60">Members: <span className="text-white">{opportunity.metrics.members.toLocaleString()}</span></span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Allocation Monitor */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-3">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00F6FF]" />
            Resource Allocation Monitor
          </h3>
          <div className="space-y-2">
            {resourceAllocations.map((allocation, index) => (
              <div key={index} className={`bg-white/5 rounded p-2 ${allocation.needsAction ? 'border border-red-500/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white w-16">{allocation.cluster}</span>
                    <span className="text-xs text-green-400">{allocation.allocated}</span>
                    <span className="text-xs text-white/60">({allocation.utilized} used)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getEffectivenessColor(allocation.effectiveness)}`}>
                      {allocation.effectiveness}
                    </span>
                    {allocation.needsAction && (
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
