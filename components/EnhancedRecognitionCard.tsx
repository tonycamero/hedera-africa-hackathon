"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { recognitionSignals, type RecognitionSignal as RecognitionDefinition } from '@/lib/data/recognitionSignals'
import { ChevronDown, ChevronUp, Calendar, User, Award, ExternalLink, Zap, Star } from 'lucide-react'

export interface EnhancedRecognitionSignal {
  id: string
  category: 'social' | 'academic' | 'professional'
  name: string
  subtitle?: string
  tokenId: string
  ownerId: string
  issuerId: string
  tokenStatus: 'active' | 'transferred' | 'burned'
  hrl?: string
  emoji?: string
  ts: number
  status: 'local' | 'onchain' | 'error'
  // Enhanced metadata from HCS
  evidence?: string
  context?: string
  metadata?: Record<string, any>
  earnedAt?: number
  xp?: number
  rarity?: string
}

interface Props {
  signal: EnhancedRecognitionSignal
  showDetails?: boolean
}

type RarityLevel = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

const categoryStyles = {
  social: 'border-l-cyan-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700',
  academic: 'border-l-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700',
  professional: 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-slate-50 text-blue-700',
}

const rarityColors: Record<RarityLevel, string> = {
  'Common': 'bg-gray-100 text-gray-700 border-gray-300',
  'Uncommon': 'bg-green-100 text-green-700 border-green-300', 
  'Rare': 'bg-blue-100 text-blue-700 border-blue-300',
  'Epic': 'bg-purple-100 text-purple-700 border-purple-300 shadow-purple-200 shadow-lg',
  'Legendary': 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-300 shadow-orange-200 shadow-lg animate-pulse'
}

const rarityGlow: Record<RarityLevel, string> = {
  'Common': '',
  'Uncommon': 'shadow-green-200 shadow-md',
  'Rare': 'shadow-blue-200 shadow-md',
  'Epic': 'shadow-purple-300 shadow-lg',
  'Legendary': 'shadow-orange-300 shadow-xl animate-pulse'
}

export function EnhancedRecognitionCard({ signal, showDetails = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const categoryStyle = categoryStyles[signal.category]
  
  // Get rich metadata from recognition library
  const definition = recognitionSignals.find(def => def.id === signal.id)
  const rarity = (signal.rarity || definition?.rarity) as RarityLevel || 'Common'
  const rarityStyle = rarityColors[rarity]
  const glowStyle = rarityGlow[rarity]
  
  const isLegendary = rarity === 'Legendary'
  const isEpic = rarity === 'Epic' || rarity === 'Legendary'
  
  return (
    <Card className={`border-l-4 ${categoryStyle} ${glowStyle} transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${expanded ? 'ring-2 ring-blue-200' : ''} ${isLegendary ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${isEpic ? 'drop-shadow-lg' : ''} ${isLegendary ? 'animate-bounce' : ''}`}>
              {signal.emoji || definition?.icon}
              {isEpic && <div className="absolute -top-1 -right-1 text-xs">✨</div>}
            </div>
            <div className="flex-1">
              <CardTitle className={`text-lg ${isLegendary ? 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent' : ''}`}>
                {signal.name}
                {isLegendary && <span className="ml-2">👑</span>}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {signal.subtitle || definition?.description}
              </p>
              {definition?.extendedDescription && !expanded && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                  "{definition.extendedDescription.slice(0, 100)}..."
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={`text-xs ${rarityStyle} ${isLegendary ? 'animate-pulse' : ''}`}>
              {rarity}
              {isEpic && <Star className="w-3 h-3 ml-1" />}
            </Badge>
            <Badge 
              variant={signal.status === 'onchain' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {signal.status === 'onchain' ? (
                <>⚡ On-chain</>
              ) : (
                <>📱 Local</>
              )}
            </Badge>
            {(signal.xp || definition?.stats) && (
              <Badge variant="outline" className="text-xs">
                {signal.xp || definition?.stats?.impact || 10} XP
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Evidence & Context */}
        {signal.evidence && (
          <div className={`p-3 rounded-lg mb-3 ${isLegendary ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start gap-2">
              <Award className={`w-4 h-4 mt-0.5 ${isLegendary ? 'text-orange-600' : 'text-blue-600'}`} />
              <div>
                <span className={`font-medium text-sm ${isLegendary ? 'text-orange-800' : 'text-blue-800'}`}>
                  Achievement Evidence:
                </span>
                <p className={`mt-1 text-sm ${isLegendary ? 'text-orange-700' : 'text-blue-700'}`}>
                  {signal.evidence}
                </p>
                {signal.context && (
                  <p className={`text-xs mt-2 ${isLegendary ? 'text-orange-600' : 'text-blue-600'}`}>
                    Context: {signal.context}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
          
        {/* Basic Info Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(signal.earnedAt || signal.ts).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>Issued by {signal.issuerId.split('-').pop()}</span>
          </div>
        </div>

        {/* Expandable Rich Details */}
        {definition && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full h-8 text-xs mb-2"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 mr-1" />Hide Details</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" />View Full Profile</>
              )}
            </Button>

            {expanded && (
              <div className="space-y-4 border-t pt-4">
                {/* Extended Description */}
                {definition.extendedDescription && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      📖 Character Profile
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-gray-50 p-3 rounded-lg">
                      {definition.extendedDescription}
                    </p>
                  </div>
                )}

                {/* Stats Grid */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    📊 Impact Metrics
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{definition.stats.popularity}</div>
                      <div className="text-xs text-blue-700">Popular</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">{definition.stats.impact}</div>
                      <div className="text-xs text-green-700">Impact</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-lg font-bold text-purple-600">{definition.stats.authenticity}</div>
                      <div className="text-xs text-purple-700">Authentic</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-600">{definition.stats.difficulty}</div>
                      <div className="text-xs text-red-700">Difficult</div>
                    </div>
                  </div>
                </div>

                {/* Character Traits */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    🎭 Character Traits
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Personality:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {definition.traits.personality.map((trait, i) => (
                          <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-pink-50">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {definition.traits.skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs px-2 py-1 bg-green-50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Origin Story */}
                {definition.backstory && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      🌟 Origin Story
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-amber-50 p-3 rounded-lg border-l-4 border-amber-300 italic">
                      {definition.backstory}
                    </p>
                  </div>
                )}

                {/* Pro Tips */}
                {definition.tips && definition.tips.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      💡 Pro Tips
                    </h4>
                    <ul className="space-y-1">
                      {definition.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <span className="text-yellow-500 mt-0.5">💫</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Technical Details (always visible but minimal) */}
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Token:</span>
            <span className="font-mono">
              {signal.tokenId?.slice(0, 8)}...{signal.tokenId?.slice(-4)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}