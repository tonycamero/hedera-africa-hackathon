'use client';

import { useEffect } from 'react';
import { initializeMirrorWithStore } from '@/lib/services/MirrorToStore';
import { signalsStore } from '@/lib/stores/signalsStore';
import { HCS_ENABLED, DEMO_SEED, MIRROR_REST, MIRROR_WS, TOPICS } from '@/lib/env';

/**
 * Global HCS service initialization component.
 * Ensures HCS services are initialized on app boot, not per-page.
 */
export default function BootHCSClient() {
  useEffect(() => {
    let cleanup = () => {};
    
    const initializeServices = async () => {
      try {
        console.log('🚀 [BootHCSClient] Starting robust Mirror Node initialization...');
        console.log('🚀 [BootHCSClient] Environment check:', {
          HCS_ENABLED,
          DEMO_SEED,
          NODE_ENV: process.env.NODE_ENV,
          MIRROR_REST,
          MIRROR_WS,
          TOPICS,
          raw_hcs_enabled: process.env.NEXT_PUBLIC_HCS_ENABLED,
          raw_mirror_rest: process.env.NEXT_PUBLIC_MIRROR_NODE_URL
        });
        
        // Only initialize if HCS is enabled
        if (!HCS_ENABLED) {
          console.warn('🚫 [BootHCSClient] HCS_ENABLED=false, skipping Mirror Node initialization');
          console.warn('🚫 [BootHCSClient] Raw env value:', process.env.NEXT_PUBLIC_HCS_ENABLED);
          console.warn('🚫 [BootHCSClient] To enable: Set NEXT_PUBLIC_HCS_ENABLED=true in environment');
          return;
        }

        // Use the robust backfill + WS subscribe service with store integration
        console.log('📡 [BootHCSClient] Initializing Mirror Node backfill + WebSocket + Store...');
        const dispose = await initializeMirrorWithStore();
        cleanup = dispose;
        
        // Initialize recognition service
        console.log('🔍 [BootHCSClient] Initializing HCS Recognition Service...');
        const { hcsRecognitionService } = await import('@/lib/services/HCSRecognitionService');
        await hcsRecognitionService.initialize();
        
        console.log('🎉 [BootHCSClient] All services initialized complete');
        
        // Add to global scope for debugging
        if (typeof window !== 'undefined') {
          // Import and expose recognition service for debugging
          const { hcsRecognitionService } = await import('@/lib/services/HCSRecognitionService');
          
          (window as any).signalsStore = signalsStore;
          (window as any).debugStore = {
            getBonded: (id: string) => signalsStore.getBondedContacts(id),
            getTrust: (id: string) => signalsStore.getTrustStats(id),
            getSignals: () => signalsStore.getAllSignals?.() || 'getAllSignals method not available',
            getRecognition: (id: string) => signalsStore.getRecognitionSignals?.(id) || 'getRecognitionSignals method not available',
            recognitionDebug: () => hcsRecognitionService.getDebugInfo(),
            recognitionService: hcsRecognitionService
          };
          console.log('🔧 [BootHCSClient] Debug helpers added to window.signalsStore and window.debugStore');
          console.log('🔧 [BootHCSClient] Use window.debugStore.recognitionDebug() to inspect recognition service state');
        }
        
      } catch (error) {
        console.error('❌ [BootHCSClient] Mirror Node initialization failed:', error);
        console.error('❌ [BootHCSClient] Error details:', {
          message: error.message,
          stack: error.stack,
          HCS_ENABLED,
          DEMO_SEED
        });
        // Don't throw - let the app continue with empty state
      }
    };

    // Initialize services on mount
    initializeServices();

    // Always set up debug helpers, even if initialization fails
    if (typeof window !== 'undefined') {
      (window as any).signalsStore = signalsStore;
      (window as any).debugStore = {
        getBonded: (id: string) => signalsStore.getBondedContacts(id),
        getTrust: (id: string) => signalsStore.getTrustStats(id),
        getSignals: () => signalsStore.getAllSignals(),
        getRecognition: (id: string) => signalsStore.getRecognitionSignals?.(id) || 'getRecognitionSignals method not available'
      };
      console.log('🔧 [BootHCSClient] Debug helpers setup (fallback)');
    }

    // Cleanup function
    return () => {
      cleanup();
    };
  }, []);

  // This component renders nothing
  return null;
}
