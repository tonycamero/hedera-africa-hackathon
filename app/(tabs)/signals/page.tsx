"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Zap,
  Brain,
  Search,
  Filter,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings,
  Database,
  Cpu,
  Globe
} from "lucide-react"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"

interface SignalProcessingMetrics {
  totalProcessed: number;
  processingRate: number; // signals per minute
  latency: number; // ms
  accuracy: number; // %
  anomaliesDetected: number;
  patternMatches: number;
}

interface TrendAnalysis {
  period: string;
  signalType: string;
  volume: number;
  change: number;
  changeType: "increase" | "decrease" | "stable";
  confidence: number;
  forecast: number[];
}

interface PredictiveInsight {
  id: string;
  type: "prediction" | "anomaly" | "pattern" | "correlation";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  timeframe: string;
  dataPoints: number;
  accuracy: number;
  actionable: boolean;
  tags: string[];
}

interface SignalIntelligence {
  patternRecognition: {
    trustPatterns: number;
    socialPatterns: number;
    behaviorPatterns: number;
    anomalies: number;
  };
  predictiveModeling: {
    trustPrediction: number;
    networkGrowth: number;
    riskAssessment: number;
    opportunityScore: number;
  };
  realTimeAnalytics: {
    activeSignals: number;
    processingQueue: number;
    latency: number;
    throughput: number;
  };
}

// Mock data intelligence analytics
const signalProcessingMetrics: SignalProcessingMetrics = {
  totalProcessed: 12847,
  processingRate: 34.6,
  latency: 127,
  accuracy: 94.3,
  anomaliesDetected: 23,
  patternMatches: 156
};

const trendAnalyses: TrendAnalysis[] = [
  {
    period: "24h",
    signalType: "Trust Allocation",
    volume: 89,
    change: 23.4,
    changeType: "increase",
    confidence: 87,
    forecast: [89, 95, 102, 108, 115, 121, 128]
  },
  {
    period: "7d",
    signalType: "Social Recognition",
    volume: 234,
    change: -12.1,
    changeType: "decrease",
    confidence: 92,
    forecast: [234, 228, 221, 215, 208, 202, 195]
  },
  {
    period: "24h",
    signalType: "Network Activity",
    volume: 567,
    change: 8.7,
    changeType: "increase",
    confidence: 76,
    forecast: [567, 578, 590, 601, 613, 624, 636]
  }
];

const predictiveInsights: PredictiveInsight[] = [
  {
    id: "pred-1",
    type: "prediction",
    title: "Trust Network Growth Acceleration",
    description: "Based on current patterns, trust network expansion will increase 40% in next 30 days",
    confidence: 87,
    impact: "high",
    timeframe: "30 days",
    dataPoints: 1247,
    accuracy: 94.2,
    actionable: true,
    tags: ["network-growth", "trust", "expansion"]
  },
  {
    id: "pred-2",
    type: "anomaly",
    title: "Unusual Recognition Pattern Detected",
    description: "Professional signals showing 3x normal velocity in specific network cluster",
    confidence: 92,
    impact: "medium",
    timeframe: "ongoing",
    dataPoints: 234,
    accuracy: 96.8,
    actionable: true,
    tags: ["anomaly", "professional", "velocity"]
  },
  {
    id: "pred-3",
    type: "pattern",
    title: "Cyclical Trust Allocation Pattern",
    description: "Trust allocations follow weekly cycles with peaks on Tuesday and Thursday",
    confidence: 78,
    impact: "low",
    timeframe: "weekly",
    dataPoints: 892,
    accuracy: 82.1,
    actionable: false,
    tags: ["pattern", "trust", "cyclical"]
  },
  {
    id: "pred-4",
    type: "correlation",
    title: "Strong Signal-Trust Correlation",
    description: "Recognition signals correlate 0.84 with trust allocation increases within 48h",
    confidence: 95,
    impact: "high",
    timeframe: "48 hours",
    dataPoints: 567,
    accuracy: 91.7,
    actionable: true,
    tags: ["correlation", "recognition", "trust"]
  }
];

const signalIntelligence: SignalIntelligence = {
  patternRecognition: {
    trustPatterns: 47,
    socialPatterns: 23,
    behaviorPatterns: 34,
    anomalies: 12
  },
  predictiveModeling: {
    trustPrediction: 89,
    networkGrowth: 76,
    riskAssessment: 23,
    opportunityScore: 84
  },
  realTimeAnalytics: {
    activeSignals: 156,
    processingQueue: 23,
    latency: 127,
    throughput: 34.6
  }
};

