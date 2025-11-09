'use client';

import { useIdentity } from '@/app/providers/IdentityProvider';
import { MessageCircle } from 'lucide-react';
import { ConversationList } from '@/components/xmtp/ConversationList';

export default function MessagesPage() {
  const {
    identity,
    identityLoading,
    identityError,
    xmtpClient,
    xmtpLoading,
    xmtpError,
  } = useIdentity();

  // Loading state
  if (identityLoading || xmtpLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#FF6B35]" />
              Messages
            </h1>
          </div>
          
          <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
              <p className="text-sm text-white/70">Loading your messaging setup…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!identity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#FF6B35]" />
              Messages
            </h1>
          </div>
          
          <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[#FF6B35]/60" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Sign in required</h2>
              <p className="text-sm text-white/60">
                You need to sign in to start messaging. Go to Onboarding / Login.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // XMTP disabled or failed
  if (!xmtpClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#FF6B35]" />
              Messages
            </h1>
          </div>
          
          <div className="sheen-sweep overflow-hidden bg-gradient-to-br from-panel/90 to-panel/80 border-2 border-[#FF6B35]/20 rounded-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-yellow-500/60" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Messaging unavailable</h2>
              <p className="text-sm text-white/60 mb-4">
                Messaging is currently unavailable. It may be disabled or still being configured.
              </p>
              {xmtpError && (
                <p className="text-xs text-red-400/70 mt-2 font-mono">
                  {xmtpError.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ready state – show conversation list
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a1f] via-[#2a1030] to-[#1a0a1f]">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#FF6B35]" />
            Messages
          </h1>
          <p className="text-sm text-white/70 mt-1">Direct messaging via XMTP</p>
        </div>

        <ConversationList />
      </div>
    </div>
  );
}
