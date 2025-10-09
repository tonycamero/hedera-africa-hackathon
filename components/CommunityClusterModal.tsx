"use client"

import { useState } from 'react'
import { 
  X,
  Users,
  TrendingUp,
  BarChart3,
  DollarSign,
  Network,
  Activity,
  Shield,
  Zap,
  Eye,
  Calendar,
  Target,
  Briefcase,
  MapPin,
  Clock
} from 'lucide-react'

// Mock member rosters for each cluster
const clusterMembers = {
  'civic-leaders': [
    { name: 'Thomas Wright', role: 'Municipal Director', trustScore: 96, avatar: 'TW', active: true, joinDate: '2021-03' },
    { name: 'Maria Santos', role: 'Deputy Mayor', trustScore: 92, avatar: 'MS', active: true, joinDate: '2021-05' },
    { name: 'David Kim', role: 'Budget Director', trustScore: 88, avatar: 'DK', active: true, joinDate: '2022-01' },
    { name: 'Lisa Johnson', role: 'Policy Analyst', trustScore: 84, avatar: 'LJ', active: true, joinDate: '2022-03' },
    { name: 'Robert Chen', role: 'Legal Counsel', trustScore: 91, avatar: 'RC', active: false, joinDate: '2021-08' },
    { name: 'Amanda Rodriguez', role: 'Communications Dir', trustScore: 87, avatar: 'AR', active: true, joinDate: '2022-07' }
  ],
  'tech-innovators': [
    { name: 'Sarah Chen', role: 'Tech Innovation Lead', trustScore: 94, avatar: 'SC', active: true, joinDate: '2021-06' },
    { name: 'Alex Kumar', role: 'Blockchain Developer', trustScore: 67, avatar: 'AK', active: false, joinDate: '2022-02' },
    { name: 'Jessica Williams', role: 'AI Researcher', trustScore: 43, avatar: 'JW', active: true, joinDate: '2023-01' },
    { name: 'Michael Torres', role: 'Full Stack Dev', trustScore: 38, avatar: 'MT', active: false, joinDate: '2023-03' },
    { name: 'Emma Davis', role: 'Data Scientist', trustScore: 71, avatar: 'ED', active: true, joinDate: '2022-09' },
    { name: 'James Liu', role: 'Security Engineer', trustScore: 29, avatar: 'JL', active: false, joinDate: '2023-05' }
  ],
  'local-businesses': [
    { name: 'Elena Rodriguez', role: 'Economic Development', trustScore: 87, avatar: 'ER', active: true, joinDate: '2021-04' },
    { name: 'Carlos Martinez', role: 'Restaurant Owner', trustScore: 82, avatar: 'CM', active: true, joinDate: '2021-11' },
    { name: 'Jennifer Wong', role: 'Retail Manager', trustScore: 75, avatar: 'JW', active: true, joinDate: '2022-02' },
    { name: 'Mark Thompson', role: 'Manufacturing Rep', trustScore: 69, avatar: 'MT', active: true, joinDate: '2022-06' },
    { name: 'Sofia Garcia', role: 'Tourism Director', trustScore: 78, avatar: 'SG', active: false, joinDate: '2021-12' },
    { name: 'Ryan O\'Connor', role: 'Startup Founder', trustScore: 81, avatar: 'RO', active: true, joinDate: '2023-01' }
  ],
  'community-organizers': [
    { name: 'Marcus Johnson', role: 'Community Liaison', trustScore: 91, avatar: 'MJ', active: true, joinDate: '2021-02' },
    { name: 'Rachel Green', role: 'Event Coordinator', trustScore: 89, avatar: 'RG', active: true, joinDate: '2021-07' },
    { name: 'Kevin Park', role: 'Neighborhood Rep', trustScore: 85, avatar: 'KP', active: true, joinDate: '2022-01' },
    { name: 'Alicia Brown', role: 'Volunteer Coordinator', trustScore: 92, avatar: 'AB', active: true, joinDate: '2021-09' },
    { name: 'Diego Morales', role: 'Youth Programs', trustScore: 88, avatar: 'DM', active: true, joinDate: '2022-04' },
    { name: 'Nina Patel', role: 'Senior Services', trustScore: 90, avatar: 'NP', active: false, joinDate: '2021-10' }
  ],
  'artists-creators': [
    { name: 'Maya Patel', role: 'Creative Arts Director', trustScore: 82, avatar: 'MP', active: true, joinDate: '2021-08' },
    { name: 'Jackson Miller', role: 'Musician', trustScore: 78, avatar: 'JM', active: true, joinDate: '2022-03' },
    { name: 'Zoe Anderson', role: 'Visual Artist', trustScore: 85, avatar: 'ZA', active: true, joinDate: '2021-12' },
    { name: 'Tyler Brooks', role: 'Writer', trustScore: 74, avatar: 'TB', active: false, joinDate: '2022-07' },
    { name: 'Aria Kim', role: 'Digital Designer', trustScore: 80, avatar: 'AK', active: true, joinDate: '2022-11' },
    { name: 'Liam Foster', role: 'Photographer', trustScore: 77, avatar: 'LF', active: true, joinDate: '2023-02' }
  ],
  'educators': [
    { name: 'Dr. James Liu', role: 'Education Committee Chair', trustScore: 67, avatar: 'JL', active: true, joinDate: '2021-01' },
    { name: 'Sarah Mitchell', role: 'High School Principal', trustScore: 71, avatar: 'SM', active: true, joinDate: '2021-06' },
    { name: 'Dr. Patricia Lee', role: 'University Professor', trustScore: 64, avatar: 'PL', active: false, joinDate: '2022-01' },
    { name: 'Carlos Ruiz', role: 'Elementary Teacher', trustScore: 69, avatar: 'CR', active: true, joinDate: '2022-05' },
    { name: 'Rebecca Taylor', role: 'Curriculum Developer', trustScore: 62, avatar: 'RT', active: true, joinDate: '2022-08' },
    { name: 'Antonio Silva', role: 'Adult Ed Coordinator', trustScore: 58, avatar: 'AS', active: false, joinDate: '2023-01' }
  ]
}

