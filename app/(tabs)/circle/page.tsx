"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  GitBranch, 
  Network, 
  Users, 
  Activity, 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Filter,
  Search,
  Settings,
  Zap,
  Target,
  Globe
} from "lucide-react"
import { signalsStore } from "@/lib/stores/signalsStore"
import { getSessionId } from "@/lib/session"

interface NetworkNode {
  id: string;
  name: string;
  avatar: string;
  level: "core" | "close" | "known" | "observed";
  trustScore: number;
  connections: number;
  activity: number;
  position: { x: number; y: number };
  size: "small" | "medium" | "large";
}

interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
  type: "trust" | "social" | "professional" | "weak";
  bidirectional: boolean;
}

interface NetworkMetrics {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  clusteringCoefficient: number;
  networkDensity: number;
  centralityScore: number;
}

interface PathAnalysis {
  shortestPath: string[];
  pathLength: number;
  intermediateNodes: NetworkNode[];
  trustScore: number;
}

// Mock network topology data
const mockNodes: NetworkNode[] = [
  // Center node (you)
  { id: "self", name: "You", avatar: "🧑‍💼", level: "core", trustScore: 100, connections: 8, activity: 95, position: { x: 250, y: 200 }, size: "large" },
  
  // Core circle (high trust)
  { id: "sarah", name: "Sarah C.", avatar: "👩‍💼", level: "core", trustScore: 95, connections: 12, activity: 85, position: { x: 180, y: 120 }, size: "medium" },
  { id: "alex", name: "Alex M.", avatar: "👨‍💻", level: "core", trustScore: 92, connections: 10, activity: 90, position: { x: 320, y: 140 }, size: "medium" },
  { id: "maria", name: "Maria L.", avatar: "👩‍🔬", level: "core", trustScore: 88, connections: 15, activity: 75, position: { x: 200, y: 280 }, size: "medium" },
  
  // Close circle (medium trust)
  { id: "david", name: "David K.", avatar: "👨‍🎨", level: "close", trustScore: 76, connections: 8, activity: 65, position: { x: 120, y: 200 }, size: "small" },
  { id: "lisa", name: "Lisa W.", avatar: "👩‍💼", level: "close", trustScore: 82, connections: 11, activity: 70, position: { x: 350, y: 240 }, size: "small" },
  { id: "james", name: "James R.", avatar: "👨‍📊", level: "close", trustScore: 74, connections: 6, activity: 60, position: { x: 300, y: 80 }, size: "small" },
  
  // Known circle (low trust)
  { id: "emily", name: "Emily D.", avatar: "👩‍🎓", level: "known", trustScore: 65, connections: 4, activity: 45, position: { x: 80, y: 150 }, size: "small" },
  { id: "mike", name: "Mike T.", avatar: "👨‍🔧", level: "known", trustScore: 58, connections: 7, activity: 40, position: { x: 380, y: 180 }, size: "small" },
  { id: "anna", name: "Anna S.", avatar: "👩‍🎤", level: "observed", trustScore: 45, connections: 3, activity: 25, position: { x: 250, y: 320 }, size: "small" }
];

const mockEdges: NetworkEdge[] = [
  // Self connections
  { from: "self", to: "sarah", strength: 95, type: "trust", bidirectional: true },
  { from: "self", to: "alex", strength: 92, type: "professional", bidirectional: true },
  { from: "self", to: "maria", strength: 88, type: "trust", bidirectional: true },
  { from: "self", to: "david", strength: 76, type: "social", bidirectional: true },
  { from: "self", to: "lisa", strength: 82, type: "professional", bidirectional: true },
  { from: "self", to: "james", strength: 74, type: "weak", bidirectional: false },
  { from: "self", to: "emily", strength: 65, type: "weak", bidirectional: false },
  { from: "self", to: "mike", strength: 58, type: "weak", bidirectional: false },
  
  // Interconnections
  { from: "sarah", to: "alex", strength: 85, type: "professional", bidirectional: true },
  { from: "sarah", to: "maria", strength: 70, type: "social", bidirectional: true },
  { from: "alex", to: "lisa", strength: 78, type: "professional", bidirectional: true },
  { from: "maria", to: "david", strength: 60, type: "social", bidirectional: true },
  { from: "lisa", to: "james", strength: 55, type: "weak", bidirectional: false },
  { from: "emily", to: "anna", strength: 40, type: "weak", bidirectional: true }
];

