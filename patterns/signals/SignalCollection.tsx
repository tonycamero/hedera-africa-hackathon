"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type SignalMetadata, type SignalCategory, SIGNAL_DEFINITIONS } from "@/lib/types/SignalTypes"
import { SignalEngine } from "@/packages/signals/SignalEngine"

interface SignalCollectionProps {
  userId: string
  signals: SignalMetadata[]
}

export function SignalCollection({ userId, signals }: SignalCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory>("academic")
  const signalEngine = new SignalEngine()

  const categories: { key: SignalCategory; label: string; emoji: string }[] = [
    { key: "academic", label: "Academic", emoji: "📚" },
    { key: "professional", label: "Professional", emoji: "💼" },
    { key: "peer-to-peer", label: "Social", emoji: "🤝" },
    { key: "institutional", label: "Institutional", emoji: "🏛️" },
    { key: "experimental", label: "Meme-Core", emoji: "🎭" },
  ]

  const getSignalsByCategory = (category: SignalCategory) => {
    return signals.filter((signal) => signal.category === category && signal.status === "active")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📡</span>
          Trust Signals
          <Badge variant="secondary" className="ml-auto">
            {signals.filter((s) => s.status === "active").length} signals
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as SignalCategory)}>
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category.key} value={category.key} className="text-xs">
                <span className="mr-1">{category.emoji}</span>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSignalsByCategory(category.key).map((signal, index) => {
                  const definition = SIGNAL_DEFINITIONS.find((d) => d.name === signal.name)
                  return (
                    <Card
                      key={index}
                      className="relative overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 p-[1px]"
                    >
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-full">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{definition?.emoji || "📡"}</span>
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{signal.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{signal.description}</p>
                        <div className="text-xs text-gray-500">
                          <p>Issued by: {signal.issuer}</p>
                          <p>Date: {new Date(signal.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {getSignalsByCategory(category.key).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">{category.emoji}</span>
                    <p>No {category.label.toLowerCase()} signals yet</p>
                    <p className="text-sm">Start building your reputation!</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}