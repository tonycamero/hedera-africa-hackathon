'use client'

import { ReactNode } from 'react'
import { Loader2, AlertCircle, Inbox } from 'lucide-react'

interface StateShellProps {
  ready: boolean
  hasData: boolean
  error?: string | null
  loading?: boolean
  children: ReactNode
  empty?: ReactNode
  loadingComponent?: ReactNode
  errorComponent?: ReactNode
  className?: string
}

/**
 * StateShell provides consistent loading, empty, and error states across the app
 * Eliminates the need for scattered state handling in individual components
 */
export default function StateShell({
  ready,
  hasData,
  error,
  loading = false,
  children,
  empty,
  loadingComponent,
  errorComponent,
  className = ''
}: StateShellProps) {
  // Error state
  if (error) {
    return errorComponent || (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h3>
        <p className="text-red-600 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Refresh page
        </button>
      </div>
    )
  }

  // Loading state
  if (!ready || loading) {
    return loadingComponent || (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Empty state
  if (!hasData) {
    return empty || (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <Inbox className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No data yet</h3>
        <p className="text-gray-500">Data will appear here once ingestion starts</p>
      </div>
    )
  }

  // Success state - render children
  return <div className={className}>{children}</div>
}

// Specialized variants for common use cases

export function FeedStateShell({
  signals,
  error,
  children,
  className = ''
}: {
  signals: any[]
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <StateShell
      ready={true}
      hasData={signals.length > 0}
      error={error}
      className={className}
      empty={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No activity yet</h3>
          <p className="text-gray-600 max-w-sm">
            Signals and activity will appear here as people interact on the network
          </p>
        </div>
      }
    >
      {children}
    </StateShell>
  )
}

export function ContactStateShell({
  contacts,
  error,
  children,
  className = ''
}: {
  contacts: any[]
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <StateShell
      ready={true}
      hasData={contacts.length > 0}
      error={error}
      className={className}
      empty={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No contacts yet</h3>
          <p className="text-gray-600 max-w-sm">
            Build your network by connecting with others and accepting contact requests
          </p>
        </div>
      }
    >
      {children}
    </StateShell>
  )
}

export function RecognitionStateShell({
  recognitions,
  error,
  children,
  className = ''
}: {
  recognitions: any[]
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <StateShell
      ready={true}
      hasData={recognitions.length > 0}
      error={error}
      className={className}
      empty={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No recognitions yet</h3>
          <p className="text-gray-600 max-w-sm">
            Recognition badges will appear here as they are created and earned on the network
          </p>
        </div>
      }
    >
      {children}
    </StateShell>
  )
}