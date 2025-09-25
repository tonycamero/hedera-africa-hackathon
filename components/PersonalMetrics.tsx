"use client"

import { Card, CardContent } from "@/components/ui/card"
import { hcsFeedService } from "@/lib/services/HCSFeedService"
import { hcsRecognitionService } from "@/lib/services/HCSRecognitionService"
import { getPersonalMetricsFromHCS } from "@/lib/services/HCSDataUtils"
import { Users, Heart, Award } from "lucide-react"
import { useEffect, useState } from "react"

interface PersonalMetricsProps {
  sessionId: string
}

interface Metrics {
  bondedContacts: number
  trustAllocated: number
  trustCapacity: number
  recognitionOwned: number
}

export function PersonalMetrics({ sessionId }: PersonalMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    bondedContacts: 0,
    trustAllocated: 0, 
    trustCapacity: 9,
    recognitionOwned: 0
  })

  useEffect(() => {
    if (!sessionId) return

    const updateMetrics = async () => {
      try {
        // Only try to get HCS events if service is ready or initializing
        if (!hcsFeedService.isReady() && !hcsFeedService.isInitializingService()) {
          // Service not ready and not initializing, use fallback
          setMetrics({
            bondedContacts: 0,
            trustAllocated: 0,
            trustCapacity: 9,
            recognitionOwned: 0
          })
          return
        }
        
        // Get all HCS events
        const events = await hcsFeedService.getAllFeedEvents()
        
        // Get recognition count from HCS recognition service
        let recognitionCount = 0
        try {
          const ownedInstances = await hcsRecognitionService.getUserRecognitionInstances(sessionId)
          recognitionCount = ownedInstances.length
        } catch (error) {
          console.log('[PersonalMetrics] Recognition service not ready, using 0 count')
        }
        
        // Derive metrics from HCS events
        const hcsMetrics = getPersonalMetricsFromHCS(events, sessionId, recognitionCount)
        
        setMetrics({
          bondedContacts: hcsMetrics.bondedContacts,
          trustAllocated: hcsMetrics.trustAllocated,
          trustCapacity: hcsMetrics.trustCapacity,
          recognitionOwned: hcsMetrics.recognitionOwned
        })
      } catch (error) {
        console.log('[PersonalMetrics] Failed to load metrics from HCS, using fallback:', error.message)
        // Fallback to zeros if HCS fails
        setMetrics({
          bondedContacts: 0,
          trustAllocated: 0,
          trustCapacity: 9,
          recognitionOwned: 0
        })
      }
    }

    updateMetrics()

    // Poll for updates only if HCS service is ready
    const interval = setInterval(() => {
      if (hcsFeedService.isReady()) {
        updateMetrics()
      }
    }, 5000) // Slower polling to reduce load
    return () => clearInterval(interval)
  }, [sessionId])

  const metricItems = [
    {
      icon: <Users className="w-4 h-4" />,
      label: "Bonded",
      value: `${metrics.bondedContacts}`,
      color: "text-blue-600"
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Trust",
      value: `${metrics.trustAllocated}/${metrics.trustCapacity}`,
      color: "text-green-600"
    },
    {
      icon: <Award className="w-4 h-4" />,
      label: "Recognition",
      value: `${metrics.recognitionOwned}`,
      color: "text-purple-600"
    }
  ]

  return (
    <Card>
      <CardContent className="py-4">
        <div className="grid grid-cols-3 gap-4">
          {metricItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`${item.color} flex justify-center mb-1`}>
                {item.icon}
              </div>
              <div className="text-lg font-semibold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}