"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Building2,
  Users,
  Shield,
  MessageSquare,
  Award,
  DollarSign,
  MapPin,
  Network,
  Newspaper
} from "lucide-react"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"

interface ClusterInsight {
  id: string;
  clusterId: string;
  clusterName: string;
  clusterIcon: string;
  type: "trend" | "alert" | "opportunity" | "achievement";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  timeframe: string;
  metrics: {
    value: number | string;
    change?: number;
    changeType?: "increase" | "decrease" | "stable";
  };
  actionable: boolean;
  priority: number;
}

interface CommunityRoundup {
  date: string;
  totalClusters: number;
  totalMembers: number;
  averageTrust: number;
  keyHighlights: ClusterInsight[];
  crossClusterTrends: {
    memberGrowth: number;
    trustMovement: number;
    activityLevel: number;
    collaborationIndex: number;
  };
}

// Community Intelligence Roundup based on real cluster data
const todaysRoundup: CommunityRoundup = {
  date: "2024-10-09",
  totalClusters: 6,
  totalMembers: 4681, // Sum of all cluster members
  averageTrust: 85.2, // Average trust across clusters
  keyHighlights: [
    {
      id: "highlight-1",
      clusterId: "education",
      clusterName: "Education Sector",
      clusterIcon: "🏫",
      type: "achievement",
      title: "Education Leads Trust Rankings",
      description: "Education sector reaches 93% trust score, highest in community ecosystem",
      impact: "high",
      timeframe: "Current",
      metrics: {
        value: "93%",
        change: 2.1,
        changeType: "increase"
      },
      actionable: true,
      priority: 1
    },
    {
      id: "highlight-2",
      clusterId: "faith",
      clusterName: "Faith Communities",
      clusterIcon: "⛪",
      type: "trend",
      title: "Faith Communities Show Strong Engagement",
      description: "1,567 active members out of 1,812 total - 86% participation rate leading all clusters",
      impact: "high",
      timeframe: "Last 7 days",
      metrics: {
        value: "86%",
        change: 4.3,
        changeType: "increase"
      },
      actionable: false,
      priority: 2
    },
    {
      id: "highlight-3",
      clusterId: "business",
      clusterName: "Business & Industry",
      clusterIcon: "🏭",
      type: "opportunity",
      title: "Economic Impact Potential",
      description: "$24.5M local spending generates highest economic multiplier effect",
      impact: "high",
      timeframe: "Q4 Projection",
      metrics: {
        value: "$45.2M",
        change: 12.7,
        changeType: "increase"
      },
      actionable: true,
      priority: 3
    },
    {
      id: "highlight-4",
      clusterId: "neighborhood",
      clusterName: "Neighborhood Councils",
      clusterIcon: "🏘️",
      type: "alert",
      title: "Participation Gap Identified",
      description: "Only 74% voting participation - opportunity for civic engagement improvement",
      impact: "medium",
      timeframe: "Last 30 days",
      metrics: {
        value: "74%",
        change: -3.2,
        changeType: "decrease"
      },
      actionable: true,
      priority: 4
    },
    {
      id: "highlight-5",
      clusterId: "cultural",
      clusterName: "Arts & Culture",
      clusterIcon: "🎨",
      type: "trend",
      title: "Cultural Network Density Peak",
      description: "Arts cluster achieves 81% network density - strongest internal connections",
      impact: "medium",
      timeframe: "Current",
      metrics: {
        value: "81%",
        change: 5.8,
        changeType: "increase"
      },
      actionable: false,
      priority: 5
    },
    {
      id: "highlight-6",
      clusterId: "municipal",
      clusterName: "Municipal Core",
      clusterIcon: "🏛️",
      type: "trend",
      title: "Cross-Cluster Coordination Rising",
      description: "234 cross-cluster connections facilitate inter-community collaboration",
      impact: "high",
      timeframe: "This week",
      metrics: {
        value: "234",
        change: 18.5,
        changeType: "increase"
      },
      actionable: true,
      priority: 6
    }
  ],
  crossClusterTrends: {
    memberGrowth: 7.3,
    trustMovement: 2.1,
    activityLevel: 15.4,
    collaborationIndex: 8.9
  }
};

