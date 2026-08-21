'use client';

// ============================================================
// Chat Page — New Conversation
// ============================================================
import React from 'react';
import { ChatContainer } from '@/components/chat/chat-container';

interface ChatPageProps {
  onConversationCreated?: (id: string, title: string) => void;
  onNewMessage?: () => void;
}

export default function ChatPage(props: ChatPageProps) {
  const handleConversationCreated = props.onConversationCreated || (() => {});
  const handleNewMessage = props.onNewMessage || (() => {});

  return (
    <ChatContainer
      conversationId={null}
      initialMessages={[]}
      onConversationCreated={handleConversationCreated}
      onNewMessage={handleNewMessage}
    />
  );
}
