'use client'

import { useDemoMode } from '@/lib/hooks/useDemoMode'
import { DemoMode } from '@/lib/config/demo-mode'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Settings, Database, Zap, Layers } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DemoModeToggle() {
  const { mode, setMode, config, getDataSourceLabel, getDataSourceBadgeColor } = useDemoMode()

  const modes: { value: DemoMode; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'mock',
      label: 'Mock Data Only',
      icon: <Database className="h-4 w-4" />,
      description: 'Show all mock data for demonstration'
    },
    {
      value: 'hcs',
      label: 'HCS Live Only',
      icon: <Zap className="h-4 w-4" />,
      description: 'Show only real Hedera Consensus Service data'
    },
    {
      value: 'hybrid',
      label: 'Hybrid Mode',
      icon: <Layers className="h-4 w-4" />,
      description: 'Mix of mock data (signals/wallet) + real HCS (inner circle)'
    }
  ]

  const currentMode = modes.find(m => m.value === mode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-2 hover:bg-white/95"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">Demo Mode</span>
          <Badge 
            variant="secondary" 
            className={`${
              mode === 'mock' ? 'bg-orange-100 text-orange-800' :
              mode === 'hcs' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {mode.toUpperCase()}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-4" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Judge Demo Controls
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-600">
            Switch between data sources to demonstrate what's on-chain vs mock data
          </p>
        </div>
        
        {modes.map((modeOption) => (
          <DropdownMenuItem
            key={modeOption.value}
            className={`flex items-center gap-3 p-3 cursor-pointer ${
              mode === modeOption.value ? 'bg-blue-50 border border-blue-200 rounded' : ''
            }`}
            onClick={() => setMode(modeOption.value)}
          >
            <div className={`p-2 rounded-full ${
              mode === modeOption.value ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {modeOption.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{modeOption.label}</span>
                {mode === modeOption.value && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Current</Badge>
                )}
              </div>
              <p className="text-xs text-gray-600">{modeOption.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <Card className="p-3 bg-gray-50">
          <h4 className="font-medium text-sm mb-2">Current Data Sources:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Signals:</span>
              <Badge className={`text-xs ${getDataSourceBadgeColor('signals')}`}>
                {getDataSourceLabel('signals')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Wallet:</span>
              <Badge className={`text-xs ${getDataSourceBadgeColor('wallet')}`}>
                {getDataSourceLabel('wallet')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Inner Circle:</span>
              <Badge className={`text-xs ${getDataSourceBadgeColor('inner-circle')}`}>
                {getDataSourceLabel('inner-circle')}
              </Badge>
            </div>
          </div>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}