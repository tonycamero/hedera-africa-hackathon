"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RegistryStatusBadgeProps = {
  registryId: string;
  topicCount: number;
  freshness: {
    cacheAge: number;
    registryAge: number;
    isStale: boolean;
  };
  lastConsensusISO?: string;
};

export function RegistryStatusBadge({
  registryId, 
  topicCount, 
  freshness, 
  lastConsensusISO 
}: RegistryStatusBadgeProps) {
  
  // Freshness indicator
  const getFreshnessColor = () => {
    if (freshness.isStale) return 'amber';
    if (freshness.cacheAge < 5000) return 'green'; // < 5s
    return 'blue';
  };

  const getFreshnessDot = () => {
    const color = getFreshnessColor();
    const dotClass = color === 'green' ? 'bg-green-500' : 
                    color === 'amber' ? 'bg-amber-500' : 
                    'bg-blue-500';
    
    return <div className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`} />;
  };

  const formatAge = (ms: number) => {
    if (ms === Infinity) return 'never';
    if (ms < 1000) return '< 1s';
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    return `${Math.floor(ms / 3600000)}h`;
  };

  const shortRegistryId = registryId.startsWith('0.0.') 
    ? registryId 
    : registryId.substring(0, 12) + '…';

  const variant = freshness.isStale ? 'secondary' : 'default';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="flex items-center gap-1 cursor-help">
            {getFreshnessDot()}
            <span className="text-xs font-mono">
              Registry {shortRegistryId}
            </span>
            <span className="text-xs opacity-70">
              ({topicCount})
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium">HCS Registry Status</div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <div>Registry ID:</div>
              <div className="font-mono">{registryId}</div>
              
              <div>Topics:</div>
              <div>{topicCount} active</div>
              
              <div>Cache age:</div>
              <div>{formatAge(freshness.cacheAge)}</div>
              
              <div>Registry age:</div>
              <div>{formatAge(freshness.registryAge)}</div>
              
              {lastConsensusISO && (
                <>
                  <div>Last consensus:</div>
                  <div>{new Date(lastConsensusISO).toLocaleTimeString()}</div>
                </>
              )}
            </div>
            <div className="pt-1 border-t text-muted-foreground">
              {freshness.isStale ? (
                <span className="text-amber-600">⚠️ Stale data (&gt;15s old)</span>
              ) : freshness.cacheAge < 5000 ? (
                <span className="text-green-600">✅ Fresh data</span>
              ) : (
                <span className="text-blue-600">🔄 Recently updated</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}