// Map cluster leaders to their clusters
const clusterLeaders = {
  'tech-innovators': {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Tech Innovation Lead',
    avatar: 'SC',
    trustScore: 94,
    decisions: 127,
    satisfaction: 4.8,
    background: {
      experience: '8 years',
      education: 'MIT Computer Science',
      specialization: 'Blockchain Architecture'
    },
    performance: {
      decisionSpeed: '1.2h',
      implementationRate: 96,
      stakeholderApproval: 94,
      crossClusterWork: 23
    }
  },
  'community-organizers': {
    id: 'marcus-johnson',
    name: 'Marcus Johnson', 
    role: 'Community Liaison',
    avatar: 'MJ',
    trustScore: 91,
    decisions: 89,
    satisfaction: 4.7,
    background: {
      experience: '12 years',
      education: 'Community Development Certification',
      specialization: 'Grassroots Organizing'
    },
    performance: {
      decisionSpeed: '2.1h',
      implementationRate: 89,
      stakeholderApproval: 96,
      crossClusterWork: 18
    }
  },
  'local-businesses': {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez',
    role: 'Economic Development Director',
    avatar: 'ER',
    trustScore: 87,
    decisions: 156,
    satisfaction: 4.6,
    background: {
      experience: '15 years',
      education: 'MBA Finance, CPA',
      specialization: 'Small Business Development'
    },
    performance: {
      decisionSpeed: '3.4h',
      implementationRate: 92,
      stakeholderApproval: 87,
      crossClusterWork: 15
    }
  },
  'civic-leaders': {
    id: 'thomas-wright',
    name: 'Thomas Wright',
    role: 'Municipal Director',
    avatar: 'TW',
    trustScore: 96,
    decisions: 234,
    satisfaction: 4.9,
    background: {
      experience: '22 years',
      education: 'Public Administration PhD',
      specialization: 'Municipal Governance'
    },
    performance: {
      decisionSpeed: '0.8h',
      implementationRate: 98,
      stakeholderApproval: 92,
      crossClusterWork: 31
    }
  },
  'artists-creators': {
    id: 'maya-patel',
    name: 'Maya Patel',
    role: 'Creative Arts Director',
    avatar: 'MP',
    trustScore: 82,
    decisions: 98,
    satisfaction: 4.7,
    background: {
      experience: '10 years',
      education: 'Fine Arts MFA',
      specialization: 'Digital Media & Community Arts'
    },
    performance: {
      decisionSpeed: '2.8h',
      implementationRate: 85,
      stakeholderApproval: 89,
      crossClusterWork: 19
    }
  },
  'educators': {
    id: 'dr-james-liu',
    name: 'Dr. James Liu',
    role: 'Education Committee Chair',
    avatar: 'JL',
    trustScore: 67,
    decisions: 76,
    satisfaction: 4.2,
    background: {
      experience: '18 years',
      education: 'Education PhD',
      specialization: 'Curriculum Development'
    },
    performance: {
      decisionSpeed: '6.1h',
      implementationRate: 78,
      stakeholderApproval: 71,
      crossClusterWork: 8
    }
  }
}

