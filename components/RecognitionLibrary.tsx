"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { recognitionSignals, type RecognitionSignal, type SignalCategory } from '@/lib/data/recognitionSignals'
import { Search, Filter, Star, Users, GraduationCap, Briefcase, Globe } from 'lucide-react'

type RarityLevel = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

const rarityColors: Record<RarityLevel, string> = {
  'Common': 'bg-gray-100 text-gray-700 border-gray-300',
  'Uncommon': 'bg-green-100 text-green-700 border-green-300', 
  'Rare': 'bg-blue-100 text-blue-700 border-blue-300',
  'Epic': 'bg-purple-100 text-purple-700 border-purple-300',
  'Legendary': 'bg-yellow-100 text-yellow-700 border-yellow-300'
}

const categoryColors: Record<SignalCategory, string> = {
  'social': 'border-l-cyan-500 bg-purple-50',
  'academic': 'border-l-purple-500 bg-purple-50', 
  'professional': 'border-l-blue-500 bg-blue-50'
}

const categoryIcons: Record<SignalCategory, React.ReactNode> = {
  'social': <Users className="w-4 h-4" />,
  'academic': <GraduationCap className="w-4 h-4" />,
  'professional': <Briefcase className="w-4 h-4" />
}

interface RecognitionCardProps {
  signal: RecognitionSignal
  expanded?: boolean
  onToggle?: () => void
}

function RecognitionCard({ signal, expanded, onToggle }: RecognitionCardProps) {
  const rarityStyle = rarityColors[signal.rarity as RarityLevel] || rarityColors.Common
  const categoryStyle = categoryColors[signal.category]

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${categoryStyle} border-l-4 ${expanded ? 'col-span-full' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{signal.icon}</div>
            <div>
              <CardTitle className="text-lg font-semibold">{signal.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${rarityStyle}`}>
              {signal.rarity}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {categoryIcons[signal.category]}
              <span className="capitalize">{signal.category}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Extended Description */}
            <div>
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {signal.extendedDescription}
              </p>
            </div>

            {/* Stats */}
            <div>
              <h4 className="font-medium mb-2">Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{signal.stats.popularity}</div>
                  <div className="text-xs text-muted-foreground">Popularity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{signal.stats.impact}</div>
                  <div className="text-xs text-muted-foreground">Impact</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{signal.stats.authenticity}</div>
                  <div className="text-xs text-muted-foreground">Authenticity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{signal.stats.difficulty}</div>
                  <div className="text-xs text-muted-foreground">Difficulty</div>
                </div>
              </div>
            </div>

            {/* Traits */}
            <div>
              <h4 className="font-medium mb-2">Traits</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Personality:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {signal.traits.personality.map((trait, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {signal.traits.skills.map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Backstory */}
            <div>
              <h4 className="font-medium mb-2">Origin Story</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {signal.backstory}
              </p>
            </div>

            {/* Tips */}
            {signal.tips.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Pro Tips</h4>
                <ul className="space-y-1">
                  {signal.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              Show Less
            </Button>
          </div>
        </CardContent>
      )}
      
      {!expanded && (
        <CardContent className="pt-0">
          <Button variant="ghost" size="sm" onClick={onToggle} className="w-full">
            View Details
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

export default function RecognitionLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SignalCategory | 'all'>('all')
  const [selectedRarity, setSelectedRarity] = useState<RarityLevel | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredSignals = useMemo(() => {
    return recognitionSignals.filter(signal => {
      const matchesSearch = signal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           signal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (signal.extendedDescription?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || signal.category === selectedCategory
      const matchesRarity = selectedRarity === 'all' || signal.rarity === selectedRarity
      
      return matchesSearch && matchesCategory && matchesRarity && signal.isActive
    })
  }, [searchTerm, selectedCategory, selectedRarity])

  const categoryStats = useMemo(() => {
    const stats: Record<SignalCategory, number> = {
      social: 0,
      academic: 0, 
      professional: 0
    }
    recognitionSignals.forEach(signal => {
      if (signal.isActive) {
        stats[signal.category]++
      }
    })
    return stats
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recognition Library</h1>
        <p className="text-muted-foreground">
          Explore all available recognition tokens with their full metadata
        </p>
        <div className="flex justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-500" />
            <span>{categoryStats.social} Social</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <span>{categoryStats.academic} Academic</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span>{categoryStats.professional} Professional</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search recognitions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="px-3 py-1.5 border rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SignalCategory | 'all')}
          >
            <option value="all">All Categories</option>
            <option value="social">Social</option>
            <option value="academic">Academic</option>
            <option value="professional">Professional</option>
          </select>
          <select
            className="px-3 py-1.5 border rounded-md text-sm"
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value as RarityLevel | 'all')}
          >
            <option value="all">All Rarities</option>
            <option value="Common">Common</option>
            <option value="Uncommon">Uncommon</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {filteredSignals.length} of {recognitionSignals.filter(s => s.isActive).length} recognitions
      </div>

      {/* Recognition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSignals.map((signal) => (
          <RecognitionCard
            key={signal.id}
            signal={signal}
            expanded={expandedId === signal.id}
            onToggle={() => setExpandedId(expandedId === signal.id ? null : signal.id)}
          />
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No recognitions found matching your criteria
          </div>
          <Button 
            variant="ghost" 
            className="mt-2"
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('all')
              setSelectedRarity('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}