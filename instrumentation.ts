// instrumentation.ts
// Next.js Server Startup Hook
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server-side services...');
    
    // Initialize HCS-22 identity registry (silent warmup)
    try {
      const { initHcs22 } = await import('./lib/server/hcs22/init');
      await initHcs22();
      console.log('[Instrumentation] HCS-22 identity registry ready');
    } catch (error) {
      console.error('[Instrumentation] Failed to initialize HCS-22:', error);
      // Non-blocking - app can continue without HCS-22
    }
    
    console.log('[Instrumentation] Server initialization complete');
  }
}
