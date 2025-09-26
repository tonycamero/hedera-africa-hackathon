'use client';

import { useEffect } from 'react';
import { initializeFeed } from '@/lib/services/MirrorBackfill';
import { HCS_ENABLED, DEMO_SEED } from '@/lib/env';

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
        
        // Only initialize if HCS is enabled
        if (!HCS_ENABLED) {
          console.log('📍 [BootHCSClient] HCS disabled, skipping initialization');
          return;
        }

        // Use the robust backfill + WS subscribe service
        console.log('📡 [BootHCSClient] Initializing Mirror Node backfill + WebSocket...');
        const dispose = await initializeFeed();
        cleanup = dispose;
        
        console.log('🎉 [BootHCSClient] Mirror Node initialization complete');
        
      } catch (error) {
        console.error('❌ [BootHCSClient] Mirror Node initialization failed:', error);
        // Don't throw - let the app continue with empty state
      }
    };

    // Initialize services on mount
    initializeServices();

    // Cleanup function
    return () => {
      cleanup();
    };
  }, []);

  // This component renders nothing
  return null;
}