// Data intelligence component functions
function getInsightIcon(type: string) {
  switch (type) {
    case "prediction": return <Brain className="h-4 w-4" />;
    case "anomaly": return <AlertTriangle className="h-4 w-4" />;
    case "pattern": return <Target className="h-4 w-4" />;
    case "correlation": return <Zap className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getImpactColor(impact: string) {
  switch (impact) {
    case "high": return "text-red-400";
    case "medium": return "text-amber-400";
    case "low": return "text-blue-400";
    default: return "text-gray-400";
  }
}

function getTrendIcon(changeType: string) {
  switch (changeType) {
    case "increase": return <ArrowUp className="h-3 w-3 text-green-400" />;
    case "decrease": return <ArrowDown className="h-3 w-3 text-red-400" />;
    default: return null;
  }
}

function ProcessingMetricsCard({ metrics }: { metrics: SignalProcessingMetrics }) {
  const metricsData = [
    { label: "Total Processed", value: metrics.totalProcessed.toLocaleString(), icon: <Database className="h-4 w-4" />, color: "var(--data-blue)" },
    { label: "Processing Rate", value: `${metrics.processingRate}/min`, icon: <Cpu className="h-4 w-4" />, color: "var(--data-purple)" },
    { label: "Latency", value: `${metrics.latency}ms`, icon: <Clock className="h-4 w-4" />, color: "var(--data-warning)" },
    { label: "Accuracy", value: `${metrics.accuracy}%`, icon: <CheckCircle className="h-4 w-4" />, color: "var(--data-success)" },
    { label: "Anomalies", value: metrics.anomaliesDetected.toString(), icon: <AlertTriangle className="h-4 w-4" />, color: "var(--data-warning)" },
    { label: "Patterns", value: metrics.patternMatches.toString(), icon: <Target className="h-4 w-4" />, color: "var(--data-info)" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metricsData.map((metric, index) => (
        <Card key={index} className="bg-card border border-[var(--data-blue)]/20">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-2" style={{ color: metric.color }}>
              {metric.icon}
            </div>
            <div className="text-lg font-bold" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metric.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TrendAnalysisCard({ trend }: { trend: TrendAnalysis }) {
  const isPositive = trend.changeType === "increase";
  
  return (
    <Card className="bg-card border border-[var(--data-purple)]/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm">{trend.signalType}</h4>
            <p className="text-xs text-muted-foreground">{trend.period} trend</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-[var(--data-blue)]">
                {trend.volume}
              </span>
              {getTrendIcon(trend.changeType)}
            </div>
            <p className={`text-xs ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? '+' : ''}{trend.change.toFixed(1)}%
            </p>
          </div>
        </div>
        
        {/* Mini forecast chart */}
        <div className="h-8 flex items-end gap-1">
          {trend.forecast.map((value, index) => {
            const maxValue = Math.max(...trend.forecast);
            const height = (value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-[var(--data-purple)]/30 rounded-sm"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs">
            {trend.confidence}% confidence
          </Badge>
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2">
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictiveInsightCard({ insight, onAction }: { insight: PredictiveInsight; onAction: (insight: PredictiveInsight) => void }) {
  return (
    <Card className={`bg-card border-l-4 ${
      insight.impact === 'high' ? 'border-l-red-500' :
      insight.impact === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
    } hover:bg-card/80 transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={getImpactColor(insight.impact)}>
              {getInsightIcon(insight.type)}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{insight.title}</h3>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[var(--data-blue)]">
              {insight.confidence}%
            </div>
            <p className="text-xs text-muted-foreground">confidence</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>📅 {insight.timeframe}</span>
            <span>📊 {insight.dataPoints} points</span>
            <span>🎯 {insight.accuracy}% accurate</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {insight.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {insight.actionable && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6 px-2"
              onClick={() => onAction(insight)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Analyze
            </Button>
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

export default function DataIntelligencePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInsightType, setSelectedInsightType] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h")
  const [metrics] = useState(signalProcessingMetrics)
  const [trends] = useState(trendAnalyses)
  const [insights] = useState(predictiveInsights)
  const [intelligence] = useState(signalIntelligence)

  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const matchesSearch = searchQuery === "" || 
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedInsightType === "all" || insight.type === selectedInsightType;
      
      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedInsightType, insights]);

  const filteredTrends = useMemo(() => {
    return trends.filter(trend => trend.period === timeRange);
  }, [trends, timeRange]);

  const handleInsightAction = (insight: PredictiveInsight) => {
    console.log("Analyzing insight:", insight.title);
    // TODO: Open detailed analysis modal or navigate to deep-dive view
  };

  const insightTypeFilters = [
    { value: "all", label: "All Types", icon: <Activity className="h-4 w-4" /> },
    { value: "prediction", label: "Predictions", icon: <Brain className="h-4 w-4" /> },
    { value: "anomaly", label: "Anomalies", icon: <AlertTriangle className="h-4 w-4" /> },
    { value: "pattern", label: "Patterns", icon: <Target className="h-4 w-4" /> },
    { value: "correlation", label: "Correlations", icon: <Zap className="h-4 w-4" /> }
  ];

  const timeRangeOptions = [
    { value: "24h" as const, label: "24 Hours" },
    { value: "7d" as const, label: "7 Days" },
    { value: "30d" as const, label: "30 Days" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-[var(--data-blue)] flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Data Intelligence & Predictive Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered signal processing, trend analysis, and predictive insights for trust network optimization
        </p>
      </div>

      {/* Signal Processing Metrics */}
      <ProcessingMetricsCard metrics={metrics} />

      {/* Real-time Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-[var(--data-blue)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--data-blue)]">
              <Target className="h-4 w-4" />
              Pattern Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-blue)]">{intelligence.patternRecognition.trustPatterns}</div>
                <div className="text-muted-foreground">Trust Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-purple)]">{intelligence.patternRecognition.socialPatterns}</div>
                <div className="text-muted-foreground">Social Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-success)]">{intelligence.patternRecognition.behaviorPatterns}</div>
                <div className="text-muted-foreground">Behavior Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-warning)]">{intelligence.patternRecognition.anomalies}</div>
                <div className="text-muted-foreground">Anomalies</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-[var(--data-purple)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--data-purple)]">
              <Brain className="h-4 w-4" />
              Predictive Modeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-blue)]">{intelligence.predictiveModeling.trustPrediction}%</div>
                <div className="text-muted-foreground">Trust Prediction</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-success)]">{intelligence.predictiveModeling.networkGrowth}%</div>
                <div className="text-muted-foreground">Network Growth</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-warning)]">{intelligence.predictiveModeling.riskAssessment}%</div>
                <div className="text-muted-foreground">Risk Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-info)]">{intelligence.predictiveModeling.opportunityScore}%</div>
                <div className="text-muted-foreground">Opportunity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-[var(--data-success)]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-[var(--data-success)]">
              <Zap className="h-4 w-4" />
              Real-time Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-blue)]">{intelligence.realTimeAnalytics.activeSignals}</div>
                <div className="text-muted-foreground">Active Signals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-warning)]">{intelligence.realTimeAnalytics.processingQueue}</div>
                <div className="text-muted-foreground">Queue</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-info)]">{intelligence.realTimeAnalytics.latency}ms</div>
                <div className="text-muted-foreground">Latency</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--data-purple)]">{intelligence.realTimeAnalytics.throughput}/min</div>
                <div className="text-muted-foreground">Throughput</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--data-purple)] flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Trend Analysis
            <Badge variant="secondary">{filteredTrends.length} trends</Badge>
          </h2>
          <div className="flex gap-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={timeRange === option.value ? "default" : "outline"}
                onClick={() => setTimeRange(option.value)}
                className={`text-xs ${
                  timeRange === option.value 
                    ? 'bg-[var(--data-purple)] hover:bg-[var(--data-purple)]/90' 
                    : 'border-[var(--data-purple)]/30 hover:bg-[var(--data-purple)]/10'
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrends.map((trend, index) => (
            <TrendAnalysisCard key={index} trend={trend} />
          ))}
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--data-blue)] flex items-center gap-2 mb-2">
              <PieChart className="h-5 w-5" />
              Predictive Insights
              <Badge variant="secondary">{filteredInsights.length} insights</Badge>
            </h2>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="min-w-64">
              <Input 
                placeholder="Search insights..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card border-[var(--data-blue)]/30"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {insightTypeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  size="sm"
                  variant={selectedInsightType === filter.value ? "default" : "outline"}
                  onClick={() => setSelectedInsightType(filter.value)}
                  className={`flex items-center gap-2 whitespace-nowrap text-xs ${
                    selectedInsightType === filter.value 
                      ? 'bg-[var(--data-blue)] hover:bg-[var(--data-blue)]/90' 
                      : 'border-[var(--data-blue)]/30 hover:bg-[var(--data-blue)]/10'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {filteredInsights.length === 0 ? (
          <Card className="bg-card border-dashed border-[var(--data-blue)]/30">
            <CardContent className="p-12 text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No insights match your criteria</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms or insight type filters to discover predictive analytics.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedInsightType("all");
                }}
                size="sm"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map(insight => (
              <PredictiveInsightCard 
                key={insight.id} 
                insight={insight} 
                onAction={handleInsightAction}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Advanced Analytics Tools */}
      <Card className="bg-card border border-[var(--data-indigo)]/30">
        <CardHeader>
          <h3 className="text-lg font-semibold text-[var(--data-indigo)] flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Advanced Analytics & Machine Learning
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <BarChart3 className="h-8 w-8 mb-2 text-[var(--data-blue)]" />
              <span className="font-medium">Deep Analysis</span>
              <span className="text-xs text-muted-foreground">Multi-dimensional insights</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <TrendingUp className="h-8 w-8 mb-2 text-[var(--data-success)]" />
              <span className="font-medium">Forecasting Models</span>
              <span className="text-xs text-muted-foreground">Future predictions</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <AlertTriangle className="h-8 w-8 mb-2 text-[var(--data-warning)]" />
              <span className="font-medium">Anomaly Detection</span>
              <span className="text-xs text-muted-foreground">Outlier identification</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Globe className="h-8 w-8 mb-2 text-[var(--data-info)]" />
              <span className="font-medium">Network Simulation</span>
              <span className="text-xs text-muted-foreground">What-if scenarios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
