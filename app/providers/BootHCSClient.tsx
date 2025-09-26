'use client';

import { useEffect } from 'react';
import { hcsFeedService } from '@/lib/services/HCSFeedService';
import { HCS_ENABLED, DEMO_SEED } from '@/lib/env';

/**
 * Global HCS service initialization component.
 * Ensures HCS services are initialized on app boot, not per-page.
 */
export default function BootHCSClient() {
  useEffect(() => {
    const initializeHCSServices = async () => {
      try {
        console.log('🚀 [BootHCSClient] Starting global HCS initialization...');
        
        // Only initialize if HCS is enabled
        if (!HCS_ENABLED) {
          console.log('📍 [BootHCSClient] HCS disabled, skipping initialization');
          return;
        }

        // Initialize the HCS feed service
        if (!hcsFeedService.isReady()) {
          console.log('🔧 [BootHCSClient] Initializing HCS feed service...');
          await hcsFeedService.initialize();
          console.log('✅ [BootHCSClient] HCS feed service initialized');
        } else {
          console.log('✅ [BootHCSClient] HCS feed service already ready');
        }

        // Auto-enable seed mode if configured
        if (DEMO_SEED === 'on') {
          console.log('🌱 [BootHCSClient] Auto-enabling seed mode...');
          await hcsFeedService.enableSeedMode();
          console.log('✅ [BootHCSClient] Seed mode enabled');
        }

        console.log('🎉 [BootHCSClient] Global HCS initialization complete');
        
      } catch (error) {
        console.error('❌ [BootHCSClient] Global HCS initialization failed:', error);
        // Don't throw - let the app continue with empty state
      }
    };

    // Initialize services on mount
    initializeHCSServices();

    // Cleanup function
    return () => {
      // Optional: dispose services if they have cleanup methods
      if (hcsFeedService.dispose) {
        hcsFeedService.dispose();
      }
    };
  }, []);

  // This component renders nothing
  return null;
}