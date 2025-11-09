/**
 * HCS-22 Health Metrics
 * Tracks identity resolution events for monitoring
 */

interface HealthMetrics {
  enabled: boolean;
  topic: string | null;
  eventsPublished: number;
  eventsFailed: number;
  lastEventAt: string | null;
}

// In-memory metrics (will be replaced with Redis/DB in production)
const metrics: HealthMetrics = {
  enabled: process.env.HCS22_ENABLED === 'true',
  topic: process.env.HCS22_IDENTITY_TOPIC_ID || null,
  eventsPublished: 0,
  eventsFailed: 0,
  lastEventAt: null
};

export function getHealthMetrics(): HealthMetrics {
  return { ...metrics };
}

export function incrementPublished(): void {
  metrics.eventsPublished++;
  metrics.lastEventAt = new Date().toISOString();
}

export function incrementFailed(): void {
  metrics.eventsFailed++;
}

export function resetMetrics(): void {
  metrics.eventsPublished = 0;
  metrics.eventsFailed = 0;
  metrics.lastEventAt = null;
}
