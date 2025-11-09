'use client';

import { useState, useEffect } from 'react';
import { User, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MessagingContact } from '@/lib/services/contactsForMessaging';
import { getContactsForMessaging } from '@/lib/services/contactsForMessaging';
import { useIdentity } from '@/app/providers/IdentityProvider';

export function ConversationList() {
  const { identity, xmtpClient } = useIdentity();
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      if (!identity) {
        setContacts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await getContactsForMessaging(identity, xmtpClient);
        setContacts(result);
      } catch (err) {
        console.error('[ConversationList] Failed to load contacts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [identity, xmtpClient]);

  const handleMessage = (contact: MessagingContact) => {
    // T9 will implement: navigate to thread view
    console.log('[ConversationList] Message contact:', contact.hederaAccountId);
  };

  const handleInvite = (contact: MessagingContact) => {
    // T9 will implement: show invite modal or copy invite link
    console.log('[ConversationList] Invite contact:', contact.hederaAccountId);
  };

  // Loading state
  if (loading) {
    return (
      <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto mb-3"></div>
          <p className="text-sm text-white/60">Loading contacts…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-red-400/20 rounded-lg p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-red-400/60" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Failed to load contacts</h3>
          <p className="text-xs text-red-400/70">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-[#FF6B35]/60" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No contacts yet</h3>
          <p className="text-sm text-white/60 mb-4">
            Add friends in the Contacts tab to start messaging.
          </p>
        </div>
      </div>
    );
  }

  // Contact list
  return (
    <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg">
      <div className="p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#FF6B35]" />
            <span>Trusted Contacts</span>
          </div>
          <span className="text-xs text-white/60">{contacts.length} contacts</span>
        </h3>

        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.hederaAccountId}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-panel/40 to-panel/30 border border-[#FF6B35]/20 rounded-lg hover:bg-gradient-to-r hover:from-panel/50 hover:to-panel/40 hover:border-[#FF6B35]/30 hover:shadow-[0_0_15px_rgba(255,107,53,0.15)] transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {contact.displayName}
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {contact.hederaAccountId}
                  </div>
                  {contact.hasXMTP && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                      <span className="text-xs text-green-400">XMTP enabled</span>
                    </div>
                  )}
                </div>
              </div>

              {contact.hasXMTP ? (
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white font-medium shadow-[0_0_12px_rgba(255,107,53,0.3)] hover:shadow-[0_0_20px_rgba(255,107,53,0.4)] flex-shrink-0"
                  onClick={() => handleMessage(contact)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Message
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-4 text-xs text-white/70 hover:text-white border-white/20 hover:border-white/40 hover:bg-white/10 flex-shrink-0"
                  onClick={() => handleInvite(contact)}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Invite
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
