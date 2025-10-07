"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Eye,
  Users,
  Zap,
  Target
} from "lucide-react"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getBondedContactsFromHCS } from "@/lib/services/HCSDataUtils"
import { getSessionId } from "@/lib/session"

interface Insight {
  id: string;
  type: "trend" | "alert" | "opportunity" | "performance";
  title: string;
  description: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  category: "trust" | "network" | "engagement" | "growth";
  priority: "high" | "medium" | "low";
  timestamp: string;
  chartData?: {
    labels: string[];
    values: number[];
  };
  actionable: boolean;
  relatedContacts: string[];
}

interface TrustMetric {
  label: string;
  current: number;
  previous: number;
  unit: string;
  trend: "up" | "down" | "stable";
  color: string;
}

// Mock analytics data
const mockInsights: Insight[] = [
  {
    id: "1",
    type: "alert",
    title: "Trust Score Anomaly Detected",
    description: "Unusual pattern in trust allocation from Core network members",
    value: "15%",
    change: "-3.2%",
    changeType: "negative",
    category: "trust",
    priority: "high",
    timestamp: "2 hours ago",
    actionable: true,
    relatedContacts: ["Sarah Chen", "Dr. Aisha Patel"]
  },
  {
    id: "2",
    type: "opportunity",
    title: "Network Expansion Potential",
    description: "5 high-value connections identified through mutual trust paths",
    value: "5 contacts",
    change: "+2 new",
    changeType: "positive",
    category: "network",
    priority: "medium",
    timestamp: "4 hours ago",
    actionable: true,
    relatedContacts: ["Marcus Rodriguez", "Elena Vasquez"]
  },
  {
    id: "3",
    type: "trend",
    title: "Signal Engagement Surge",
    description: "Professional signals receiving 40% more validation this week",
    value: "847 validations",
    change: "+40.3%",
    changeType: "positive",
    category: "engagement",
    priority: "low",
    timestamp: "6 hours ago",
    chartData: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [45, 52, 48, 68, 75, 82, 95]
    },
    actionable: false,
    relatedContacts: []
  },
  {
    id: "4",
    type: "performance",
    title: "Trust Allocation Efficiency",
    description: "Your trust distribution is optimally balanced across network tiers",
    value: "94%",
    change: "+2.1%",
    changeType: "positive",
    category: "trust",
    priority: "low",
    timestamp: "1 day ago",
    actionable: false,
    relatedContacts: []
  },
  {
    id: "5",
    type: "opportunity",
    title: "Under-utilized Connections",
    description: "3 Core members haven't interacted in 30+ days",
    value: "3 contacts",
    change: "No change",
    changeType: "neutral",
    category: "network",
    priority: "medium",
    timestamp: "1 day ago",
    actionable: true,
    relatedContacts: ["James Kim"]
  }
];

const trustMetrics: TrustMetric[] = [
  { label: "Network Trust Score", current: 87.3, previous: 85.1, unit: "/100", trend: "up", color: "var(--data-blue)" },
  { label: "Active Connections", current: 42, previous: 38, unit: " contacts", trend: "up", color: "var(--data-purple)" },
  { label: "Signal Velocity", current: 156, previous: 144, unit: "/week", trend: "up", color: "var(--data-success)" },
  { label: "Trust Allocation", current: 94.2, previous: 92.8, unit: "% efficiency", trend: "up", color: "var(--data-info)" }
];

// Analytics component functions
function getInsightIcon(type: string) {
  switch (type) {
    case "alert": return <AlertTriangle className="h-4 w-4" />;
    case "opportunity": return <Target className="h-4 w-4" />;
    case "trend": return <TrendingUp className="h-4 w-4" />;
    case "performance": return <CheckCircle className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "text-red-400";
    case "medium": return "text-amber-400";
    case "low": return "text-blue-400";
    default: return "text-gray-400";
  }
}

