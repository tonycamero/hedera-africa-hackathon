/**
 * GenZ Contact Types - Domain types for the GenZ lens contact experience
 */

// Domain types
export type Handle = `@${string}`;

export interface Contact {
  id: string;
  handle: Handle;
  displayName: string;
  avatarUrl?: string;
  lastSignalSummary?: string; // e.g. "Clutched the demo…"
  isOnline?: boolean;
  propsReceived?: number;
}

export interface GenzCounters {
  friends: number;
  sent: number;      // signals sent
  boosts: number;    // boosts received on your signals
}

// Signal template (lite version)
export interface SignalTemplateLite {
  id: string;
  text: string;     // "Clutched ___ under fire"
  maxFill: number;
  examples: string[];
}

export interface SharePayload {
  title: string;
  text: string;
  url: string;              // canonical boost URL
  clipboardFallbackText: string;
}

// Component prop interfaces
export interface GenZContactsHeaderProps {
  counters: GenzCounters;
  onAddFriendClick: () => void;
  onShareProfileClick: () => void;
  campusCode?: string;
  tagline?: string; // "Add friends. Send signals. Level up."
}

export interface GenZContactsListProps {
  contacts: Contact[];
  isLoading?: boolean;
  onSignalClick: (contact: Contact) => void;
  onContactOpen?: (contact: Contact) => void;
  emptyState?: {
    title?: string;
    ctaLabel?: string;
    onCtaClick?: () => void;
  };
}

export interface AddFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Search tab
  onSearch: (query: string) => Promise<Contact[]>;
  onAddContact: (contact: Contact) => Promise<{ success: boolean; error?: string }>;
  
  // QR tab
  myQrUrl: string;
  onScanQr: (qrText: string) => Promise<{ contact?: Contact; error?: string }>;
  
  // Link tab
  myProfileUrl: string;
  onShareProfile: () => Promise<void>;
  
  // After-add nudge
  enableAfterAddNudge?: boolean;
  onAfterAddSendSignal?: (contact: Contact) => void;
  
  // Optional copy
  labels?: {
    title?: string;
    searchPlaceholder?: string;
  };
}

export interface AfterAddNudgeProps {
  contact: Contact;
  onSendSignalNow: (contact: Contact) => void;
  onDismiss: () => void;
}

// Telemetry events
export type TelemetryEvent = 
  | 'ui.header.add_friend.clicked'
  | 'ui.header.share_profile.clicked'
  | 'ui.contacts.row.signal.clicked'
  | 'ui.contacts.row.opened'
  | 'contacts.add.search.started'
  | 'contacts.add.clicked'
  | 'contacts.add.qr.scanned'
  | 'contacts.add.share_profile.clicked'
  | 'ui.after_add_nudge.viewed'
  | 'ui.after_add_nudge.send.clicked'
  | 'ui.after_add_nudge.dismissed'
  | 'signal.send.opened'
  | 'signal.send.template.selected'
  | 'signal.send.submitted'
  | 'boost.share.clicked'
  | 'boost.anon.clicked';

export interface TelemetryData {
  contactId?: string;
  templateId?: string;
  boostId?: string;
  success?: boolean;
  q?: string; // search query
}