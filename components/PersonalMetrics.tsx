"use client"

import { Card, CardContent } from "@/components/ui/card"
import { signalsStore } from "@/lib/stores/signalsStore"
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

    const updateMetrics = () => {
      const bonded = signalsStore.getBondedContacts(sessionId)
      const trustStats = signalsStore.getTrustStats(sessionId)
      const ownedHashinals = signalsStore.getOwnedHashinals(sessionId)
      
      setMetrics({
        bondedContacts: bonded.length,
        trustAllocated: trustStats.allocatedOut,
        trustCapacity: Math.min(bonded.length, 9), // Cap is min of bonded or 9
        recognitionOwned: ownedHashinals.length
      })
    }

    updateMetrics()

    // Poll for updates
    const interval = setInterval(updateMetrics, 2000)
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