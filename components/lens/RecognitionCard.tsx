'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { LensType } from '@/lib/v2/schema/tm.recognition@1';

// Safe UUID generator with fallback for Safari private mode
const uuid = () => (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Feature flag hook with proper client hydration
function useV2Engine(): boolean {
  const [flag, setFlag] = useState(
    process.env.NEXT_PUBLIC_FEATURE_TRUSTMESH_V2_ENGINE === '1'
  );
  
  useEffect(() => {
    try {
      const v = localStorage.getItem('FEATURE_TRUSTMESH_V2_ENGINE');
      if (v === '1' || v === 'true') setFlag(true);
      if (v === '0' || v === 'false') setFlag(false);
    } catch {
      // localStorage unavailable (SSR/private mode)
    }
  }, []);
  
  return flag;
}

// TODO: Replace with real auth/wallet context
function useSenderId(): string | null {
  // This should integrate with your CraftTrust RBAC system
  // e.g., from AuthContext or WalletContext
  // const { user } = useAuth();
  // return user?.hederaAccountId || user?.custodialAccountId || null;
  return '0.0.12345'; // TEMP - remove when auth is wired
}

// Recognition form data
interface RecognitionFormData {
  recipientId: string;
  lens: LensType;
  title: string;
  description: string;
  category: string;
  skills: string[];
  spaceId: string;
}

// Lens-specific metadata forms
interface LensMetadataProps {
  lens: LensType;
  data: any;
  onChange: (data: any) => void;
}

const GenZMetadata: React.FC<LensMetadataProps> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="vibe-check">Vibe Check</Label>
      <Select value={data.vibeCheck || ''} onValueChange={(value) => onChange({ ...data, vibeCheck: value })}>
        <SelectTrigger id="vibe-check" aria-describedby="vibe-help">
          <SelectValue placeholder="Select vibe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fire">🔥 Fire</SelectItem>
          <SelectItem value="mid">😐 Mid</SelectItem>
          <SelectItem value="cringe">😬 Cringe</SelectItem>
        </SelectContent>
      </Select>
      <p id="vibe-help" className="text-xs text-muted-foreground mt-1">
        How did this recognition land with the community?
      </p>
    </div>
    <div>
      <Label htmlFor="streak-count">Streak Count</Label>
      <Input
        id="streak-count"
        type="number"
        placeholder="0"
        min="0"
        value={data.streakCount || ''}
        onChange={(e) => onChange({ ...data, streakCount: parseInt(e.target.value) || 0 })}
      />
    </div>
  </div>
);

const ProfessionalMetadata: React.FC<LensMetadataProps> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="industry-context">Industry Context</Label>
      <Input
        id="industry-context"
        placeholder="e.g., blockchain_security, cannabis_compliance"
        value={data.industryContext || ''}
        onChange={(e) => onChange({ ...data, industryContext: e.target.value })}
      />
    </div>
    <div>
      <Label htmlFor="competency-level">Competency Level</Label>
      <Select value={data.competencyLevel || ''} onValueChange={(value) => onChange({ ...data, competencyLevel: value })}>
        <SelectTrigger id="competency-level">
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="novice">Novice</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="expert">Expert</SelectItem>
          <SelectItem value="master">Master</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

const SocialMetadata: React.FC<LensMetadataProps> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="community-impact">Community Impact</Label>
      <Select value={data.communityImpact || ''} onValueChange={(value) => onChange({ ...data, communityImpact: value })}>
        <SelectTrigger id="community-impact">
          <SelectValue placeholder="Select impact scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">Local</SelectItem>
          <SelectItem value="regional">Regional</SelectItem>
          <SelectItem value="national">National</SelectItem>
          <SelectItem value="global">Global</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="collaboration-score">Collaboration Score</Label>
      <Input
        id="collaboration-score"
        type="number"
        placeholder="0-100"
        min="0"
        max="100"
        value={data.collaborationScore || ''}
        onChange={(e) => onChange({ ...data, collaborationScore: parseInt(e.target.value) || 0 })}
      />
    </div>
  </div>
);

const BuilderMetadata: React.FC<LensMetadataProps> = ({ data, onChange }) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="project-phase">Project Phase</Label>
      <Select value={data.projectPhase || ''} onValueChange={(value) => onChange({ ...data, projectPhase: value })}>
        <SelectTrigger id="project-phase">
          <SelectValue placeholder="Select phase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="concept">Concept</SelectItem>
          <SelectItem value="prototype">Prototype</SelectItem>
          <SelectItem value="mvp">MVP</SelectItem>
          <SelectItem value="production">Production</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor="github-repo">GitHub Repo (Optional)</Label>
      <Input
        id="github-repo"
        type="url"
        placeholder="https://github.com/..."
        value={data.githubRepo || ''}
        onChange={(e) => onChange({ ...data, githubRepo: e.target.value })}
      />
    </div>
  </div>
);

