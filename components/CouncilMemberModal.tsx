"use client"

import { useState } from 'react'
import { 
  X,
  User,
  TrendingUp,
  BarChart3,
  Shield,
  Network,
  Activity,
  Calendar,
  Award,
  MessageCircle,
  Clock,
  Target,
  Users,
  CheckCircle,
  Star
} from 'lucide-react'

// Detailed council member data
const memberData = {
  'sarah-chen': {
    name: 'Sarah Chen',
    role: 'Tech Innovation Lead',
    cluster: 'Tech Innovators',
    avatar: 'SC',
    trustScore: 94,
    decisions: 127,
    satisfaction: 4.8,
    
    // Professional Background
    background: {
      experience: '8 years',
      education: 'MIT Computer Science',
      specialization: 'Blockchain Architecture',
      previousRole: 'Senior Developer at Web3 Startup'
    },
    
    // Trust & Network Analytics
    trustAnalytics: {
      trustGiven: 89,
      trustReceived: 94,
      networkReach: 1247,
      influenceScore: 92,
      collaborationIndex: 87
    },
    
    // Performance Metrics
    performance: {
      decisionSpeed: '1.2h',
      implementationRate: 96,
      stakeholderApproval: 94,
      crossClusterWork: 23,
      innovationIndex: 91
    },
    
    // Financial Activity
    financial: {
      budgetManaged: '$340K',
      grantsApproved: 23,
      avgGrantSize: '$14.8K',
      riskScore: 'Low',
      fiduciaryRating: 'A+'
    },
    
    // Recent Decisions & Activities
    recentDecisions: [
      { 
        title: 'AI Ethics Framework Approval',
        date: '2 days ago',
        impact: 'High',
        stakeholders: 156,
        outcome: 'Passed',
        satisfaction: 4.9
      },
      {
        title: 'Blockchain Education Grant',
        date: '1 week ago', 
        impact: 'Medium',
        stakeholders: 89,
        outcome: 'Approved',
        satisfaction: 4.7
      },
      {
        title: 'Cross-Cluster Innovation Fund',
        date: '2 weeks ago',
        impact: 'High', 
        stakeholders: 234,
        outcome: 'Passed',
        satisfaction: 4.8
      }
    ],
    
    // Network Connections
    connections: {
      directReports: 12,
      peerConnections: 34,
      crossClusterTies: 89,
      mentorshipRelations: 8,
      networkGrowth: '+12%'
    },
    
    // Expertise Areas
    expertise: [
      { area: 'Blockchain Development', level: 95 },
      { area: 'Technical Leadership', level: 91 },
      { area: 'Community Building', level: 87 },
      { area: 'Innovation Strategy', level: 89 },
      { area: 'Cross-functional Collaboration', level: 92 }
    ]
  },

  'marcus-johnson': {
    name: 'Marcus Johnson',
    role: 'Community Liaison',
    cluster: 'Community Organizers',
    avatar: 'MJ',
    trustScore: 91,
    decisions: 89,
    satisfaction: 4.7,
    
    background: {
      experience: '12 years',
      education: 'Community Development Certification',
      specialization: 'Grassroots Organizing',
      previousRole: 'Neighborhood Association President'
    },
    
    trustAnalytics: {
      trustGiven: 91,
      trustReceived: 89,
      networkReach: 892,
      influenceScore: 94,
      collaborationIndex: 96
    },
    
    performance: {
      decisionSpeed: '2.1h',
      implementationRate: 89,
      stakeholderApproval: 96,
      crossClusterWork: 18,
      innovationIndex: 73
    },
    
    financial: {
      budgetManaged: '$125K',
      grantsApproved: 17,
      avgGrantSize: '$7.4K',
      riskScore: 'Very Low',
      fiduciaryRating: 'A+'
    },
    
    recentDecisions: [
      {
        title: 'Monthly Community Meetup Budget',
        date: '3 days ago',
        impact: 'Medium',
        stakeholders: 234,
        outcome: 'Approved',
        satisfaction: 4.8
      },
      {
        title: 'Neighborhood Watch Program',
        date: '1 week ago',
        impact: 'High',
        stakeholders: 156,
        outcome: 'Passed',
        satisfaction: 4.9
      },
      {
        title: 'Local Business Partnership',
        date: '2 weeks ago',
        impact: 'Medium',
        stakeholders: 89,
        outcome: 'Approved',
        satisfaction: 4.6
      }
    ],
    
    connections: {
      directReports: 8,
      peerConnections: 45,
      crossClusterTies: 67,
      mentorshipRelations: 12,
      networkGrowth: '+18%'
    },
    
    expertise: [
      { area: 'Community Engagement', level: 96 },
      { area: 'Event Coordination', level: 94 },
      { area: 'Stakeholder Relations', level: 92 },
      { area: 'Conflict Resolution', level: 89 },
      { area: 'Local Government Relations', level: 85 }
    ]
  },

  'elena-rodriguez': {
    name: 'Elena Rodriguez',
    role: 'Economic Development',
    cluster: 'Local Businesses',
    avatar: 'ER',
    trustScore: 87,
    decisions: 156,
    satisfaction: 4.6,
    
    background: {
      experience: '15 years',
      education: 'MBA Finance, CPA',
      specialization: 'Small Business Development',
      previousRole: 'Regional Development Director'
    },
    
    trustAnalytics: {
      trustGiven: 82,
      trustReceived: 87,
      networkReach: 634,
      influenceScore: 89,
      collaborationIndex: 78
    },
    
    performance: {
      decisionSpeed: '3.4h',
      implementationRate: 92,
      stakeholderApproval: 87,
      crossClusterWork: 15,
      innovationIndex: 81
    },
    
    financial: {
      budgetManaged: '$890K',
      grantsApproved: 42,
      avgGrantSize: '$21.2K',
      riskScore: 'Moderate',
      fiduciaryRating: 'A'
    },
    
    recentDecisions: [
      {
        title: 'Small Business Recovery Fund',
        date: '1 day ago',
        impact: 'High',
        stakeholders: 298,
        outcome: 'Approved',
        satisfaction: 4.7
      },
      {
        title: 'Downtown Revitalization Grant',
        date: '4 days ago',
        impact: 'High',
        stakeholders: 156,
        outcome: 'Passed',
        satisfaction: 4.8
      },
      {
        title: 'Local Procurement Policy',
        date: '1 week ago',
        impact: 'Medium',
        stakeholders: 123,
        outcome: 'Approved',
        satisfaction: 4.5
      }
    ],
    
    connections: {
      directReports: 15,
      peerConnections: 28,
      crossClusterTies: 45,
      mentorshipRelations: 6,
      networkGrowth: '+8%'
    },
    
    expertise: [
      { area: 'Financial Management', level: 94 },
      { area: 'Economic Policy', level: 91 },
      { area: 'Business Development', level: 89 },
      { area: 'Grant Writing', level: 86 },
      { area: 'Risk Assessment', level: 92 }
    ]
  }
}