const networkMetrics: NetworkMetrics = {
  totalNodes: 10,
  totalEdges: 14,
  averageDegree: 2.8,
  clusteringCoefficient: 0.65,
  networkDensity: 0.31,
  centralityScore: 0.89
};

// Network topology visualization components
function getNodeColor(level: string) {
  switch (level) {
    case "core": return "var(--data-blue)";
    case "close": return "var(--data-purple)";
    case "known": return "var(--data-info)";
    case "observed": return "var(--muted-foreground)";
    default: return "var(--border)";
  }
}

function getNodeSize(size: string) {
  switch (size) {
    case "large": return 40;
    case "medium": return 28;
    case "small": return 20;
    default: return 24;
  }
}

function getEdgeColor(type: string) {
  switch (type) {
    case "trust": return "var(--data-blue)";
    case "professional": return "var(--data-purple)";
    case "social": return "var(--data-success)";
    case "weak": return "var(--muted-foreground)";
    default: return "var(--border)";
  }
}

function NetworkTopologyVisualization({ nodes, edges, selectedNode, onNodeSelect }: {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNode: string | null;
  onNodeSelect: (nodeId: string) => void;
}) {
  const svgWidth = 500;
  const svgHeight = 400;
  
  return (
    <div className="relative bg-card border border-[var(--data-blue)]/30 rounded-lg overflow-hidden">
      <svg width={svgWidth} height={svgHeight} className="w-full h-full">
        {/* Render edges first (behind nodes) */}
        {edges.map((edge, index) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;
          
          const strokeWidth = Math.max(1, edge.strength / 30);
          const opacity = selectedNode ? 
            (selectedNode === edge.from || selectedNode === edge.to ? 1 : 0.3) : 0.6;
          
          return (
            <line
              key={`${edge.from}-${edge.to}-${index}`}
              x1={fromNode.position.x}
              y1={fromNode.position.y}
              x2={toNode.position.x}
              y2={toNode.position.y}
              stroke={getEdgeColor(edge.type)}
              strokeWidth={strokeWidth}
              opacity={opacity}
              strokeDasharray={edge.bidirectional ? "none" : "4,4"}
            />
          );
        })}
        
        {/* Render nodes */}
        {nodes.map((node) => {
          const nodeSize = getNodeSize(node.size);
          const isSelected = selectedNode === node.id;
          const opacity = selectedNode ? (isSelected ? 1 : 0.4) : 1;
          
          return (
            <g key={node.id}>
              {/* Node circle */}
              <circle
                cx={node.position.x}
                cy={node.position.y}
                r={nodeSize / 2}
                fill={getNodeColor(node.level)}
                stroke={isSelected ? "white" : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                opacity={opacity}
                className="cursor-pointer transition-all duration-200 hover:scale-110"
                onClick={() => onNodeSelect(node.id)}
              />
              
              {/* Node avatar/emoji */}
              <text
                x={node.position.x}
                y={node.position.y + 4}
                textAnchor="middle"
                fontSize={nodeSize / 2}
                opacity={opacity}
                className="cursor-pointer pointer-events-none select-none"
              >
                {node.avatar}
              </text>
              
              {/* Node label */}
              <text
                x={node.position.x}
                y={node.position.y + nodeSize / 2 + 12}
                textAnchor="middle"
                fontSize="10"
                fill="var(--foreground)"
                opacity={opacity}
                className="pointer-events-none select-none font-medium"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm rounded border border-border/50 p-2 space-y-1">
        <div className="text-xs font-medium text-muted-foreground mb-1">Trust Levels</div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--data-blue)" }}></div>
          <span className="text-xs">Core</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--data-purple)" }}></div>
          <span className="text-xs">Close</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--data-info)" }}></div>
          <span className="text-xs">Known</span>
        </div>
      </div>
    </div>
  );
}

function NetworkMetricsCard({ metrics }: { metrics: NetworkMetrics }) {
  const metricsData = [
    { label: "Nodes", value: metrics.totalNodes.toString(), icon: <Users className="h-3 w-3" />, color: "var(--data-blue)" },
    { label: "Links", value: metrics.totalEdges.toString(), icon: <GitBranch className="h-3 w-3" />, color: "var(--data-purple)" },
    { label: "Degree", value: metrics.averageDegree.toFixed(1), icon: <Network className="h-3 w-3" />, color: "var(--data-info)" },
    { label: "Central", value: `${(metrics.centralityScore * 100).toFixed(0)}%`, icon: <Target className="h-3 w-3" />, color: "var(--data-success)" },
    { label: "Density", value: `${(metrics.networkDensity * 100).toFixed(0)}%`, icon: <Globe className="h-3 w-3" />, color: "var(--data-warning)" },
    { label: "Cluster", value: `${(metrics.clusteringCoefficient * 100).toFixed(0)}%`, icon: <PieChart className="h-3 w-3" />, color: "var(--data-indigo)" }
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {metricsData.map((metric, index) => (
        <Card key={index} className="bg-card border border-[var(--data-blue)]/20">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center mb-1" style={{ color: metric.color }}>
              {metric.icon}
            </div>
            <div className="text-sm font-bold" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {metric.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NodeDetailsPanel({ node, edges }: { node: NetworkNode | null; edges: NetworkEdge[] }) {
  if (!node) {
    return (
      <Card className="bg-card border border-[var(--data-purple)]/30">
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Select a Node</h3>
          <p className="text-sm text-muted-foreground">
            Click on any node in the network to view detailed analytics and connection information.
          </p>
        </CardContent>
      </Card>
    );
  }

  const nodeConnections = edges.filter(e => e.from === node.id || e.to === node.id);
  const strongConnections = nodeConnections.filter(e => e.strength > 80).length;
  const weakConnections = nodeConnections.filter(e => e.strength < 60).length;
  
  return (
    <Card className="bg-card border-l-4" style={{ borderLeftColor: getNodeColor(node.level) }}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: getNodeColor(node.level), color: 'white' }}
          >
            {node.avatar}
          </div>
          <div>
            <CardTitle className="text-lg">{node.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {node.level.charAt(0).toUpperCase() + node.level.slice(1)} Circle
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold" style={{ color: getNodeColor(node.level) }}>
              {node.trustScore}
            </div>
            <div className="text-xs text-muted-foreground">Trust Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--data-purple)]">
              {nodeConnections.length}
            </div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Activity Level</span>
            <span className="font-medium">{node.activity}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="h-2 rounded-full"
              style={{ 
                width: `${node.activity}%`, 
                backgroundColor: getNodeColor(node.level)
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--data-success)]">
              {strongConnections}
            </div>
            <div className="text-xs text-muted-foreground">Strong Links</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[var(--data-warning)]">
              {weakConnections}
            </div>
            <div className="text-xs text-muted-foreground">Weak Links</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs">
            <ArrowRight className="h-3 w-3 mr-1" />
            Analyze Path
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NetworkTopologyPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodes] = useState(mockNodes)
  const [edges] = useState(mockEdges)
  const [metrics] = useState(networkMetrics)
  const [viewMode, setViewMode] = useState<"topology" | "matrix" | "hierarchy">("topology")
  const [filterLevel, setFilterLevel] = useState<string>("all")

  const filteredNodes = useMemo(() => {
    if (filterLevel === "all") return nodes;
    return nodes.filter(node => node.level === filterLevel);
  }, [nodes, filterLevel]);

  const filteredEdges = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => 
      filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
    );
  }, [edges, filteredNodes]);

  const selectedNodeData = useMemo(() => {
    return nodes.find(n => n.id === selectedNode) || null;
  }, [nodes, selectedNode]);

  const viewModes = [
    { value: "topology", label: "Network Graph", icon: <Network className="h-4 w-4" /> },
    { value: "matrix", label: "Adjacency Matrix", icon: <BarChart3 className="h-4 w-4" /> },
    { value: "hierarchy", label: "Trust Hierarchy", icon: <GitBranch className="h-4 w-4" /> }
  ];

  const levelFilters = [
    { value: "all", label: "All Levels", color: "var(--muted-foreground)" },
    { value: "core", label: "Core", color: "var(--data-blue)" },
    { value: "close", label: "Close", color: "var(--data-purple)" },
    { value: "known", label: "Known", color: "var(--data-info)" },
    { value: "observed", label: "Observed", color: "var(--muted-foreground)" }
  ];

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-[var(--data-blue)] flex items-center gap-2">
          <Network className="h-4 w-4" />
          Network Topology
        </h1>
        <p className="text-xs text-muted-foreground">
          Interactive network analysis & visualization
        </p>
      </div>

      {/* Network Metrics */}
      <NetworkMetricsCard metrics={metrics} />

      {/* View Controls */}
      <div className="space-y-2">
        {/* View Mode Selector */}
        <div className="flex gap-1 overflow-x-auto">
          {viewModes.map((mode) => (
            <Button
              key={mode.value}
              size="sm"
              variant={viewMode === mode.value ? "default" : "outline"}
              onClick={() => setViewMode(mode.value as any)}
              className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 h-7 ${
                viewMode === mode.value 
                  ? 'bg-[var(--data-blue)] hover:bg-[var(--data-blue)]/90' 
                  : 'border-[var(--data-blue)]/30 hover:bg-[var(--data-blue)]/10'
              }`}
            >
              <div className="w-3 h-3">{mode.icon}</div>
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Level Filter */}
        <div className="flex gap-1 overflow-x-auto">
          {levelFilters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={filterLevel === filter.value ? "default" : "outline"}
              onClick={() => setFilterLevel(filter.value)}
              className={`flex items-center gap-1 whitespace-nowrap text-xs px-2 h-7 ${
                filterLevel === filter.value 
                  ? 'bg-[var(--data-purple)] hover:bg-[var(--data-purple)]/90' 
                  : 'border-[var(--data-purple)]/30 hover:bg-[var(--data-purple)]/10'
              }`}
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: filter.color }}
              ></div>
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Network Visualization */}
      <Card className="bg-card border border-[var(--data-blue)]/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1 text-[var(--data-blue)]">
              <PieChart className="h-4 w-4" />
              Network Graph
              <Badge variant="secondary" className="text-xs">{filteredNodes.length} nodes</Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                <Filter className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
            <CardContent>
              {viewMode === "topology" ? (
                <NetworkTopologyVisualization 
                  nodes={filteredNodes} 
                  edges={filteredEdges}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                />
              ) : viewMode === "matrix" ? (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Adjacency Matrix View</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Interactive adjacency matrix visualization showing connection strengths between all network members.
                    </p>
                    <Button size="sm">
                      <Zap className="h-3 w-3 mr-1" />
                      Generate Matrix
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="p-12 text-center">
                    <GitBranch className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Trust Hierarchy View</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Hierarchical tree layout showing trust levels and influence patterns in your network.
                    </p>
                    <Button size="sm">
                      <Target className="h-3 w-3 mr-1" />
                      Build Hierarchy
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
      </Card>

      {/* Node Details Panel */}
      <NodeDetailsPanel 
        node={selectedNodeData} 
        edges={edges}
      />

      {/* Network Analysis Tools */}
      <Card className="bg-card border border-[var(--data-purple)]/30">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-semibold text-[var(--data-purple)] flex items-center gap-1">
            <Activity className="h-4 w-4" />
            Analysis Tools
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="flex flex-col items-center p-2 h-auto">
              <TrendingUp className="h-4 w-4 mb-1 text-[var(--data-success)]" />
              <span className="text-xs font-medium">Influence</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-2 h-auto">
              <Target className="h-4 w-4 mb-1 text-[var(--data-warning)]" />
              <span className="text-xs font-medium">Clusters</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-2 h-auto">
              <ArrowRight className="h-4 w-4 mb-1 text-[var(--data-info)]" />
              <span className="text-xs font-medium">Paths</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-2 h-auto">
              <Zap className="h-4 w-4 mb-1 text-[var(--data-purple)]" />
              <span className="text-xs font-medium">Simulate</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