function getTrendIcon(changeType: string) {
  switch (changeType) {
    case "positive": return <ArrowUp className="h-3 w-3 text-green-400" />;
    case "negative": return <ArrowDown className="h-3 w-3 text-red-400" />;
    default: return null;
  }
}

function MetricCard({ metric }: { metric: TrustMetric }) {
  const changePercent = ((metric.current - metric.previous) / metric.previous * 100).toFixed(1);
  const isPositive = metric.current > metric.previous;
  
  return (
    <Card className="bg-card border border-[var(--data-blue)]/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: metric.color }}>
                {metric.current}{metric.unit}
              </span>
              {getTrendIcon(isPositive ? "positive" : "negative")}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{changePercent}%
            </p>
            <p className="text-xs text-muted-foreground">vs. last period</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight, onAction }: { insight: Insight; onAction: (insight: Insight) => void }) {
  return (
    <Card className={`bg-card border-l-4 ${
      insight.priority === 'high' ? 'border-l-red-500' :
      insight.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'
    } hover:bg-card/80 transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={getPriorityColor(insight.priority)}>
              {getInsightIcon(insight.type)}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{insight.title}</h3>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[var(--data-blue)]">{insight.value}</span>
              {getTrendIcon(insight.changeType)}
            </div>
            <p className={`text-xs ${
              insight.changeType === 'positive' ? 'text-green-400' :
              insight.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {insight.change}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {insight.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
          </div>
          {insight.actionable && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6 px-2"
              onClick={() => onAction(insight)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
        </div>
        {insight.relatedContacts.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Related contacts:</p>
            <div className="flex flex-wrap gap-1">
              {insight.relatedContacts.map(contact => (
                <Badge key={contact} variant="outline" className="text-xs">
                  {contact}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsInsightsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [insights] = useState(mockInsights)
  const [metrics] = useState(trustMetrics)

  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const matchesSearch = searchQuery === "" || 
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = filterCategory === "all" || insight.category === filterCategory
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, filterCategory, insights])

  const handleInsightAction = (insight: Insight) => {
    console.log("Opening insight details for:", insight.title)
    // TODO: Open insight detail modal or navigate to detailed view
  }

  const categoryFilters = [
    { value: "all", label: "All Categories", icon: <Activity className="h-4 w-4" /> },
    { value: "trust", label: "Trust", icon: <Users className="h-4 w-4" /> },
    { value: "network", label: "Network", icon: <Target className="h-4 w-4" /> },
    { value: "engagement", label: "Engagement", icon: <Zap className="h-4 w-4" /> },
    { value: "growth", label: "Growth", icon: <TrendingUp className="h-4 w-4" /> }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-[var(--data-blue)] flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Trust Network Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Data-driven insights into your trust network performance and optimization opportunities
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search insights and analytics..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card border-[var(--data-blue)]/30"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categoryFilters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={filterCategory === filter.value ? "default" : "outline"}
              onClick={() => setFilterCategory(filter.value)}
              className={`flex items-center gap-2 whitespace-nowrap ${
                filterCategory === filter.value 
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

      {/* Insights Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--data-purple)] flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Insights Feed
            <Badge variant="secondary">{filteredInsights.length}</Badge>
          </h2>
          <Button size="sm" variant="outline" className="text-xs">
            <Filter className="h-3 w-3 mr-1" />
            Advanced Filters
          </Button>
        </div>
        
        {filteredInsights.length === 0 ? (
          <Card className="bg-card border-dashed border-[var(--data-blue)]/30">
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No insights match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms or category filters to see more insights.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("all");
                }}
                size="sm"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map(insight => (
              <InsightCard 
                key={insight.id} 
                insight={insight} 
                onAction={handleInsightAction}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <Card className="bg-card border border-[var(--data-purple)]/30">
        <CardHeader>
          <h3 className="text-sm font-medium text-[var(--data-purple)]">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Export Analytics
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trend Analysis
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Optimization Report
            </Button>
            <Button size="sm" variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Real-time Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