interface CouncilMemberModalProps {
  memberId: string | null
  onClose: () => void
}

export function CouncilMemberModal({ memberId, onClose }: CouncilMemberModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'trust' | 'performance' | 'network'>('profile')
  
  if (!memberId || !memberData[memberId as keyof typeof memberData]) return null
  
  const member = memberData[memberId as keyof typeof memberData]

  const getDecisionOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Passed': return 'text-green-400 bg-green-400/10'
      case 'Approved': return 'text-blue-400 bg-blue-400/10'
      case 'Rejected': return 'text-red-400 bg-red-400/10'
      case 'Pending': return 'text-amber-400 bg-amber-400/10'
      default: return 'text-white/60 bg-white/5'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-green-400'
      case 'Medium': return 'text-amber-400'
      case 'Low': return 'text-blue-400'
      default: return 'text-white/60'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Very Low': return 'text-green-400'
      case 'Low': return 'text-blue-400'
      case 'Moderate': return 'text-amber-400'
      case 'High': return 'text-red-400'
      default: return 'text-white/60'
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00F6FF]/20 to-cyan-500/20 border-2 border-[#00F6FF]/30 flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-[#00F6FF]">{member.avatar}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{member.name}</h2>
                <div className="text-sm text-white/80">{member.role}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/60">{member.cluster}</span>
                  <div className="flex items-center gap-1 text-green-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{member.trustScore}</span>
                  </div>
                </div>
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
          <div className="flex gap-1 mt-4 bg-white/5 rounded-lg p-1">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'trust', label: 'Trust', icon: Shield },
              { id: 'performance', label: 'Performance', icon: Target },
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
          {activeTab === 'profile' && (
            <>
              {/* Background Info */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Background</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Experience:</span>
                    <span className="text-white">{member.background.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Education:</span>
                    <span className="text-white">{member.background.education}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Specialization:</span>
                    <span className="text-white">{member.background.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Previous Role:</span>
                    <span className="text-white text-right max-w-[60%]">{member.background.previousRole}</span>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#00F6FF]">{member.decisions}</div>
                  <div className="text-xs text-white/60">Decisions</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{member.satisfaction}</div>
                  <div className="text-xs text-white/60">Rating</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">{member.financial.grantsApproved}</div>
                  <div className="text-xs text-white/60">Grants</div>
                </div>
              </div>

              {/* Expertise Areas */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Expertise Areas</h3>
                <div className="space-y-2">
                  {member.expertise.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/80">{skill.area}</span>
                        <span className="text-white font-medium">{skill.level}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full bg-gradient-to-r from-[#00F6FF] to-cyan-500"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Decisions */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Recent Decisions</h3>
                <div className="space-y-2">
                  {member.recentDecisions.map((decision, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-2">
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-xs font-medium text-white">{decision.title}</div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDecisionOutcomeColor(decision.outcome)}`}>
                          {decision.outcome}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{decision.date}</span>
                        <div className="flex items-center gap-2">
                          <span className={getImpactColor(decision.impact)}>{decision.impact}</span>
                          <span className="text-white/60">•</span>
                          <span className="text-amber-400">{decision.satisfaction}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'trust' && (
            <>
              {/* Trust Score Gauge */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <h4 className="text-sm font-medium text-white mb-2">Overall Trust Score</h4>
                <div className="text-4xl font-bold text-[#00F6FF] mb-1">{member.trustScore}</div>
                <div className="text-xs text-white/60">Community Trust Rating</div>
              </div>

              {/* Trust Analytics */}
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Trust Given</span>
                    <span className="text-white font-medium">{member.trustAnalytics.trustGiven}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${member.trustAnalytics.trustGiven}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Trust Received</span>
                    <span className="text-white font-medium">{member.trustAnalytics.trustReceived}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${member.trustAnalytics.trustReceived}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/60">Collaboration Index</span>
                    <span className="text-white font-medium">{member.trustAnalytics.collaborationIndex}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${member.trustAnalytics.collaborationIndex}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-cyan-400">{member.trustAnalytics.networkReach.toLocaleString()}</div>
                  <div className="text-xs text-white/60">Network Reach</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{member.trustAnalytics.influenceScore}</div>
                  <div className="text-xs text-white/60">Influence Score</div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'performance' && (
            <>
              {/* Performance Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Decision Speed</div>
                  <div className="text-lg font-bold text-green-400">{member.performance.decisionSpeed}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Implementation</div>
                  <div className="text-lg font-bold text-blue-400">{member.performance.implementationRate}%</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Approval Rating</div>
                  <div className="text-lg font-bold text-purple-400">{member.performance.stakeholderApproval}%</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Innovation Index</div>
                  <div className="text-lg font-bold text-amber-400">{member.performance.innovationIndex}</div>
                </div>
              </div>

              {/* Financial Management */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Financial Management</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Budget Managed:</span>
                    <span className="text-green-400 font-medium">{member.financial.budgetManaged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Grants Approved:</span>
                    <span className="text-white">{member.financial.grantsApproved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Avg Grant Size:</span>
                    <span className="text-white">{member.financial.avgGrantSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Risk Score:</span>
                    <span className={getRiskColor(member.financial.riskScore)}>{member.financial.riskScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Fiduciary Rating:</span>
                    <span className="text-green-400 font-medium">{member.financial.fiduciaryRating}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'network' && (
            <>
              {/* Network Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Direct Reports</div>
                  <div className="text-xl font-bold text-cyan-400">{member.connections.directReports}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Peer Connections</div>
                  <div className="text-xl font-bold text-green-400">{member.connections.peerConnections}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Cross-Cluster</div>
                  <div className="text-xl font-bold text-purple-400">{member.connections.crossClusterTies}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/60 mb-1">Network Growth</div>
                  <div className="text-xl font-bold text-amber-400">{member.connections.networkGrowth}</div>
                </div>
              </div>

              {/* Mentorship & Leadership */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
                <h4 className="text-sm font-medium text-white mb-2">Mentorship Relations</h4>
                <div className="text-3xl font-bold text-[#00F6FF] mb-1">{member.connections.mentorshipRelations}</div>
                <div className="text-xs text-white/60">Active mentoring relationships</div>
              </div>

              {/* Cross-Cluster Work */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Cross-Cluster Activity</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{member.performance.crossClusterWork}</div>
                  <div className="text-xs text-white/60">Projects with other clusters this quarter</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}