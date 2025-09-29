'use client'

import { useState, useEffect } from 'react'
import { syncState } from '@/lib/sync/syncState'

export default function SyncStatusBar() {
  const [state, setState] = useState(syncState.get())
  const [, forceUpdate] = useState(0)

  // Subscribe to sync state changes
  useEffect(() => {
    return syncState.subscribe(setState)
  }, [])

  // Force update every second for time displays
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const health = syncState.getHealth()
  const timeSinceSync = syncState.getTimeSinceLastSync()

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-amber-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return '🟢'
      case 'degraded': return '🟡'
      case 'down': return '🔴'
      default: return '⚫'
    }
  }

  const handleErrorsClick = () => {
    if (state.errors.length > 0) {
      alert(state.errors.join('\n\n'))
    }
  }

  const handleResetErrors = () => {
    syncState.resetErrors()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={health.status}>
              {getStatusIcon()}
            </span>
            <span className={`font-medium ${getStatusColor()}`}>
              {state.live ? 'Live' : '⏸ Standby / Data cached'}
            </span>
          </div>

          <div className="w-px h-4 bg-gray-300" />

          {/* Last sync time */}
          <div className="text-gray-600">
            {timeSinceSync ? `Synced ${timeSinceSync}` : 'Not synced'}
          </div>

          {/* Connection count */}
          {state.connectionCount > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300" />
              <div className="text-gray-500">
                {state.connectionCount} connection{state.connectionCount !== 1 ? 's' : ''}
              </div>
            </>
          )}

          {/* Errors */}
          {state.errors.length > 0 && (
            <>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleErrorsClick}
                  className="text-red-600 underline hover:text-red-700 transition-colors"
                  title="Click to view errors"
                >
                  {state.errors.length} error{state.errors.length !== 1 ? 's' : ''}
                </button>
                <button
                  onClick={handleResetErrors}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear errors"
                >
                  ×
                </button>
              </div>
            </>
          )}

          {/* Health issues summary */}
          {health.issues.length > 0 && (
            <div 
              className="text-xs text-gray-500 cursor-help"
              title={health.issues.join(', ')}
            >
              ({health.issues.length} issue{health.issues.length !== 1 ? 's' : ''})
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for mobile or smaller spaces
export function CompactSyncStatusBar() {
  const [state, setState] = useState(syncState.get())

  useEffect(() => {
    return syncState.subscribe(setState)
  }, [])

  const health = syncState.getHealth()

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-sm">{health.status === 'healthy' ? '🟢' : health.status === 'degraded' ? '🟡' : '🔴'}</span>
      <span className={health.healthy ? 'text-green-600' : 'text-amber-600'}>
        {state.live ? 'Live' : '⏸ Standby / Data cached'}
      </span>
      {state.errors.length > 0 && (
        <span className="text-red-600">
          {state.errors.length} err
        </span>
      )}
    </div>
  )
}