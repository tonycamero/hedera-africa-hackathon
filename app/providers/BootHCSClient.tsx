'use client';

import { useEffect, useState } from 'react';
import { signalsStore } from '@/lib/stores/signalsStore';

/**
 * Global HCS ingestion initialization component.
 * Uses server-driven robust boot system instead of client-side environment checks.
 */
export default function BootHCSClient() {
  const [status, setStatus] = useState<'idle' | 'starting' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🚀 [BootHCSClient] Starting HCS ingestion with server-driven robust boot...');
        setStatus('starting')
        setError(null)
        
        // Trigger server-side boot via API (idempotent, with retries)
        const response = await fetch('/api/admin/start-ingestion', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log('✅ [BootHCSClient] Server-driven ingestion started successfully:', result.state)
          setStatus('ok')
        } else {
          console.error('❌ [BootHCSClient] Server-driven boot failed:', result.error)
          setStatus('error')
          setError(result.error || 'Unknown server boot failure')
        }
        
        // Set up debug helpers regardless of boot success/failure
        if (typeof window !== 'undefined') {
          (window as any).signalsStore = signalsStore;
          (window as any).debugStore = {
            // Legacy methods for backward compatibility
            getBonded: (id: string) => signalsStore.getBondedContacts?.(id) || 'getBondedContacts method not available',
            getTrust: (id: string) => signalsStore.getTrustStats?.(id) || 'getTrustStats method not available', 
            getSignals: () => signalsStore.getAll(),
            getRecognition: (id: string) => signalsStore.getRecognitionsFor(id),
            
            // New Step 3 methods
            getScoped: (sessionId: string, scope: 'my' | 'global', type?: string) => 
              signalsStore.getScoped(sessionId, scope, type),
            getSummary: () => signalsStore.getSummary(),
            getByType: (type: string) => signalsStore.getByType(type),
            getByActor: (actor: string) => signalsStore.getByActor(actor),
            getSince: (timestamp: number) => signalsStore.getSince(timestamp),
            
            // Debug and stats
            storeSummary: () => signalsStore.getSummary(),
            
            // Boot control (development)
            bootStatus: status,
            bootError: error,
            retryBoot: initializeServices
          };
          
          console.log('🔧 [BootHCSClient] Debug helpers added to window.signalsStore and window.debugStore');
          console.log('🔧 [BootHCSClient] Boot status:', status);
          if (error) {
            console.log('🔧 [BootHCSClient] Boot error:', error);
            console.log('🔧 [BootHCSClient] Retry with: window.debugStore.retryBoot()');
          }
        }
        
      } catch (networkError: any) {
        console.error('❌ [BootHCSClient] Network/fetch error during server-driven boot:', networkError);
        setStatus('error')
        setError(`Network error: ${networkError.message}`)
        
        // Still set up debug helpers for troubleshooting
        if (typeof window !== 'undefined') {
          (window as any).signalsStore = signalsStore;
          (window as any).debugStore = {
            getSignals: () => signalsStore.getAll(),
            getSummary: () => signalsStore.getSummary(),
            bootStatus: 'error',
            bootError: networkError.message,
            retryBoot: initializeServices
          };
        }
      }
    };

    // Start initialization on mount
    initializeServices();
  }, []);

  // This component renders nothing (invisible)
  return null;
}