// Realistic civic governance data with varied performance
const clusterData = {
  'civic-leaders': {
    name: 'Civic Leaders',
    members: 234,
    trustPercentage: 96,
    icon: Network,
    color: 'from-indigo-500 to-blue-600',
    description: 'Municipal officials, policy makers, and community governance experts.',
    
    // Civic Health Metrics
    trustMetrics: {
      internal: 96,
      external: 89,
      velocity: 1.2,
      stability: 94
    },
    
    // Municipal Budget (Larger financial section)
    financial: {
      totalBudget: '$3.2M',
      allocated: '$2.8M',
      spent: '$2.1M',
      remaining: '$1.1M',
      utilizationRate: 75,
      avgProjectCost: '$103K',
      emergencyFund: '$400K',
      quarterlyBurn: '$670K'
    },
    
    // Growth & Sentiment
    growth: {
      memberGrowth: '+2.3%',
      participationGrowth: '+8.1%',
      budgetGrowth: '+12.5%',
      sentiment: 87,
      satisfaction: 91,
      publicApproval: 78
    },
    
    operational: {
      weeklyMeetings: 3,
      activeInitiatives: 31,
      completedProjects: 89,
      publicHearings: 12,
      avgResponseTime: '1.8d'
    },
    
    governance: {
      model: 'Municipal Council',
      votingPower: 'Elected representation',
      quorum: '60%',
      lastSession: '3 days ago',
      participation: 92
    },
    
    recentActivity: [
      { type: 'policy', title: 'Zoning Reform Approved', time: '2 days ago', impact: 'High' },
      { type: 'budget', title: 'Q3 Budget Review', time: '5 days ago', impact: 'Medium' },
      { type: 'public', title: 'Town Hall Meeting', time: '1 week ago', impact: 'High' },
      { type: 'emergency', title: 'Emergency Fund Allocation', time: '1 week ago', impact: 'Critical' }
    ]
  },
  
  'tech-innovators': {
    name: 'Tech Innovators',
    members: 1247,
    trustPercentage: 42,  // Struggling with trust
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    description: 'Blockchain developers and AI researchers. Recent controversies affecting trust.',
    
    // Trust Issues - this cluster is struggling
    trustMetrics: {
      internal: 56,
      external: 28,  // Very low external trust
      velocity: -0.8,  // Declining trust
      stability: 34
    },
    
    // Financial challenges
    financial: {
      totalBudget: '$2.1M',
      allocated: '$1.2M',  // Reduced allocation due to issues
      spent: '$1.1M',
      remaining: '$100K',  // Very low reserves
      utilizationRate: 92,
      avgProjectCost: '$87K',
      emergencyFund: '$50K',  // Depleted emergency fund
      quarterlyBurn: '$380K',
      riskLevel: 'HIGH',
      budgetHealth: 'CRITICAL'
    },
    
    // Poor growth metrics
    growth: {
      memberGrowth: '-8.2%',  // Losing members
      participationGrowth: '-12.4%',
      budgetGrowth: '-15.3%',  // Budget cuts
      sentiment: 34,  // Poor sentiment
      satisfaction: 41,
      publicApproval: 23,
      attritionRate: '12.3%',
      newMemberRate: '2.1%'
    },
    
    operational: {
      weeklyMeetings: 8,
      activeProjects: 23,
      completedProjects: 47,
      collaborations: 12,
      avgResponseTime: '2.3h'
    },
    
    governance: {
      model: 'Decentralized DAO',
      votingPower: 'Token-weighted',
      quorum: '67%',
      lastVote: '2 days ago',
      participation: 34  // Low participation
    },
    
    recentActivity: [
      { type: 'crisis', title: 'Data Privacy Incident', time: '3 days ago', impact: 'Critical' },
      { type: 'funding', title: 'Grant Application Denied', time: '1 week ago', impact: 'High' },
      { type: 'legal', title: 'Regulatory Compliance Review', time: '2 weeks ago', impact: 'High' },
      { type: 'exodus', title: '45 Members Left This Month', time: '3 weeks ago', impact: 'Critical' }
    ]
  },
  
  'community-organizers': {
    name: 'Community Organizers',
    members: 892,
    trustPercentage: 94,
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    description: 'Event coordinators, neighborhood leaders, and social connectors building community bonds.',
    
    trustMetrics: {
      internal: 96,
      external: 88,
      velocity: 3.2,
      stability: 93
    },
    
    financial: {
      budget: '$850K',
      spent: '$645K',
      allocated: 76,
      reserves: '$205K',
      avgGrant: '$18K'
    },
    
    operational: {
      weeklyMeetings: 12,
      activeProjects: 17,
      completedProjects: 63,
      collaborations: 18,
      avgResponseTime: '1.8h'
    },
    
    governance: {
      model: 'Democratic Council',
      votingPower: 'One person, one vote',
      quorum: '60%',
      lastVote: '5 days ago',
      participation: 94
    },
    
    network: {
      density: 0.91,
      bridges: 42,
      centralNodes: 12,
      subClusters: 5,
      isolation: 'Very Low'
    },
    
    recentActivity: [
      { type: 'event', title: 'Monthly Community Meetup', time: '1 day ago', impact: 'High' },
      { type: 'outreach', title: 'New Member Onboarding', time: '2 days ago', impact: 'Medium' },
      { type: 'partnership', title: 'Local Business Collaboration', time: '4 days ago', impact: 'High' },
      { type: 'initiative', title: 'Neighborhood Watch Program', time: '1 week ago', impact: 'Medium' }
    ]
  },
  
  'local-businesses': {
    name: 'Local Businesses',
    members: 634,
    trustPercentage: 76,
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    description: 'Small business owners, entrepreneurs, and economic development advocates.',
    
    trustMetrics: {
      internal: 82,
      external: 64,
      velocity: 1.9,
      stability: 87
    },
    
    financial: {
      budget: '$1.5M',
      spent: '$1.2M',
      allocated: 80,
      reserves: '$300K',
      avgGrant: '$32K'
    },
    
    operational: {
      weeklyMeetings: 6,
      activeProjects: 12,
      completedProjects: 29,
      collaborations: 8,
      avgResponseTime: '4.2h'
    },
    
    governance: {
      model: 'Representative Board',
      votingPower: 'Stake-weighted',
      quorum: '75%',
      lastVote: '1 week ago',
      participation: 76
    },
    
    network: {
      density: 0.67,
      bridges: 18,
      centralNodes: 6,
      subClusters: 4,
      isolation: 'Moderate'
    },
    
    recentActivity: [
      { type: 'funding', title: 'Small Business Grant Program', time: '2 days ago', impact: 'High' },
      { type: 'networking', title: 'Business Owners Breakfast', time: '4 days ago', impact: 'Medium' },
      { type: 'policy', title: 'Zoning Proposal Discussion', time: '1 week ago', impact: 'High' },
      { type: 'training', title: 'Digital Marketing Workshop', time: '1 week ago', impact: 'Low' }
    ]
  },
  
  'educators': {
    name: 'Educators',
    members: 453,
    trustPercentage: 67,
    icon: Shield,
    color: 'from-purple-500 to-violet-500',
    description: 'Teachers, professors, researchers, and educational administrators.',
    
    trustMetrics: {
      internal: 78,
      external: 52,
      velocity: 1.4,
      stability: 69
    },
    
    financial: {
      budget: '$920K',
      spent: '$734K',
      allocated: 80,
      reserves: '$186K',
      avgGrant: '$28K'
    },
    
    operational: {
      weeklyMeetings: 4,
      activeProjects: 8,
      completedProjects: 21,
      collaborations: 6,
      avgResponseTime: '6.1h'
    },
    
    governance: {
      model: 'Academic Hierarchy',
      votingPower: 'Tenure-weighted',
      quorum: '70%',
      lastVote: '2 weeks ago',
      participation: 67
    },
    
    network: {
      density: 0.54,
      bridges: 12,
      centralNodes: 4,
      subClusters: 6,
      isolation: 'High'
    },
    
    recentActivity: [
      { type: 'research', title: 'Trust in Education Study', time: '3 days ago', impact: 'Medium' },
      { type: 'curriculum', title: 'Blockchain Literacy Program', time: '1 week ago', impact: 'High' },
      { type: 'conference', title: 'Future of Learning Summit', time: '2 weeks ago', impact: 'Medium' },
      { type: 'collaboration', title: 'Industry Partnership', time: '3 weeks ago', impact: 'Low' }
    ]
  },
  
  'artists-creators': {
    name: 'Artists & Creators',
    members: 756,
    trustPercentage: 82,
    icon: Eye,
    color: 'from-pink-500 to-rose-500',
    description: 'Visual artists, musicians, writers, and creative professionals.',
    
    trustMetrics: {
      internal: 87,
      external: 71,
      velocity: 2.6,
      stability: 84
    },
    
    financial: {
      budget: '$680K',
      spent: '$512K',
      allocated: 75,
      reserves: '$168K',
      avgGrant: '$15K'
    },
    
    operational: {
      weeklyMeetings: 10,
      activeProjects: 19,
      completedProjects: 52,
      collaborations: 15,
      avgResponseTime: '3.1h'
    },
    
    governance: {
      model: 'Collaborative Collective',
      votingPower: 'Equal voice',
      quorum: '55%',
      lastVote: '4 days ago',
      participation: 82
    },
    
    network: {
      density: 0.79,
      bridges: 28,
      centralNodes: 9,
      subClusters: 4,
      isolation: 'Low'
    },
    
    recentActivity: [
      { type: 'showcase', title: 'Digital Art Exhibition', time: '1 day ago', impact: 'High' },
      { type: 'collaboration', title: 'Tech-Art Innovation Lab', time: '3 days ago', impact: 'High' },
      { type: 'workshop', title: 'NFT Creation Workshop', time: '1 week ago', impact: 'Medium' },
      { type: 'funding', title: 'Creative Grant Distribution', time: '1 week ago', impact: 'Medium' }
    ]
  },
  
  'civic-leaders': {
    name: 'Civic Leaders',
    members: 234,
    trustPercentage: 96,
    icon: Network,
    color: 'from-indigo-500 to-blue-600',
    description: 'Municipal officials, policy makers, and community governance experts.',
    
    trustMetrics: {
      internal: 98,
      external: 92,
      velocity: 3.8,
      stability: 97
    },
    
    financial: {
      budget: '$3.2M',
      spent: '$2.8M',
      allocated: 88,
      reserves: '$400K',
      avgGrant: '$45K'
    },
    
    operational: {
      weeklyMeetings: 15,
      activeProjects: 31,
      completedProjects: 78,
      collaborations: 24,
      avgResponseTime: '1.2h'
    },
    
    governance: {
      model: 'Municipal Council',
      votingPower: 'Official capacity',
      quorum: '80%',
      lastVote: '1 day ago',
      participation: 96
    },
    
    network: {
      density: 0.95,
      bridges: 56,
      centralNodes: 15,
      subClusters: 2,
      isolation: 'None'
    },
    
    recentActivity: [
      { type: 'policy', title: 'Trust Network Governance Act', time: '4h ago', impact: 'Critical' },
      { type: 'meeting', title: 'Inter-Cluster Coordination', time: '1 day ago', impact: 'High' },
      { type: 'budget', title: 'Q4 Resource Allocation', time: '2 days ago', impact: 'High' },
      { type: 'oversight', title: 'Network Health Review', time: '3 days ago', impact: 'Medium' }
    ]
  }
}

