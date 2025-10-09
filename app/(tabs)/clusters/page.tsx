"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CommunityClusterModal } from '@/components/CommunityClusterModal'
import { CouncilMemberModal } from '@/components/CouncilMemberModal'
import { 
  Network,
  Users,
  BarChart3,
  Zap,
  Shield,
  Eye,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react'

// Mock data for 6 community clusters with larger member counts
const communityClusters = [
  {
    id: 'civic-leaders',
    name: 'Civic Leaders',
    members: 234,
    trustPercentage: 96,
    description: 'Municipal officials, policy makers, and community governance experts.',
    icon: Network,
    color: 'from-indigo-500 to-blue-600',
    activity: 'Critical',
    governance: 'Formal',
    budget: '$3.2M',
    projects: 31
  },
  {
    id: 'tech-innovators',
    name: 'Tech Innovators',
    members: 1247,
    trustPercentage: 89,
    description: 'Blockchain developers, AI researchers, and tech entrepreneurs driving digital transformation.',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    activity: 'Very High',
    governance: 'Decentralized',
    budget: '$2.1M',
    projects: 23
  },
  {
    id: 'local-businesses',
    name: 'Local Biz', 
    members: 634,
    trustPercentage: 76,
    description: 'Small business owners, entrepreneurs, and economic development advocates.',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    activity: 'Moderate',
    governance: 'Representative',
    budget: '$1.5M',
    projects: 12
  },
  {
    id: 'community-organizers',
    name: 'Community Orgs',
    members: 892,
    trustPercentage: 94,
    description: 'Event coordinators, neighborhood leaders, and social connectors building community bonds.',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    activity: 'High',
    governance: 'Democratic',
    budget: '$850K',
    projects: 17
  },
  {
    id: 'artists-creators',
    name: 'Arts & Creators',
    members: 756,
    trustPercentage: 82,
    description: 'Visual artists, musicians, writers, and creative professionals.',
    icon: Eye,
    color: 'from-pink-500 to-rose-500',
    activity: 'High',
    governance: 'Collaborative',
    budget: '$680K',
    projects: 19
  },
  {
    id: 'educators',
    name: 'Educators',
    members: 453,
    trustPercentage: 67,
    description: 'Teachers, professors, researchers, and educational administrators.',
    icon: Shield,
    color: 'from-purple-500 to-violet-500',
    activity: 'Steady',
    governance: 'Hierarchical',
    budget: '$920K',
    projects: 8
  }
]

// Mock council members data
const councilMembers = [
  {
    id: 'thomas-wright',
    name: 'Thomas Wright',
    role: 'Municipal Director',
    cluster: 'Civic Leaders',
    trustScore: 96,
    decisions: 234,
    satisfaction: 4.9,
    avatar: 'TW'
  },
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Tech Innovation Lead',
    cluster: 'Tech Innovators',
    trustScore: 94,
    decisions: 127,
    satisfaction: 4.8,
    avatar: 'SC'
  },
  {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    role: 'Economic Development',
    cluster: 'Local Biz',
    trustScore: 87,
    decisions: 156,
    satisfaction: 4.6,
    avatar: 'ER'
  },
  {
    id: 'marcus-johnson', 
    name: 'Marcus Johnson',
    role: 'Community Liaison',
    cluster: 'Community Orgs',
    trustScore: 91,
    decisions: 89,
    satisfaction: 4.7,
    avatar: 'MJ'
  },
  {
    id: 'maya-patel',
    name: 'Maya Patel',
    role: 'Creative Arts Director',
    cluster: 'Arts & Creators',
    trustScore: 82,
    decisions: 98,
    satisfaction: 4.7,
    avatar: 'MP'
  },
  {
    id: 'dr-james-liu',
    name: 'Dr. James Liu',
    role: 'Education Committee Chair',
    cluster: 'Educators',
    trustScore: 67,
    decisions: 76,
    satisfaction: 4.2,
    avatar: 'JL'
  }
]

export default function ClustersPage() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
          <Network className="w-5 h-5 text-[#00F6FF]" />
          Community Ecosystem
        </h1>
        <p className="text-sm text-white/80">
          Trust Network Overview • Live Cluster Data
        </p>
      </div>

      {/* Community Clusters */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-[#00F6FF]" />
            Community Clusters
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {communityClusters.map((cluster, index) => {
              // Muted background colors for each cluster
              const mutedColors = [
                'bg-indigo-900/20',    // Civic Leaders
                'bg-blue-900/20',      // Tech Innovators
                'bg-amber-900/20',     // Local Biz
                'bg-emerald-900/20',   // Community Orgs
                'bg-rose-900/20',      // Arts & Creators
                'bg-purple-900/20'     // Educators
              ]
              
              const accentColors = [
                'text-indigo-400',     // Civic Leaders
                'text-blue-400',       // Tech Innovators
                'text-amber-400',      // Local Biz
                'text-emerald-400',    // Community Orgs
                'text-rose-400',       // Arts & Creators
                'text-purple-400'      // Educators
              ]
              
              return (
                <Card 
                  key={cluster.id}
                  className={`${mutedColors[index]} border border-white/10 cursor-pointer transition-all duration-200 hover:border-white/30`}
                  onClick={() => setSelectedCluster(cluster.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">{cluster.name}</h4>
                      <div className={`text-sm font-bold ${accentColors[index]}`}>
                        {cluster.trustPercentage}%
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-white/70">
                      <div className="flex justify-between">
                        <span>Members:</span>
                        <span className="font-medium">{cluster.members.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projects:</span>
                        <span className="font-medium">{cluster.projects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Activity:</span>
                        <span className={`font-medium ${accentColors[index]}`}>{cluster.activity}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${accentColors[index].replace('text-', 'bg-')} transition-all duration-300`}
                        style={{ width: `${cluster.trustPercentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Council Members */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00F6FF]" />
            Council Members
          </h3>
          <div className="space-y-2">
            {councilMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedMember(member.id)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30 flex items-center justify-center">
                  <span className="text-xs font-medium text-[#00F6FF]">{member.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{member.name}</div>
                  <div className="text-xs text-white/60">{member.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00F6FF]">{member.trustScore}</div>
                  <div className="text-xs text-white/60">Trust</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CommunityClusterModal
        clusterId={selectedCluster}
        onClose={() => setSelectedCluster(null)}
      />
      
      <CouncilMemberModal
        memberId={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}
