"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { directHCSRecognitionService, type RecognitionDefinition, type RecognitionInstance } from "@/lib/services/DirectHCSRecognitionService"
// Legacy fallback service
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
import { Award, ExternalLink, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface RecognitionGridProps {
  ownerId: string
  maxItems?: number
}

// Display format for recognition instances
interface RecognitionDisplay {
  id: string
  name: string
  emoji: string
  category: 'social' | 'academic' | 'professional'
  tokenId: string
  rarity?: string
}

function MiniRecognitionCard({ signal }: { signal: RecognitionDisplay }) {
  const categoryColors = {
    social: "border-purple-500/50 bg-purple-500/10",
    academic: "border-purple-500/50 bg-purple-500/10", 
    professional: "border-slate-500/50 bg-slate-500/10"
  }

  return (
    <Card className={`${categoryColors[signal.category]} hover:scale-105 transition-transform cursor-pointer`}>
      <CardContent className="p-3 text-center">
        <div className="text-2xl mb-1">{signal.emoji}</div>
        <div className="text-xs font-medium truncate">{signal.name}</div>
        <div className="text-xs text-muted-foreground">{signal.tokenId}</div>
      </CardContent>
    </Card>
  )
}

// Service selection based on environment flag (defaulting to DirectHCS for better performance)
const getRecognitionService = () => {
  const useDirectService = process.env.NEXT_PUBLIC_RECOG_DIRECT !== 'false'; // Default to true
  console.log('[RecognitionGrid] Using', useDirectService ? 'DirectHCS' : 'Legacy', 'recognition service');
  return useDirectService ? directHCSRecognitionService : hcsRecognitionService;
};

export function RecognitionGrid({ ownerId, maxItems = 6 }: RecognitionGridProps) {
  const [ownedSignals, setOwnedSignals] = useState<RecognitionDisplay[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (!ownerId) return

    const loadOwnedSignals = async () => {
      try {
        const recognitionService = getRecognitionService();
        const serviceType = recognitionService === directHCSRecognitionService ? 'DirectHCS' : 'Legacy';
        console.log(`[RecognitionGrid] Loading recognition data for owner ${ownerId} (${serviceType} service)...`);
        
        // Initialize recognition service
        await recognitionService.initialize();
        
        // Get all definitions for debug
        const allDefinitions = recognitionService.getAllDefinitions ? 
          recognitionService.getAllDefinitions() : 
          recognitionService.getDefinitions();
        
        // Get user's recognition instances (with proper method fallback)
        const instances = recognitionService.getUserInstances ? 
          recognitionService.getUserInstances(ownerId) :
          recognitionService.getUserRecognitionInstances(ownerId);
        console.log(`[RecognitionGrid] Found ${instances.length} instances for owner ${ownerId}:`, instances);
        
        // Store debug info for DevTools access
        const debugData = {
          serviceType,
          definitions: allDefinitions,
          userInstances: instances,
          definitionsCount: allDefinitions.length,
          instancesCount: instances.length,
          timestamp: new Date().toISOString()
        };
        setDebugInfo(debugData);
        
        // Expose in window object for quick verification
        if (typeof window !== 'undefined') {
          (window as any).debugRecognitionPage = debugData;
          console.log('[RecognitionGrid] Debug data exposed:', debugData);
        }
        
        // Convert instances to display format
        const displaySignals: RecognitionDisplay[] = []
        
        for (const instance of instances.slice(0, maxItems)) {
          console.log(`[RecognitionGrid] Processing instance:`, instance)
          
          // Get definition for this instance (with proper method fallback)
          const definition = recognitionService.getDefinition ? 
            recognitionService.getDefinition(instance.definitionId) :
            recognitionService.getRecognitionDefinition(instance.definitionId)
          
          if (definition) {
            const displaySignal: RecognitionDisplay = {
              id: instance.id,
              name: definition.name,
              emoji: definition.icon || '🏆',
              category: definition.category || 'social',
              tokenId: instance.id.slice(-8),
              rarity: definition.rarity
            }
            displaySignals.push(displaySignal)
            console.log(`[RecognitionGrid] Added display signal:`, displaySignal)
          } else {
            console.warn(`[RecognitionGrid] No definition found for instance:`, instance.definitionId)
          }
        }
        
        console.log(`[RecognitionGrid] Setting ${displaySignals.length} display signals (direct HCS)`)
        setOwnedSignals(displaySignals)
        
      } catch (error) {
        console.error('[RecognitionGrid] Failed to load recognition data:', error)
        setOwnedSignals([])
      }
    }

    loadOwnedSignals()

    // Poll for updates only if recognition service is ready
    const interval = setInterval(() => {
      const recognitionService = getRecognitionService();
      if (recognitionService.isReady && recognitionService.isReady()) {
        loadOwnedSignals();
      }
    }, 10000); // Less frequent polling
    return () => clearInterval(interval)
  }, [ownerId, maxItems])

  if (ownedSignals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4" />
            Your Recognition
            <Badge variant="secondary">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4 text-muted-foreground">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No recognition signals yet</p>
            <p className="text-xs">Earn achievements to collect hashinals</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4" />
            Your Recognition
            <Badge variant="secondary">{ownedSignals.length}</Badge>
          </CardTitle>
          {ownedSignals.length > 0 && (
            <Link href="/recognition">
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                View All <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          {ownedSignals.map((signal) => (
            <MiniRecognitionCard key={signal.id} signal={signal} />
          ))}
          
          {/* Add placeholder for creating new signal */}
          <Link href="/signals-recognition">
            <Card className="border-dashed hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-3 text-center">
                <Plus className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">Create</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}