interface CommunityClusterModalProps {
  clusterId: string | null
  onClose: () => void
}

export function CommunityClusterModal({ clusterId, onClose }: CommunityClusterModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'financial' | 'network'>('overview')
  
  if (!clusterId || !clusterData[clusterId as keyof typeof clusterData]) return null
  
  const cluster = clusterData[clusterId as keyof typeof clusterData]
  const leader = clusterLeaders[clusterId as keyof typeof clusterLeaders]
  const Icon = cluster.icon

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <Briefcase className="w-3 h-3" />
      case 'funding': return <DollarSign className="w-3 h-3" />
      case 'collaboration': return <Network className="w-3 h-3" />
      case 'governance': return <Shield className="w-3 h-3" />
      case 'event': return <Calendar className="w-3 h-3" />
      case 'policy': return <Shield className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  const getActivityColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'text-red-400 bg-red-400/10'
      case 'High': return 'text-green-400 bg-green-400/10'
      case 'Medium': return 'text-amber-400 bg-amber-400/10'
      case 'Low': return 'text-blue-400 bg-blue-400/10'
      default: return 'text-white/60 bg-white/5'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-xl border border-[#00F6FF]/30 shadow-2xl rounded-xl animate-in zoom-in-90 fade-in-0 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cluster.color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{cluster.name}</h2>
                <div className="text-sm text-white/80">{cluster.members.toLocaleString()} members • {cluster.trustPercentage}% trust</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'network', label: 'Network', icon: Network }
            ].map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#00F6FF]/20 text-[#00F6FF] border border-[#00F6FF]/30'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-3 h-3" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* CLUSTER LEADER - IN THE CROSSHAIRS! */}
          <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border-2 border-[#00F6FF]/30 flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-[#00F6FF]">{leader?.avatar || 'CL'}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{leader?.name || 'Cluster Leader'}</h3>
                <div className="text-sm text-white/80">{leader?.role || 'Cluster Administrator'}</div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-white/60">Responsible for this cluster</span>
                  <div className="flex items-center gap-1 text-green-400">
                    <span>Trust: {leader?.trustScore || cluster.trustPercentage}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60">Performance</div>
                <div className="text-sm font-bold text-amber-400">{leader?.performance?.stakeholderApproval || 0}% approval</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 bg-white/5 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg font-bold text-[#00F6FF]">{leader?.decisions || 0}</div>
                <div className="text-xs text-white/60">Decisions Made</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{leader?.satisfaction || 0}</div>
                <div className="text-xs text-white/60">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{leader?.performance?.decisionSpeed || 'N/A'}</div>
                <div className="text-xs text-white/60">Avg Decision Speed</div>
              </div>
            </div>
          </div>
          
          {activeTab === 'overview' && (
            <>
              <div className="text-sm text-white/80 bg-white/5 rounded-lg p-3 border border-white/10">
                {cluster.description}
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Active Projects</div>
                  <div className="text-xl font-bold text-white">{cluster.operational.activeProjects}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Budget Allocated</div>
                  <div className="text-xl font-bold text-green-400">{cluster.financial.allocated}%</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Weekly Meetings</div>
                  <div className="text-xl font-bold text-blue-400">{cluster.operational.weeklyMeetings}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Response Time</div>
                  <div className="text-xl font-bold text-amber-400">{cluster.operational.avgResponseTime}</div>
                </div>
              </div>

              {/* Governance */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Governance</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Model:</span>
                    <span className="text-white">{cluster.governance.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Participation:</span>
                    <span className="text-green-400">{cluster.governance.participation}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Last Vote:</span>
                    <span className="text-white">{cluster.governance.lastVote}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {cluster.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <div className="text-white/60 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{activity.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/60">{activity.time}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.impact)}`}>
                            {activity.impact}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'members' && (
            <>
              {/* Member Roster */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">Cluster Members</h4>
                  <div className="text-xs text-white/60">
                    Showing {Math.min(6, clusterMembers[clusterId as keyof typeof clusterMembers]?.length || 0)} of {cluster.members.toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).slice(0, 6).map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${member.active ? 'bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border border-[#00F6FF]/30' : 'bg-gray-600/20 border border-gray-500/30'} flex items-center justify-center`}>
                        <span className={`text-xs font-medium ${member.active ? 'text-[#00F6FF]' : 'text-gray-400'}`}>{member.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${member.active ? 'text-white' : 'text-white/50'}`}>{member.name}</div>
                        <div className="text-xs text-white/60">{member.role}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${
                          member.trustScore >= 80 ? 'text-green-400' :
                          member.trustScore >= 60 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{member.trustScore}%</div>
                        <div className="text-xs text-white/60">Trust</div>
                      </div>
                      <div className="ml-2">
                        {member.active ? (
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Active Members</div>
                  <div className="text-lg font-bold text-green-400">
                    {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).filter(m => m.active).length}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Inactive Members</div>
                  <div className="text-lg font-bold text-red-400">
                    {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).filter(m => !m.active).length}
                  </div>
                </div>
              </div>

              {/* Member Trust Distribution */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-2">Trust Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">High Trust (80%+):</span>
                    <span className="text-green-400 font-medium">
                      {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).filter(m => m.trustScore >= 80).length} members
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Medium Trust (60-79%):</span>
                    <span className="text-amber-400 font-medium">
                      {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).filter(m => m.trustScore >= 60 && m.trustScore < 80).length} members
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Low Trust (&lt;60%):</span>
                    <span className="text-red-400 font-medium">
                      {(clusterMembers[clusterId as keyof typeof clusterMembers] || []).filter(m => m.trustScore < 60).length} members
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'trust' && (
            <>
              {/* Trust Flow Bars */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Internal Trust</span>
                    <span className="text-white font-medium">{cluster.trustMetrics.internal}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${cluster.color}`}
                      style={{ width: `${cluster.trustMetrics.internal}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">External Trust</span>
                    <span className="text-white font-medium">{cluster.trustMetrics.external}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${cluster.trustMetrics.external}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Trust Stability</span>
                    <span className="text-white font-medium">{cluster.trustMetrics.stability}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${cluster.trustMetrics.stability}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Trust Velocity Gauge */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <h4 className="text-sm font-medium text-white mb-2">Trust Velocity</h4>
                <div className="text-3xl font-bold text-[#00F6FF] mb-1">{cluster.trustMetrics.velocity}x</div>
                <div className="text-xs text-white/60">Speed of trust allocation</div>
              </div>
            </>
          )}

          {activeTab === 'financial' && (
            <>
              {/* Budget Donut Chart Data */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">Budget Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{cluster.financial.budget}</div>
                    <div className="text-xs text-white/60">Total Budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{cluster.financial.spent}</div>
                    <div className="text-xs text-white/60">Amount Spent</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">Budget Utilization</span>
                    <span className="text-white">{cluster.financial.allocated}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-amber-500"
                      style={{ width: `${cluster.financial.allocated}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Reserves</div>
                  <div className="text-lg font-bold text-blue-400">{cluster.financial.reserves}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Avg Grant Size</div>
                  <div className="text-lg font-bold text-purple-400">{cluster.financial.avgGrant}</div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'network' && (
            <>
              {/* Network Density Gauge */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <h4 className="text-sm font-medium text-white mb-2">Network Density</h4>
                <div className="text-3xl font-bold text-[#00F6FF] mb-1">{cluster.network.density}</div>
                <div className="text-xs text-white/60">Connectivity strength</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Bridge Nodes</div>
                  <div className="text-xl font-bold text-cyan-400">{cluster.network.bridges}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Central Nodes</div>
                  <div className="text-xl font-bold text-green-400">{cluster.network.centralNodes}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Sub-Clusters</div>
                  <div className="text-xl font-bold text-purple-400">{cluster.network.subClusters}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Isolation</div>
                  <div className={`text-sm font-bold ${
                    cluster.network.isolation === 'None' || cluster.network.isolation === 'Very Low' 
                      ? 'text-green-400' 
                      : cluster.network.isolation === 'Low' || cluster.network.isolation === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {cluster.network.isolation}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}