// Main Recognition Card Component
export default function RecognitionCard() {
  const { toast } = useToast();
  const useV2 = useV2Engine();
  const senderId = useSenderId();
  
  const [formData, setFormData] = useState<RecognitionFormData>({
    recipientId: '',
    lens: 'genz',
    title: '',
    description: '',
    category: '',
    skills: [],
    spaceId: 'tm.v2.crafttrust.dispensary-1' // Default cannabis facility space
  });
  
  const [lensData, setLensData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  
  // Persist one idempotency key per attempt until success
  const [idemKey, setIdemKey] = useState<string>(uuid());
  
  // Validate form - can only submit if auth + required fields filled
  const canSubmit = useMemo(() =>
    Boolean(senderId && formData.recipientId && formData.title && formData.description), 
    [senderId, formData]
  );

  // Handle lens change and reset lens-specific data
  const handleLensChange = useCallback((lens: LensType) => {
    setFormData(prev => ({ ...prev, lens }));
    setLensData({}); // Reset lens-specific data
  }, []);

  // Handle form submission with proper error handling and idempotency
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      toast({
        title: 'Missing information',
        description: 'Fill required fields and ensure you are signed in.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    setLastResult(null);

    try {
      const endpoint = useV2 ? '/api/recognition-v2' : '/api/recognition';
      
      const payload = {
        spaceId: formData.spaceId,
        senderId, // from auth hook
        recipientId: formData.recipientId,
        lens: formData.lens,
        correlationId: idemKey, // body-level deduplication
        metadata: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          lensData,
          skills: formData.skills,
          visibility: 'space'
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin', // Include cookies for auth
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Idempotency-Key': idemKey // Header-level deduplication
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        const msg = result?.error || 'Recognition submission failed';
        const detail = result?.details ? ` — ${String(result.details).slice(0, 180)}` : '';
        throw new Error(`${msg}${detail}`);
      }

      setLastResult(result);
      
      toast({
        title: 'Recognition sent! 🎉',
        description: `Successfully submitted ${formData.lens} recognition${useV2 ? ' via v2 engine' : ''}.`,
      });

      // Success → rotate idempotency key for next attempt
      setIdemKey(uuid());

      // Reset form but preserve space
      setFormData(prev => ({
        recipientId: '',
        lens: 'genz',
        title: '',
        description: '',
        category: '',
        skills: [],
        spaceId: prev.spaceId // Preserve space selection
      }));
      setLensData({});

    } catch (error: any) {
      console.error('Recognition submission error:', error);
      toast({
        title: 'Submission failed',
        description: error?.message || 'Failed to submit recognition',
        variant: 'destructive'
      });
      // Keep same idemKey so user can retry the same attempt safely
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render lens-specific metadata form
  const renderLensMetadata = () => {
    const props = { lens: formData.lens, data: lensData, onChange: setLensData };
    
    switch (formData.lens) {
      case 'genz': return <GenZMetadata {...props} />;
      case 'professional': return <ProfessionalMetadata {...props} />;
      case 'social': return <SocialMetadata {...props} />;
      case 'builder': return <BuilderMetadata {...props} />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Send Recognition
              {useV2 && <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                v2 Engine
              </Badge>}
            </CardTitle>
            <CardDescription>
              {useV2 
                ? 'Using TrustMesh v2 Universal Recognition Engine with HCS consensus & MatterFi treasury integration'
                : 'Using legacy GenZ recognition flow'
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Auth status indicator */}
          {!senderId && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">Sign in required to send recognitions</span>
            </div>
          )}

          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Account ID *</Label>
            <Input
              id="recipient"
              placeholder="0.0.123456 or custodial account"
              value={formData.recipientId}
              onChange={(e) => setFormData(prev => ({ ...prev, recipientId: e.target.value }))}
              aria-invalid={!formData.recipientId}
              required
            />
          </div>

          {/* Lens Selection - only show in v2 mode */}
          {useV2 && (
            <div className="space-y-2">
              <Label htmlFor="lens-select">Recognition Lens *</Label>
              <Select value={formData.lens} onValueChange={handleLensChange}>
                <SelectTrigger id="lens-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genz">🔥 GenZ - Social vibes & energy</SelectItem>
                  <SelectItem value="professional">💼 Professional - Work achievements</SelectItem>
                  <SelectItem value="social">🤝 Social - Community impact</SelectItem>
                  <SelectItem value="builder">🔨 Builder - Technical contributions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Recognition Title *</Label>
            <Input
              id="title"
              placeholder={
                formData.lens === 'genz' ? 'Crushed that presentation! 🔥' :
                formData.lens === 'professional' ? 'Exceptional Smart Contract Security Audit' :
                formData.lens === 'social' ? 'Community Education Workshop Leadership' :
                'MVP Implementation of Universal Recognition Engine'
              }
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              aria-invalid={!formData.title}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what made this recognition-worthy..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[100px]"
              aria-invalid={!formData.description}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="presentation, security_audit, community_education, etc."
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>

          {/* Lens-specific metadata - only show in v2 mode */}
          {useV2 && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {formData.lens.charAt(0).toUpperCase() + formData.lens.slice(1)} Details
              </Label>
              <div className="border rounded-lg p-4 bg-muted/50">
                {renderLensMetadata()}
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              placeholder="public_speaking, demo, energy"
              value={formData.skills.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
            />
          </div>

          {/* Last Result Display with accessibility */}
          {lastResult && (
            <div 
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Recognition Submitted</span>
              </div>
              <div className="text-sm space-y-1 text-green-700">
                <p><strong>ID:</strong> {lastResult.recognition?.recognitionId}</p>
                <p><strong>Lens:</strong> {lastResult.lens}</p>
                {lastResult.recognition?.hcsSequenceNumber && (
                  <p><strong>HCS Sequence:</strong> {lastResult.recognition.hcsSequenceNumber}</p>
                )}
                {lastResult.recognition?.proofHash && (
                  <p><strong>Proof Hash:</strong> {lastResult.recognition.proofHash.slice(0, 16)}...</p>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Recognition
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}