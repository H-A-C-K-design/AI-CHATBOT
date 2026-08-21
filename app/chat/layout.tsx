'use client';

// ============================================================
// Chat Layout — Sidebar + Main Area
// ============================================================
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/components/auth/auth-provider';
import type { Conversation } from '@/types';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Get active conversation ID from URL
  const activeConversationId = pathname?.startsWith('/chat/')
    ? pathname.split('/chat/')[1] || null
    : null;

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch {
      // Silent fail — conversations will show empty
    } finally {
      setConversationsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Handlers
  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`/api/conversations/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            router.push('/chat');
          }
        }
      } catch {
        // Silent fail
      }
    },
    [getToken, activeConversationId, router]
  );

  const handleRenameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });

        const data = await response.json();
        if (data.success) {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
          );
        }
      } catch {
        // Silent fail
      }
    },
    [getToken]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        fetchConversations();
        return;
      }

      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(
          `/api/conversations?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await response.json();
        if (data.success) {
          setConversations(data.conversations);
        }
      } catch {
        // Silent fail
      }
    },
    [getToken, fetchConversations]
  );

  // Called when a new conversation is created via chat
  const handleConversationCreated = useCallback(
    (id: string, title: string) => {
      const newConv: Conversation = {
        id,
        userId: user?.uid || '',
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [newConv, ...prev]);
      // Update URL to include conversation ID
      router.replace(`/chat/${id}`);
    },
    [user, router]
  );

  // Refresh conversations after message sent
  const handleNewMessage = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Show loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onSearch={handleSearch}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <button
            onClick={() => setSidebarOpen(true)}
            className="sidebar-toggle-btn"
            type="button"
            aria-label="Open sidebar"
            id="btn-sidebar-toggle"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <h1 className="chat-header-title">
            {activeConversationId
              ? conversations.find((c) => c.id === activeConversationId)?.title || 'Chat'
              : 'NEXORA AI'}
          </h1>

          <div className="chat-header-actions">
            <button
              onClick={handleNewChat}
              className="mobile-new-chat-btn"
              type="button"
              aria-label="New chat"
              title="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Pass handlers to children via React.cloneElement */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              onConversationCreated: handleConversationCreated,
              onNewMessage: handleNewMessage,
            });
          }
          return child;
        })}
      </main>
    </div>
  );
}
