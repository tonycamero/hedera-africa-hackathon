"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
import type { RecognitionSignal } from "@/lib/stores/signalsStore"
import type { HCSRecognitionInstance, HCSRecognitionDefinition } from "@/lib/services/HCSRecognitionService"
import { Award, ExternalLink, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface RecognitionGridProps {
  ownerId: string
  maxItems?: number
}

// Convert HCS recognition instance + definition to display format
interface HCSRecognitionDisplay {
  id: string
  name: string
  emoji: string
  category: 'social' | 'academic' | 'professional'
  tokenId: string
}

function MiniRecognitionCard({ signal }: { signal: HCSRecognitionDisplay }) {
  const categoryColors = {
    social: "border-cyan-500/50 bg-cyan-500/10",
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

export function RecognitionGrid({ ownerId, maxItems = 6 }: RecognitionGridProps) {
  const [ownedSignals, setOwnedSignals] = useState<HCSRecognitionDisplay[]>([])

  useEffect(() => {
    if (!ownerId) return

    const loadOwnedSignals = async () => {
      try {
        // Get owned recognition instances from HCS
        const instances = await hcsRecognitionService.getUserRecognitionInstances(ownerId)
        
        // Convert instances to display format
        const displaySignals: HCSRecognitionDisplay[] = []
        
        for (const instance of instances.slice(0, maxItems)) {
          try {
            const definition = await hcsRecognitionService.getRecognitionDefinition(instance.definitionId)
            if (definition) {
              displaySignals.push({
                id: instance.id,
                name: definition.name,
                emoji: definition.emoji,
                category: definition.category as 'social' | 'academic' | 'professional',
                tokenId: instance.id.slice(-8) // Show last 8 chars as token ID
              })
            }
          } catch (error) {
            console.error('[RecognitionGrid] Failed to load definition for instance:', instance.id, error)
          }
        }
        
        setOwnedSignals(displaySignals)
      } catch (error) {
        console.error('[RecognitionGrid] Failed to load owned recognition from HCS:', error)
        setOwnedSignals([])
      }
    }

    loadOwnedSignals()

    // Poll for updates only if recognition service is ready
    const interval = setInterval(() => {
      if (hcsRecognitionService.isReady()) {
        loadOwnedSignals()
      }
    }, 5000) // Slower polling to reduce load
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