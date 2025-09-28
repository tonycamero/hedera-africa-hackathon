// lib/demo/guard.ts
import { ALLOW_DEMO } from '@/lib/env';

export function assertDemoAllowed(ctx: string): boolean {
  if (!ALLOW_DEMO) {
    // Fail closed, loud log, no throw to avoid crashing UI
    console.error(`[DEMO_DISABLED] Blocked demo feature: ${ctx}`);
    return false;
  }
  return true;
}