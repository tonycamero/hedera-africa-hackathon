/**
 * Global crash guards to prevent process termination from ingestion errors
 * Import this once at server startup to protect against unhandled exceptions
 */

if (!globalThis.__tm_crashguards) {
  globalThis.__tm_crashguards = true;

  process.on('uncaughtExceptionMonitor', (err) => {
    console.error('🚨 [CRASH] uncaughtExceptionMonitor', err?.stack || err);
  });

  process.on('uncaughtException', (err) => {
    console.error('🚨 [CRASH] uncaughtException', err?.stack || err);
    // do NOT process.exit — keep supervisor able to restart streams
  });

  process.on('unhandledRejection', (reason, p) => {
    console.error('🚨 [CRASH] unhandledRejection', { reason, p: String(p) });
  });

  console.log('🛡️ [CRASH GUARDS] Process protection enabled');
}