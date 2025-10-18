'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, Zap, Shield, Leaf } from 'lucide-react';
import './phase-control.css';

interface PhaseState {
  currentPhase: string;
  phases: {
    [key: string]: {
      name: string;
      lenses: string[];
      enabled: boolean;
      cutoverDate: string | null;
      readinessChecks: string[];
      dependencies: string[];
    };
  };
  lastUpdated: string;
  updatedBy: string;
}

export default function PhaseControlDashboard() {
  const [phaseState, setPhaseState] = useState<PhaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPhaseState = async () => {
    try {
      const response = await fetch('/api/phase/state');
      const data = await response.json();
      
      if (response.ok) {
        setPhaseState(data);
      } else {
        console.error('Failed to fetch phase state:', data.error);
        // Fall back to showing current status
      }
    } catch (error) {
      console.error('Failed to fetch phase state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseAction = async (phaseId: string, action: 'enable' | 'disable') => {
    setActionLoading(`${action}-${phaseId}`);
    try {
      // Map phase IDs to phase names for API
      const phaseMap: Record<string, string> = {
        'phase1-genz': 'genz',
        'phase2-professional': 'professional', 
        'phase3-cannabis': 'cannabis'
      };
      
      const phaseName = phaseMap[phaseId];
      if (!phaseName) {
        throw new Error(`Unknown phase ID: ${phaseId}`);
      }
      
      const response = await fetch('/api/phase/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: phaseName, action })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(result.message);
        await fetchPhaseState(); // Refresh state
      } else {
        console.error('Phase action failed:', result.error);
        alert(`Failed to ${action} phase: ${result.error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} phase:`, error);
      alert(`Failed to ${action} phase: ${error}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchPhaseState();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse text-black font-black text-2xl text-center">Loading Phase Control Dashboard...</div>
        </div>
      </div>
    );
  }

  const phases = [
    {
      id: 'phase1-genz',
      icon: <Zap className="w-6 h-6" />,
      color: 'emerald',
      title: 'GenZ Community',
      subtitle: 'Hackathon Entry & First Launch',
      description: 'Your most developed infrastructure. Community-driven recognition system with basic treasury features.',
      features: ['Recognition Cards', 'Community Rewards', 'Basic TRST Transfers', 'Magic.link Auth'],
      pilot: 'Foundation for all other phases. Proves core wallet and recognition functionality.'
    },
    {
      id: 'phase2-professional',
      icon: <Shield className="w-6 h-6" />,
      color: 'blue',
      title: 'Professional Organizations',
      subtitle: 'Corporate Treasury Management',
      description: 'Business features with RBAC, audit trails, and professional-grade treasury controls.',
      features: ['Role-Based Access', 'Audit Logging', 'Corporate Onboarding', 'Treasury Limits'],
      pilot: 'Enables business customers with compliance requirements. RBAC proves enterprise readiness.'
    },
    {
      id: 'phase3-cannabis',
      icon: <Leaf className="w-6 h-6" />,
      color: 'green',
      title: 'Cannabis Pilot',
      subtitle: 'CraftTrust × MatterFi × Brinks',
      description: 'Full regulatory compliance for cannabis operators. Cash custody, minting, and audit trails.',
      features: ['Brinks Cash Custody', 'Brale TRST Minting', 'Regulatory Compliance', 'KYC/KYB Integration'],
      pilot: 'Complete cash-to-digital flow. Proves regulatory readiness for cannabis industry.'
    }
  ];

  const getPhaseStatus = (phaseId: string) => {
    const phase = phaseState?.phases[phaseId];
    if (!phase) return { status: 'unknown', color: 'gray' };
    
    if (phase.enabled) {
      return { status: 'enabled', color: 'green' };
    }
    
    const deps = phase.dependencies;
    const allDepsEnabled = deps.every(dep => phaseState?.phases[dep]?.enabled);
    
    if (!allDepsEnabled) {
      return { status: 'blocked', color: 'red' };
    }
    
    return { status: 'ready', color: 'yellow' };
  };

  const LEDIndicator = ({ status, color }: { status: string; color: string }) => {
    const colorClasses = {
      green: 'bg-green-500 border-2 border-black',
      yellow: 'bg-yellow-400 border-2 border-black',
      red: 'bg-red-500 border-2 border-black',
      gray: 'bg-gray-400 border-2 border-black'
    };

    return (
      <div className={`w-6 h-6 rounded-full ${colorClasses[color as keyof typeof colorClasses]} shadow-lg animate-pulse`} />
    );
  };

  return (
    <div className="min-h-screen bg-white p-8" style={{ color: 'black' }}>
      <div className="max-w-6xl mx-auto space-y-8" style={{ color: 'black' }}>
        {/* Header */}
        <div className="text-center" style={{ color: 'black' }}>
          <h1 className="text-4xl font-black text-black mb-4" style={{ color: 'black !important' }}>
            TrustMesh v2 Phase Control
          </h1>
          <p className="text-xl font-bold text-black mt-2" style={{ color: 'black !important' }}>
            GenZ → Professional → CraftTrust Rollout Pipeline
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 text-sm font-semibold text-black bg-gray-200 px-4 py-2 rounded-lg border-2 border-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last updated: {phaseState?.lastUpdated ? new Date(phaseState.lastUpdated).toLocaleString() : 'Never'}</span>
            <span>•</span>
            <span>by {phaseState?.updatedBy || 'system'}</span>
          </div>
        </div>

        {/* Current Status Summary */}
        <Card className="border-4 border-black bg-white" style={{ color: 'black' }}>
          <CardHeader style={{ color: 'black' }}>
            <CardTitle className="flex items-center space-x-2 text-black text-xl font-black" style={{ color: 'black !important' }}>
              <CheckCircle className="w-6 h-6 text-black" />
              <span style={{ color: 'black !important' }}>Current System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ color: 'black' }}>
            <div className="text-3xl font-black text-black" style={{ color: 'black !important' }}>
              Active Phase: {phaseState?.phases[phaseState.currentPhase]?.name || 'None'}
            </div>
            <div className="text-black mt-2 font-bold text-lg" style={{ color: 'black !important' }}>
              Enabled Features: {Object.values(phaseState?.phases || {})
                .filter(p => p.enabled)
                .flatMap(p => p.lenses)
                .join(', ') || 'None'}
            </div>
          </CardContent>
        </Card>

        {/* Phase Cards */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {phases.map((phase) => {
            const phaseData = phaseState?.phases[phase.id];
            const { status, color } = getPhaseStatus(phase.id);
            
            return (
              <Card key={phase.id} className="relative overflow-hidden border-4 border-black bg-white" style={{ color: 'black' }}>
                <CardHeader className="pb-4" style={{ color: 'black' }}>
                  <div className="flex items-start justify-between" style={{ color: 'black' }}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg border-2 border-black ${
                        phase.color === 'emerald' ? 'bg-emerald-200 text-black' :
                        phase.color === 'blue' ? 'bg-blue-200 text-black' :
                        'bg-green-200 text-black'
                      }`} style={{ color: 'black' }}>
                        {phase.icon}
                      </div>
                      <div style={{ color: 'black' }}>
                        <CardTitle className="text-xl font-black text-black" style={{ color: 'black !important' }}>{phase.title}</CardTitle>
                        <p className="text-base text-black font-bold" style={{ color: 'black !important' }}>{phase.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <LEDIndicator status={status} color={color} />
                      <Badge 
                        variant="outline"
                        className="font-black text-base px-3 py-1 bg-white text-black border-2 border-black"
                      >
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4" style={{ color: 'black' }}>
                  <p className="text-base text-black font-bold" style={{ color: 'black !important' }}>{phase.description}</p>
                  
                  <div style={{ color: 'black' }}>
                    <h4 className="font-black text-base mb-2 text-black" style={{ color: 'black !important' }}>Key Features:</h4>
                    <ul className="text-sm text-black space-y-2" style={{ color: 'black' }}>
                      {phase.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-3" style={{ color: 'black' }}>
                          <span className="w-3 h-3 bg-black rounded-full flex-shrink-0"></span>
                          <span className="font-bold" style={{ color: 'black !important' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-200 p-4 rounded-lg border-2 border-black" style={{ color: 'black' }}>
                    <h4 className="font-black text-base mb-2 text-black" style={{ color: 'black !important' }}>Pilot Impact:</h4>
                    <p className="text-sm text-black font-bold" style={{ color: 'black !important' }}>{phase.pilot}</p>
                  </div>
                  
                  {phaseData && (
                    <div className="flex space-x-2">
                  {!phaseData.enabled && status !== 'blocked' && (
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="flex-1 border-2 border-black text-black font-black text-base hover:bg-green-200"
                          onClick={() => handlePhaseAction(phase.id, 'enable')}
                          disabled={actionLoading === `enable-${phase.id}`}
                        >
                          {actionLoading === `enable-${phase.id}` ? 'Enabling...' : 'Enable Phase'}
                        </Button>
                      )}
                      {phaseData.enabled && (
                        <Button 
                          size="lg" 
                          variant="destructive"
                          className="flex-1 border-2 border-black text-white font-black text-base bg-red-600 hover:bg-red-700"
                          onClick={() => handlePhaseAction(phase.id, 'disable')}
                          disabled={actionLoading === `disable-${phase.id}`}
                        >
                          {actionLoading === `disable-${phase.id}` ? 'Disabling...' : 'Disable Phase'}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {status === 'blocked' && (
                    <div className="flex items-center space-x-3 text-base text-black bg-red-200 border-2 border-black p-3 rounded">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-black">Dependencies required: {phaseData?.dependencies.join(', ')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Execution Sequence */}
        <Card className="border-4 border-black bg-white">
          <CardHeader>
            <CardTitle className="text-black font-black text-xl">Execution Sequence for Cannabis Pilot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-6 bg-green-100 rounded-lg border-4 border-black">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white">1</div>
                </div>
                <div>
                  <h3 className="font-black text-black text-lg">Start with GenZ (Your Hackathon Entry)</h3>
                  <p className="text-base text-black font-bold">Most developed infrastructure. Proves core wallet + recognition functionality.</p>
                  <p className="text-sm text-black mt-2 font-black bg-white px-3 py-1 rounded border-2 border-black">Status: {getPhaseStatus('phase1-genz').status.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-blue-100 rounded-lg border-4 border-black">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white">2</div>
                </div>
                <div>
                  <h3 className="font-black text-black text-lg">Add Professional Features</h3>
                  <p className="text-base text-black font-bold">RBAC, audit trails, corporate treasury management for business users.</p>
                  <p className="text-sm text-black mt-2 font-black bg-white px-3 py-1 rounded border-2 border-black">Status: {getPhaseStatus('phase2-professional').status.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-purple-100 rounded-lg border-4 border-black">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-white">3</div>
                </div>
                <div>
                  <h3 className="font-black text-black text-lg">Full CraftTrust Cannabis Pilot</h3>
                  <p className="text-base text-black font-bold">Brinks + MatterFi + Brale integration. Full regulatory compliance.</p>
                  <p className="text-sm text-black mt-2 font-black bg-white px-3 py-1 rounded border-2 border-black">Status: {getPhaseStatus('phase3-cannabis').status.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-4 border-black bg-white">
          <CardHeader>
            <CardTitle className="text-black font-black text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-20 border-4 border-black text-black font-black text-base bg-white hover:bg-blue-200"
                onClick={() => window.open('/api/health/phase', '_blank')}
              >
                <div className="text-center">
                  <div className="font-black text-black text-base">System Health</div>
                  <div className="text-sm text-black font-bold">Check API status</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 border-4 border-black text-black font-black text-base bg-white hover:bg-green-200"
                onClick={() => fetchPhaseState()}
              >
                <div className="text-center">
                  <div className="font-black text-black text-base">Refresh Status</div>
                  <div className="text-sm text-black font-bold">Update phase data</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 border-4 border-black text-black font-black text-base bg-white hover:bg-purple-200"
                onClick={() => window.open('/docs/PHASE_CONTROL.md', '_blank')}
              >
                <div className="text-center">
                  <div className="font-black text-black text-base">Documentation</div>
                  <div className="text-sm text-black font-bold">Phase control guide</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}