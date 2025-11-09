/**
 * GenZ Telemetry Service
 * 
 * Tracks GenZ-specific user interactions for funnel optimization
 */

import { TelemetryEvent, TelemetryData } from '@/lib/types/genz-contacts';

export class GenZTelemetryService {
  private static events: Array<{
    event: TelemetryEvent;
    data: TelemetryData;
    timestamp: number;
    sessionId?: string;
  }> = [];

  /**
   * Track a GenZ telemetry event
   */
  static track(event: TelemetryEvent, data: TelemetryData = {}) {
    const eventData = {
      event,
      data,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    // Add to in-memory store
    this.events.push(eventData);
    
    // Keep only recent events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Log to console for development
    console.log(`[GenZTelemetry] ${event}:`, data);

    // Send to analytics if configured
    this.sendToAnalytics(eventData);
  }

  /**
   * Get session ID (simple implementation)
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('genz_session_id');
    if (!sessionId) {
      sessionId = `genz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('genz_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send to external analytics
   */
  private static sendToAnalytics(eventData: any) {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventData.event, {
        event_category: 'genz_contacts',
        ...eventData.data,
        session_id: eventData.sessionId
      });
    }

    // PostHog
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(eventData.event, {
        ...eventData.data,
        session_id: eventData.sessionId
      });
    }

    // Custom endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(console.warn);
    }
  }

  /**
   * Get funnel analytics
   */
  static getFunnelStats(): {
    addToSend: number;      // add friend → send signal conversion
    sendToShare: number;    // send signal → share boost conversion  
    shareToBoost: number;   // share → anonymous boost conversion
    totalEvents: number;
  } {
    const adds = this.events.filter(e => e.event === 'contacts.add.clicked' && e.data.success).length;
    const sends = this.events.filter(e => e.event === 'signal.send.submitted' && e.data.success).length;
    const shares = this.events.filter(e => e.event === 'boost.share.clicked').length;
    const boosts = this.events.filter(e => e.event === 'boost.anon.clicked').length;

    return {
      addToSend: adds > 0 ? Math.round((sends / adds) * 100) : 0,
      sendToShare: sends > 0 ? Math.round((shares / sends) * 100) : 0,
      shareToBoost: shares > 0 ? Math.round((boosts / shares) * 100) : 0,
      totalEvents: this.events.length
    };
  }

  /**
   * Get recent events for debugging
   */
  static getRecentEvents(limit = 50) {
    return this.events.slice(-limit);
  }

  /**
   * Clear all events (for testing)
   */
  static clear() {
    this.events = [];
  }
}

// Convenience tracking functions
export const trackGenZ = GenZTelemetryService.track.bind(GenZTelemetryService);

export const trackAddFriendClicked = () => trackGenZ('ui.header.add_friend.clicked');
export const trackShareProfileClicked = () => trackGenZ('ui.header.share_profile.clicked');
export const trackSignalClicked = (contactId: string) => trackGenZ('ui.contacts.row.signal.clicked', { contactId });
export const trackContactOpened = (contactId: string) => trackGenZ('ui.contacts.row.opened', { contactId });
export const trackSearchStarted = (query: string) => trackGenZ('contacts.add.search.started', { q: query });
export const trackContactAdded = (contactId: string, success: boolean) => trackGenZ('contacts.add.clicked', { contactId, success });
export const trackSignalSent = (contactId: string, templateId: string, success: boolean) => 
  trackGenZ('signal.send.submitted', { contactId, templateId, success });
export const trackBoostShared = (boostId: string) => trackGenZ('boost.share.clicked', { boostId });
export const trackBoostClicked = (boostId: string) => trackGenZ('boost.anon.clicked', { boostId });