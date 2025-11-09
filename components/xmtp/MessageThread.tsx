'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MessagingContact } from '@/lib/services/contactsForMessaging';
import type { Client as XmtpClient } from '@xmtp/browser-sdk';
import { MessageComposer } from './MessageComposer';

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
  const conversationRef = useRef<any>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and messages
  useEffect(() => {
    let streamCleanup: (() => void) | null = null;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get or create conversation
        const conversations = await (xmtpClient as any).conversations.list();
        let conversation = conversations.find(
          (c: any) => c.peerAddress.toLowerCase() === contact.evmAddress.toLowerCase()
        );

        if (!conversation) {
          conversation = await (xmtpClient as any).conversations.newConversation(
            contact.evmAddress
          );
        }

        conversationRef.current = conversation;

        // Load existing messages
        const existingMessages = await conversation.messages();
        const formattedMessages: Message[] = existingMessages.map((msg: any) => ({
          id: msg.id || `${msg.sent}-${msg.senderAddress}`,
          content: msg.content || msg.text || '',
          senderAddress: msg.senderAddress.toLowerCase(),
          sentAt: new Date(msg.sent),
          isSent: msg.senderAddress.toLowerCase() === currentUserAddress.toLowerCase(),
        }));

        setMessages(formattedMessages);

        // Stream new messages
        const stream = await conversation.streamMessages();
        streamCleanup = () => {
          try {
            if (stream && typeof stream.return === 'function') {
              stream.return();
            }
          } catch (err) {
            console.warn('[MessageThread] Stream cleanup warning:', err);
          }
        };

        (async () => {
          try {
            for await (const message of stream) {
              const newMessage: Message = {
                id: message.id || `${message.sent}-${message.senderAddress}`,
                content: message.content || message.text || '',
                senderAddress: message.senderAddress.toLowerCase(),
                sentAt: new Date(message.sent),
                isSent: message.senderAddress.toLowerCase() === currentUserAddress.toLowerCase(),
              };

              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
            }
          } catch (err) {
            console.warn('[MessageThread] Stream ended:', err);
          }
        })();
      } catch (err) {
        console.error('[MessageThread] Failed to load conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();

    return () => {
      if (streamCleanup) {
        streamCleanup();
      }
    };
  }, [contact.evmAddress, xmtpClient, currentUserAddress]);

  const handleSendMessage = async (content: string) => {
    if (!conversationRef.current) {
      throw new Error('No active conversation');
    }

    await conversationRef.current.send(content);

    // Optimistically add message (stream will update it)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderAddress: currentUserAddress.toLowerCase(),
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
