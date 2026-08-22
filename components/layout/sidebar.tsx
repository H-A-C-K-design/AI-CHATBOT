'use client';

// ============================================================
// Sidebar Component — ChatGPT-Inspired Clean 260px Navigation
// Compact layout with grouped conversation history & user profile
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NexoraLogo } from '@/components/ui/nexora-logo';
import type { Conversation } from '@/types';

interface SidebarProps {
  conversations?: Conversation[];
  activeConversationId?: string | null;
  onNewChat?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  onSearch?: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations = [],
  activeConversationId = null,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onSearch,
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Initialize and auto-fetch conversations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('nexora_chat_conversations');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInternalConversations(parsed);
          }
        }
      } catch {
        // ignore
      }
    }

    const loadConversations = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('/api/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.conversations)) {
          setInternalConversations(data.conversations);
          if (typeof window !== 'undefined') {
            localStorage.setItem('nexora_chat_conversations', JSON.stringify(data.conversations));
          }
        }
      } catch {
        // silent
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user, getToken]);

  const effectiveConversations =
    conversations && conversations.length > 0 ? conversations : internalConversations;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleStartRename = useCallback((conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }, []);

  const handleConfirmRename = useCallback(async () => {
    if (editingId && editTitle.trim()) {
      if (onRenameConversation) {
        onRenameConversation(editingId, editTitle.trim());
      } else {
        try {
          const token = await getToken();
          if (token) {
            await fetch(`/api/conversations/${editingId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ title: editTitle.trim() }),
            });
            setInternalConversations((prev) =>
              prev.map((c) => (c.id === editingId ? { ...c, title: editTitle.trim() } : c))
            );
          }
        } catch {
          // silent
        }
      }
    }
    setEditingId(null);
  }, [editingId, editTitle, onRenameConversation, getToken]);

  const handleKeyDownRename = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleConfirmRename();
      } else if (e.key === 'Escape') {
        setEditingId(null);
      }
    },
    [handleConfirmRename]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setInternalConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexora_chat_conversations', JSON.stringify(updated));
        }
        return updated;
      });

      if (onDeleteConversation) {
        onDeleteConversation(id);
      } else {
        try {
          const token = await getToken();
          if (token) {
            await fetch(`/api/conversations/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (activeConversationId === id) {
              router.push('/chat');
            }
          }
        } catch {
          // silent
        }
      }
    },
    [onDeleteConversation, getToken, activeConversationId, router]
  );

  const handleSelectConv = useCallback(
    (id: string) => {
      if (onSelectConversation) {
        onSelectConversation(id);
      } else {
        router.push(`/chat/${id}`);
      }
      onClose();
    },
    [onSelectConversation, router, onClose]
  );

  const handleNewChatClick = useCallback(() => {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push('/chat');
    }
    onClose();
  }, [onNewChat, router, onClose]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      // silent
    }
  }, [router]);

  // Group conversations by date
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

  const filteredConversations = effectiveConversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups = [
    {
      label: 'Today',
      items: filteredConversations.filter((c) => new Date(c.updatedAt || c.createdAt) >= todayStart),
    },
    {
      label: 'Yesterday',
      items: filteredConversations.filter((c) => {
        const d = new Date(c.updatedAt || c.createdAt);
        return d >= yesterdayStart && d < todayStart;
      }),
    },
    {
      label: 'Previous 7 Days',
      items: filteredConversations.filter((c) => {
        const d = new Date(c.updatedAt || c.createdAt);
        return d >= weekStart && d < yesterdayStart;
      }),
    },
    {
      label: 'Older',
      items: filteredConversations.filter((c) => new Date(c.updatedAt || c.createdAt) < weekStart),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="chatgpt-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main ChatGPT Sidebar */}
      <aside className={`chatgpt-sidebar ${isOpen ? 'sidebar-visible' : ''}`} aria-label="Sidebar Navigation">
        {/* Brand Header */}
        <div className="chatgpt-sidebar-header">
          <Link href="/chat" className="chatgpt-brand-wrap" onClick={onClose}>
            <NexoraLogo size={24} withBackground={true} glow={true} />
            <span className="chatgpt-brand-title">NEXORA AI</span>
          </Link>

          <button
            onClick={onClose}
            className="chatgpt-close-sidebar-btn"
            type="button"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="chatgpt-newchat-container">
          <button
            onClick={handleNewChatClick}
            className="chatgpt-newchat-btn"
            type="button"
            id="btn-chatgpt-new-chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New chat</span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <div className="chatgpt-nav-section">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`chatgpt-nav-link ${showSearch ? 'chatgpt-nav-link-active' : ''}`}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search chats</span>
          </button>

          {showSearch && (
            <div className="chatgpt-search-inline">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search history..."
                className="chatgpt-search-input"
                autoFocus
              />
            </div>
          )}

          <Link
            href="/chat/history"
            className={`chatgpt-nav-link ${pathname === '/chat/history' ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>History & Sessions</span>
          </Link>

          <Link
            href="/projects"
            className={`chatgpt-nav-link ${pathname.startsWith('/projects') ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Projects</span>
          </Link>

          <Link
            href="/intelligence/research-analyzer"
            className={`chatgpt-nav-link ${pathname === '/intelligence/research-analyzer' ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Paper Analyzer</span>
          </Link>

          <Link
            href="/agent/evaluation"
            className={`chatgpt-nav-link ${pathname === '/agent/evaluation' ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <circle cx="12" cy="14" r="3" />
              <path d="M12 11v-2" />
            </svg>
            <span>Agent Evals &amp; Benchmarks</span>
          </Link>

          <Link
            href="/reports"
            className={`chatgpt-nav-link ${pathname.startsWith('/reports') ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Reports</span>
          </Link>

          <Link
            href="/settings"
            className={`chatgpt-nav-link ${pathname === '/settings' ? 'chatgpt-nav-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>

        <div className="chatgpt-sidebar-divider" />

        {/* Conversation History Section */}
        <nav className="chatgpt-history-scroll" aria-label="Recent Conversations">
          {effectiveConversations.length === 0 ? (
            <div className="chatgpt-history-empty">
              <span>{searchQuery ? 'No chats found' : 'Your conversations will appear here'}</span>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="chatgpt-history-group">
                <div className="chatgpt-group-header">{group.label}</div>
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    className={`chatgpt-history-item ${conv.id === activeConversationId ? 'history-item-active' : ''}`}
                  >
                    {editingId === conv.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDownRename}
                        onBlur={handleConfirmRename}
                        className="chatgpt-rename-input"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleSelectConv(conv.id)}
                        className="chatgpt-item-title-btn"
                        type="button"
                        title={conv.title}
                      >
                        <span className="chatgpt-item-text">{conv.title}</span>
                      </button>
                    )}

                    {editingId !== conv.id && (
                      <div className="chatgpt-item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(conv);
                          }}
                          className="chatgpt-action-icon"
                          type="button"
                          title="Rename"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conv.id);
                          }}
                          className="chatgpt-action-icon chatgpt-action-delete"
                          type="button"
                          title="Delete"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="chatgpt-user-footer">
          <div className="chatgpt-user-pill">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="chatgpt-user-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="chatgpt-avatar-placeholder">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="chatgpt-user-details">
              <span className="chatgpt-username">{user?.displayName || 'User'}</span>
            </div>
          </div>

          <div className="chatgpt-footer-actions">
            <ThemeToggle />
            <button
              onClick={() => router.push('/settings')}
              className="chatgpt-footer-btn"
              type="button"
              title="Settings"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={handleSignOut}
              className="chatgpt-footer-btn"
              type="button"
              title="Log out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
