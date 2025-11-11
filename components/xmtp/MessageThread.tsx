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

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // XMTP-12: Mark conversation as read when messages load/update
  useEffect(() => {
    if (!dmRef.current || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const lastMs = lastMessage.sentAt.getTime();
    const conversationId = (dmRef.current as any).topic ?? (dmRef.current as any).id ?? '';

    if (conversationId) {
      markConversationRead(conversationId, lastMs);
    }
  }, [messages]);

  // Load DM and messages (XMTP V3 API)
  useEffect(() => {
    let streamCleanup: (() => void) | null = null;

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
          const members = d.members;
          // Check if any member matches the contact's EVM address
          return members.some((m) => 
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
          dm = await xmtpClient.conversations.newDmWithIdentifier(identifier);
        }

        dmRef.current = dm;

        // Sync messages
        await dm.sync();

        // Load existing messages and sort them (XMTP-11)
        const existingMessages = await dm.messages();
        const formattedMessages: Message[] = existingMessages.map((msg: DecodedMessage) => ({
          id: msg.id,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          senderAddress: msg.senderInboxId, // V3 uses inboxId instead of address
          sentAt: msg.sentAt,
          isSent: msg.senderInboxId === xmtpClient.inboxId,
        }));

        setMessages(sortMessages(formattedMessages));

        // Stream new messages
        const stream = dm.streamMessages();
        
        (async () => {
          try {
            for await (const message of stream) {
              const newMessage: Message = {
                id: message.id,
                content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
                senderAddress: message.senderInboxId,
                sentAt: message.sentAt,
                isSent: message.senderInboxId === xmtpClient.inboxId,
              };

              // XMTP-11: Use upsert + sort for deterministic ordering
              setMessages((prev) => {
                const withUpsert = upsertMessage(prev, newMessage);
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
        console.error('[MessageThread] Failed to load DM:', err);
        setError(err instanceof Error ? err.message : 'Failed to load DM');
      } finally {
        setLoading(false);
      }
    };

    loadDm();

    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
    };
  }, [contact.evmAddress, xmtpClient]);

  const handleSendMessage = async (content: string) => {
    if (!dmRef.current) {
      throw new Error('No active DM');
    }

    await dmRef.current.send(content);

    // Optimistically add message (stream will update it)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderAddress: xmtpClient.inboxId,
      sentAt: new Date(),
      isSent: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
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
                  {message.sentAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
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
