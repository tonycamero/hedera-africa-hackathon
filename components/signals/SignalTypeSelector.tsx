'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SignalType } from '@/lib/types/signals-collectible'
import { getCategoryIcon, getRarityTheme, formatRarityDisplay } from '@/lib/ui/signal-rarities'
import { Sparkles, Info } from 'lucide-react'
import { GenZCard, GenZText, GenZHeading } from '@/components/ui/genz-design-system'

interface SignalTypeSelectorProps {
  onSelect: (signalType: SignalType) => void
  selectedType?: SignalType | null
}

export function SignalTypeSelector({ onSelect, selectedType }: SignalTypeSelectorProps) {
  const [signalTypes, setSignalTypes] = useState<SignalType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    loadSignalTypes()
  }, [])

  const loadSignalTypes = async () => {
    try {
      const response = await fetch('/api/signal-types')
      if (response.ok) {
        const data = await response.json()
        setSignalTypes(data.items || [])
      }
    } catch (error) {
      console.error('Failed to load signal types:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(signalTypes.map(type => type.category))]

  const filteredTypes = selectedCategory 
    ? signalTypes.filter(type => type.category === selectedCategory)
    : signalTypes

  if (loading) {
    return (
      <GenZCard variant="glass" className="p-6">
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-pri-500 animate-spin" />
          <GenZText dim>Loading signal types...</GenZText>
        </div>
      </GenZCard>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategory === '' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('')}
          className="text-xs"
        >
          All Categories
        </Button>
        {categories.map(category => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            className="text-xs flex items-center gap-1"
          >
            <span>{getCategoryIcon(category)}</span>
            {category}
          </Button>
        ))}
      </div>

      {/* Signal Types Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTypes.map((type) => {
          const theme = getRarityTheme(type.rarity)
          const isSelected = selectedType?.type_id === type.type_id
          
          return (
            <Card 
              key={type.type_id}
              className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
                isSelected 
                  ? `${theme.border} ${theme.glow} shadow-lg scale-[1.02]` 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(type)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  isSelected 
                    ? `bg-gradient-to-br ${theme.gradient}` 
                    : 'bg-gray-100'
                }`}>
                  {getCategoryIcon(type.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{type.category}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${theme.text} ${theme.gradient.replace('from-', 'bg-').replace('to-', '').split(' ')[0]}/10`}
                      >
                        {formatRarityDisplay(type.rarity)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      v{type.version}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                    {type.description}
                  </p>
                  
                  {/* Labels */}
                  <div className="flex flex-wrap gap-1">
                    {type.example_labels.slice(0, 3).map((label, idx) => (
                      <Badge 
                        key={idx}
                        variant="outline" 
                        className="text-xs bg-gray-50 text-gray-600"
                      >
                        {label}
                      </Badge>
                    ))}
                    {type.example_labels.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                        +{type.example_labels.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Info className="h-3 w-3" />
                    <span>Selected for minting</span>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
      
      {filteredTypes.length === 0 && (
        <GenZCard variant="glass" className="p-6 text-center">
          <GenZText className="mb-4">No types yet.</GenZText>
          <Button className="bg-pri-500 hover:bg-pri-600 text-white">
            New Signal Type
          </Button>
        </GenZCard>
      )}
    </div>
  )
}