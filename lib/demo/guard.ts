// lib/demo/guard.ts
// Demo features have been removed from production

export function assertDemoAllowed(ctx: string): boolean {
  console.warn(`[DEPRECATED] Demo guard called for: ${ctx}. Demo features have been removed.`);
  return false;
}
