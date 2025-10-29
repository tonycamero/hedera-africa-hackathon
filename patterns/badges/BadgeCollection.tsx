"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type BadgeMetadata, type BadgeCategory, BADGE_DEFINITIONS } from "@/lib/types/BadgeTypes"
import { BadgeEngine } from "@/packages/badges/BadgeEngine"

interface BadgeCollectionProps {
  userId: string
  badges: BadgeMetadata[]
}

export function BadgeCollection({ userId, badges }: BadgeCollectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>("academic")
  const badgeEngine = new BadgeEngine()

  const categories: { key: BadgeCategory; label: string; emoji: string }[] = [
    { key: "academic", label: "Academic", emoji: "📚" },
    { key: "professional", label: "Professional", emoji: "💼" },
    { key: "peer-to-peer", label: "Social", emoji: "🤝" },
    { key: "institutional", label: "Institutional", emoji: "🏛️" },
    { key: "experimental", label: "Meme-Core", emoji: "🎭" },
  ]

  const getBadgesByCategory = (category: BadgeCategory) => {
    return badges.filter((badge) => badge.category === category && badge.status === "active")
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-400 to-orange-500"
      case "rare":
        return "bg-gradient-to-r from-purple-400 to-pink-500"
      default:
        return "bg-gradient-to-r from-blue-400 to-purple-500"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏅</span>
          Badge Collection
          <Badge variant="secondary" className="ml-auto">
            {badges.filter((b) => b.status === "active").length} badges
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as BadgeCategory)}>
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
                {getBadgesByCategory(category.key).map((badge, index) => {
                  const definition = BADGE_DEFINITIONS.find((d) => d.name === badge.name)
                  return (
                    <Card
                      key={index}
                      className={`relative overflow-hidden ${getRarityColor(badge.rarity || "common")} p-[1px]`}
                    >
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-full">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{definition?.emoji || "🏅"}</span>
                          <Badge variant="outline" className="text-xs">
                            {badge.rarity || "common"}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{badge.description}</p>
                        <div className="text-xs text-gray-500">
                          <p>Issued by: {badge.issuer}</p>
                          <p>Date: {new Date(badge.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {getBadgesByCategory(category.key).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">{category.emoji}</span>
                    <p>No {category.label.toLowerCase()} badges yet</p>
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
