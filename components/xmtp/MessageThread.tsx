'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MessagingContact } from '@/lib/services/contactsForMessaging';
import type { Client as XmtpClient, Dm, DecodedMessage, Identifier } from '@xmtp/browser-sdk';
import { MessageComposer } from './MessageComposer';
import { markConversationRead } from '@/lib/xmtp/readReceipts';
import { sortMessages, upsertMessage } from '@/lib/xmtp/messageOrdering';

interface Message {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
  isSent: boolean;
}

interface MessageThreadProps {
  contact: MessagingContact;
  xmtpClient: XmtpClient;
  currentUserAddress: string;
  onBack: () => void;
}

export function MessageThread({
  contact,
  xmtpClient,
  currentUserAddress,
  onBack,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmRef = useRef<Dm | null>(null);

  // XMTP-12: Mark conversation as read when messages load/update
  useEffect(() => {
    if (!dmRef.current || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMs = lastMessage.sentAt instanceof Date 
      ? lastMessage.sentAt.getTime() 
      : new Date(lastMessage.sentAt).getTime();
    const conversationId = (dmRef.current as any).topic ?? (dmRef.current as any).id ?? '';

    if (conversationId) {
      markConversationRead(conversationId, lastMs);
    }
  }, [messages]);

  // Load DM and messages (XMTP V3 API)
  useEffect(() => {
    let streamCleanup: (() => void) | null = null;
    let syncInterval: NodeJS.Timeout | null = null;

    const loadDm = async () => {
      try {
        setLoading(true);
        setError(null);

        // Sync conversations from network first
        await xmtpClient.conversations.sync();

        // Get list of existing DMs
        const dms = await xmtpClient.conversations.listDms();
        
        // Find existing DM with this contact (match by member inboxId)
        let dm = dms.find((d) => {
          const members = typeof d.members === 'function' ? d.members() : d.members;
          // Check if any member matches the contact's EVM address
          return Array.isArray(members) && members.some((m) => 
            m.accountAddresses.some((addr: string) => 
              addr.toLowerCase() === contact.evmAddress.toLowerCase()
            )
          );
        });

        // If no DM exists, create one
        if (!dm) {
          const identifier: Identifier = {
            identifier: contact.evmAddress.toLowerCase(),
            identifierKind: 'Ethereum'
          };
          
          try {
            dm = await xmtpClient.conversations.newDmWithIdentifier(identifier);
          } catch (createError: any) {
            // Check if error is due to missing inbox ID
            if (createError?.message?.includes('inbox id') || createError?.message?.includes('not found')) {
              throw new Error(`${contact.displayName} hasn't enabled XMTP yet. They need to sign in and activate encrypted messaging first.`);
            }
            throw createError;
          }
        }

        dmRef.current = dm;

        // Sync messages
        await dm.sync();

        // Load existing messages and sort them (XMTP-11)
        // Filter out system messages (membership changes, etc)
        const existingMessages = await dm.messages();
        console.log(`[MessageThread] 📥 Loaded ${existingMessages.length} existing messages`);
        
        const formattedMessages: Message[] = existingMessages
          .filter((msg: DecodedMessage) => {
            // Only include text content messages (filter out system messages)
            return typeof msg.content === 'string' || 
                   (msg.content && typeof msg.content === 'object' && !msg.content.initiatedByInboxId);
          })
          .map((msg: DecodedMessage) => ({
            id: msg.id,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            senderAddress: msg.senderInboxId, // V3 uses inboxId instead of address
            sentAt: msg.sentAt,
            isSent: msg.senderInboxId === xmtpClient.inboxId,
          }));

        console.log(`[MessageThread] 💬 Displaying ${formattedMessages.length} text messages`);
        setMessages(sortMessages(formattedMessages));

        // Periodic sync to fetch new messages (every 2 seconds)
        syncInterval = setInterval(async () => {
          try {
            console.log('[MessageThread] 🔄 Syncing messages...');
            await dm.sync();
            const latestMessages = await dm.messages();
            console.log(`[MessageThread] 📬 Fetched ${latestMessages.length} total messages from XMTP`);
            
            const filtered = latestMessages
              .filter((msg: DecodedMessage) => {
                const isText = typeof msg.content === 'string' || 
                       (msg.content && typeof msg.content === 'object' && !msg.content.initiatedByInboxId);
                if (!isText) {
                  console.log('[MessageThread] ⏭️  Filtering out system message:', msg.id);
                }
                return isText;
              })
              .map((msg: DecodedMessage) => ({
                id: msg.id,
                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                senderAddress: msg.senderInboxId,
                sentAt: msg.sentAt,
                isSent: msg.senderInboxId === xmtpClient.inboxId,
              }));
            
            console.log(`[MessageThread] 💬 Displaying ${filtered.length} text messages`);
            setMessages(sortMessages(filtered));
          } catch (err) {
            console.warn('[MessageThread] Sync failed:', err);
          }
        }, 2000);

        // Stream new messages (XMTP V3 uses .stream() not .streamMessages())
        const stream = dm.stream();
        
        (async () => {
          try {
            for await (const message of stream) {
              // Filter out system messages (membership changes, group updates)
              const isSystemMessage = message.content && 
                typeof message.content === 'object' && 
                (message.content.initiatedByInboxId || message.content.addedInboxes || message.content.removedInboxes);
              
              if (isSystemMessage) {
                console.log('[MessageThread] Skipping system message:', message.id);
                continue;
              }
              
              const newMessage: Message = {
                id: message.id,
                content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                senderAddress: message.senderInboxId,
                sentAt: message.sentAt,
                isSent: message.senderInboxId === xmtpClient.inboxId,
              };

              // XMTP-11: Use upsert + sort for deterministic ordering
              // LP-3: Remove temp optimistic messages when real message arrives
              setMessages((prev) => {
                // Remove temp messages with matching content and sender (prevent duplicates)
                const withoutTemp = prev.filter(m => 
                  !(m.id.startsWith('temp-') && 
                    m.content === newMessage.content && 
                    m.isSent === newMessage.isSent &&
                    // Only remove if timestamps are close (within 5 seconds)
                    Math.abs(m.sentAt.getTime() - newMessage.sentAt.getTime()) < 5000)
                );
                const withUpsert = upsertMessage(withoutTemp, newMessage);
                return sortMessages(withUpsert);
              });
            }
          } catch (err) {
            console.warn('[MessageThread] Stream ended:', err);
          }
        })();
        
        streamCleanup = () => {
          // V3 streams are async iterators, no explicit cleanup needed
        };
      } catch (err) {
        // Warn instead of error for expected cases (user hasn't onboarded to XMTP)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load DM';
        if (errorMessage.includes("hasn't enabled XMTP yet")) {
          console.warn('[MessageThread] Contact not onboarded to XMTP:', errorMessage);
        } else {
          console.error('[MessageThread] Failed to load DM:', err);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDm();

    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [contact.evmAddress, xmtpClient]);

  const handleSendMessage = async (content: string) => {
    if (!dmRef.current) {
      throw new Error('No active DM');
    }

    console.log('[MessageThread] Sending message:', {
      content,
      dmId: (dmRef.current as any).id,
      recipientAddress: contact.evmAddress,
      senderInboxId: xmtpClient.inboxId
    });

    try {
      await dmRef.current.send(content);
      console.log('[MessageThread] ✅ Message sent successfully to XMTP');
    } catch (error) {
      console.error('[MessageThread] ❌ Failed to send message:', error);
      throw error;
    }

    // LP-3: Optimistically add message using upsert+sort pattern (consistent with streaming)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique temp ID
      content,
      senderAddress: xmtpClient.inboxId,
      sentAt: new Date(),
      isSent: true,
    };

    console.log('[MessageThread] Added optimistic message:', optimisticMessage.id);

    setMessages((prev) => {
      const withUpsert = upsertMessage(prev, optimisticMessage);
      return sortMessages(withUpsert);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[#FF6B35]/20 bg-gradient-to-r from-panel/90 to-panel/80">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto mb-3"></div>
            <p className="text-sm text-white/60">Loading conversation…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[#FF6B35]/20 bg-gradient-to-r from-panel/90 to-panel/80">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium text-white">{contact.displayName}</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm text-red-400 mb-2">Failed to load conversation</p>
            <p className="text-xs text-white/60">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#FF6B35]/20 bg-gradient-to-r from-panel/90 to-panel/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35]/20 to-yellow-500/20 border border-[#FF6B35]/30 flex items-center justify-center">
            <User className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {contact.displayName}
            </div>
            <div className="text-xs text-white/60 truncate">{contact.hederaAccountId}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-white/60">No messages yet</p>
            <p className="text-xs text-white/40 mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.isSent
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-panel/60 border border-white/10 text-white'
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {(() => {
                    try {
                      const date = message.sentAt instanceof Date 
                        ? message.sentAt 
                        : new Date(message.sentAt);
                      
                      // Check if date is valid
                      if (isNaN(date.getTime())) {
                        // Try converting nanoseconds to milliseconds
                        const ns = typeof message.sentAt === 'number' ? message.sentAt : 0;
                        const msDate = new Date(ns / 1000000); // Convert nanoseconds to ms
                        if (!isNaN(msDate.getTime())) {
                          return msDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        }
                        return 'Just now';
                      }
                      
                      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    } catch {
                      return 'Just now';
                    }
                  })()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer onSend={handleSendMessage} />
    </div>
  );
}