// Community roundup component functions
function getInsightTypeIcon(type: string) {
  switch (type) {
    case "achievement": return <Award className="h-4 w-4" />;
    case "trend": return <TrendingUp className="h-4 w-4" />;
    case "opportunity": return <Target className="h-4 w-4" />;
    case "alert": return <AlertTriangle className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getInsightTypeColor(type: string) {
  switch (type) {
    case "achievement": return "text-green-400";
    case "trend": return "text-blue-400";
    case "opportunity": return "text-purple-400";
    case "alert": return "text-amber-400";
    default: return "text-gray-400";
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case "high": return "border-l-green-500";
    case "medium": return "border-l-amber-500";
    case "low": return "border-l-blue-500";
    default: return "border-l-gray-500";
  }
}

function getTrendIcon(changeType: string) {
  switch (changeType) {
    case "increase": return <ArrowUp className="h-3 w-3 text-green-400" />;
    case "decrease": return <ArrowDown className="h-3 w-3 text-red-400" />;
    default: return null;
  }
}

function CommunityOverviewCard({ roundup }: { roundup: CommunityRoundup }) {
  const overviewData = [
    { label: "Clusters", value: roundup.totalClusters.toString(), icon: <Building2 className="h-3 w-3" />, color: "var(--data-blue)" },
    { label: "Members", value: `${(roundup.totalMembers / 1000).toFixed(1)}K`, icon: <Users className="h-3 w-3" />, color: "var(--data-purple)" },
    { label: "Avg Trust", value: `${roundup.averageTrust.toFixed(1)}%`, icon: <Shield className="h-3 w-3" />, color: "var(--data-success)" },
    { label: "Growth", value: `+${roundup.crossClusterTrends.memberGrowth.toFixed(1)}%`, icon: <TrendingUp className="h-3 w-3" />, color: "var(--data-info)" },
    { label: "Activity", value: `+${roundup.crossClusterTrends.activityLevel.toFixed(1)}%`, icon: <Activity className="h-3 w-3" />, color: "var(--data-warning)" },
    { label: "Collaboration", value: `+${roundup.crossClusterTrends.collaborationIndex.toFixed(1)}%`, icon: <Network className="h-3 w-3" />, color: "var(--data-indigo)" }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {overviewData.map((metric, index) => (
        <div key={index} className="flex flex-col items-center text-center py-2 px-1 bg-white/5 rounded-lg">
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

function ClusterHighlightCard({ insight }: { insight: ClusterInsight }) {
  const hasChange = insight.metrics.change !== undefined;
  
  return (
    <Card className={`bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-l-4 ${getImpactColor(insight.impact)} hover:from-slate-800/70 hover:to-slate-900/70 transition-all cursor-pointer`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{insight.clusterIcon}</span>
            <div>
              <h4 className="font-medium text-sm text-white">{insight.title}</h4>
              <p className="text-xs text-white/60">{insight.clusterName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[#00F6FF]">
                {insight.metrics.value}
              </span>
              {hasChange && getTrendIcon(insight.metrics.changeType!)}
            </div>
            {hasChange && (
              <p className={`text-xs ${
                insight.metrics.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
              }`}>
                {insight.metrics.changeType === 'increase' ? '+' : ''}{insight.metrics.change!.toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        
        <p className="text-xs text-white/80 mb-3">{insight.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={getInsightTypeColor(insight.type)}>
              {getInsightTypeIcon(insight.type)}
            </div>
            <span className="text-xs text-white/60">{insight.timeframe}</span>
          </div>
          {insight.actionable && (
            <Badge className="bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/30 text-xs">
              Actionable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



// Signal type color mapping with better contrast for dark theme
const getSignalTypeStyles = (signalClass: SignalClass) => {
  const styles = {
    contact: { 
      border: "border-l-blue-500",
      badge: "bg-blue-500/20 text-blue-600 dark:text-blue-400"
    },
    trust: { 
      border: "border-l-green-500",
      badge: "bg-green-500/20 text-green-600 dark:text-green-400"
    },
    recognition: { 
      border: "border-l-purple-500",
      badge: "bg-purple-500/20 text-purple-600 dark:text-purple-400"
    },
    system: { 
      border: "border-l-gray-500",
      badge: "bg-gray-500/20 text-gray-600 dark:text-gray-400"
    }
  }
  return styles[signalClass] || styles.system
}

function SignalRow({ signal, onClick }: { signal: SignalEvent; onClick?: () => void }) {
  const getTitle = () => {
    if (signal.type === "CONTACT_REQUEST" || signal.type === "contact_request") {
      return signal.direction === "outbound" ? "Contact request sent" : "Contact request received"
    }
    if (signal.type === "CONTACT_ACCEPT" || signal.type === "contact_accept") {
      return signal.direction === "outbound" ? "Contact accepted" : "Contact bonded"
    }
    if (signal.type === "TRUST_ALLOCATE" || signal.type === "trust_allocate") {
      return `Trust allocated (weight ${signal.payload?.weight || signal.metadata?.weight || 1})`
    }
    if (signal.type === "TRUST_REVOKE" || signal.type === "trust_revoke") {
      return "Trust revoked"
    }
    if (signal.type === "RECOGNITION_MINT" || signal.type === "recognition_mint") {
      return signal.payload?.name || "Recognition earned"
    }
    return signal.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
  }

  const getSubtext = () => {
    const from = signal.actor || signal.actors?.from || 'unknown'
    const to = signal.target || signal.actors?.to || 'unknown'
    
    if (signal.direction === "outbound") {
      return `${from.slice(-8)} → ${to.slice(-8)}`
    } else {
      return `${from.slice(-8)} → you`
    }
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "—"
    
    try {
      const date = new Date(timestamp)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—"
      }
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffMins < 1) return "now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return "—"
    }
  }

  const getStatusBadge = () => {
    if (signal.status === "onchain") {
      return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">✓</Badge>
    }
    if (signal.status === "error") {
      return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">⚠</Badge>
    }
    return <Badge className="bg-gray-500/20 text-gray-600 dark:text-gray-400">⏳</Badge>
  }

  const getIcon = () => {
    switch (signal.class) {
      case 'contact': return <Users className="w-4 h-4" />
      case 'trust': return <Heart className="w-4 h-4" />
      case 'recognition': return <Award className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const styles = getSignalTypeStyles(signal.class)
  
  return (
    <Card className={`bg-card border ${styles.border} border-l-4 hover:border-primary/50 cursor-pointer transition-colors`} onClick={onClick}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.badge}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {getTitle()}
          </div>
          <div className="text-xs text-muted-foreground">
            {getSubtext()} • {formatTime(signal.ts)}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CommunityIntelligenceRoundup() {
  const [selectedInsightType, setSelectedInsightType] = useState<string>("all")
  const [roundup] = useState(todaysRoundup)

  const filteredHighlights = useMemo(() => {
    if (selectedInsightType === "all") return roundup.keyHighlights;
    return roundup.keyHighlights.filter(highlight => highlight.type === selectedInsightType);
  }, [selectedInsightType, roundup.keyHighlights]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
  };

  const insightTypeFilters = [
    { value: "all", label: "All", icon: <Activity className="h-4 w-4" /> },
    { value: "achievement", label: "Achievements", icon: <Award className="h-4 w-4" /> },
    { value: "trend", label: "Trends", icon: <TrendingUp className="h-4 w-4" /> },
    { value: "opportunity", label: "Opportunities", icon: <Target className="h-4 w-4" /> },
    { value: "alert", label: "Alerts", icon: <AlertTriangle className="h-4 w-4" /> }
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          <Newspaper className="w-5 h-5 text-[#00F6FF]" />
          Community Intelligence
        </h1>
        <div className="text-center">
          <p className="text-sm text-white/80">
            {formatDate(roundup.date)} • Daily Roundup
          </p>
        </div>
      </div>

      {/* Community Overview */}
      <CommunityOverviewCard roundup={roundup} />



      {/* Community Highlights */}
      <div className="space-y-3">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1">
            <Brain className="w-4 h-4 text-[#00F6FF]" />
            Today's Highlights
            <Badge variant="secondary" className="text-xs bg-[#00F6FF]/20 text-[#00F6FF]">{filteredHighlights.length}</Badge>
          </h2>
          
          {/* Filter Controls */}
          <div className="flex gap-1 overflow-x-auto">
            {insightTypeFilters.map((filter) => (
              <Button
                key={filter.value}
                size="sm"
                variant={selectedInsightType === filter.value ? "default" : "outline"}
                onClick={() => setSelectedInsightType(filter.value)}
                className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 h-7 ${
                  selectedInsightType === filter.value 
                    ? 'bg-[#00F6FF]/20 text-[#00F6FF] border-[#00F6FF]/30' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/20'
                }`}
              >
                <div className="w-3 h-3">{filter.icon}</div>
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          {filteredHighlights.map(highlight => (
            <ClusterHighlightCard 
              key={highlight.id} 
              insight={highlight}
            />
          ))}
        </div>
      </div>
      
      {/* Cross-Cluster Summary */}
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-[#00F6FF]" />
            Cross-Cluster Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">+{roundup.crossClusterTrends.memberGrowth.toFixed(1)}%</div>
              <div className="text-white/60">Member Growth</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">+{roundup.crossClusterTrends.trustMovement.toFixed(1)}%</div>
              <div className="text-white/60">Trust Movement</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">+{roundup.crossClusterTrends.activityLevel.toFixed(1)}%</div>
              <div className="text-white/60">Activity Level</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">+{roundup.crossClusterTrends.collaborationIndex.toFixed(1)}%</div>
              <div className="text-white/60">Collaboration</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Roundup Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-white/60">
        <CheckCircle className="w-3 h-3 text-green-400" />
        <span>Next roundup: Tomorrow 6:00 AM • Data from 6 community clusters</span>
      </div>
    </div>
  )
}
