'use client';

// ============================================================
// Sidebar Component — Unified NEXORA Navigation & Chat Sessions
// ============================================================
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { signOut } from '@/lib/firebase/auth';
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
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [intelExpanded, setIntelExpanded] = useState(true);

  const isChatRoute = pathname.startsWith('/chat');
  const isIntelRoute = pathname.startsWith('/intelligence');
  const isProjectsRoute = pathname.startsWith('/projects');
  const isReportsRoute = pathname.startsWith('/reports');
  const isSettingsRoute = pathname.startsWith('/settings');

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

  const handleConfirmRename = useCallback(() => {
    if (editingId && editTitle.trim()) {
      onRenameConversation?.(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  }, [editingId, editTitle, onRenameConversation]);

  const handleKeyDownRename = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleConfirmRename();
      } else if (e.key === 'Escape') {
        setEditingId(null);
      }
    },
    [handleConfirmRename]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteConversation?.(id);
      setDeletingId(null);
    },
    [onDeleteConversation]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/login');
    } catch {
      // Silent fail
    }
  }, [router]);

  // Group conversations by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: { label: string; items: Conversation[] }[] = [];
  const todayItems: Conversation[] = [];
  const yesterdayItems: Conversation[] = [];
  const lastWeekItems: Conversation[] = [];
  const olderItems: Conversation[] = [];

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);
    if (date >= today) {
      todayItems.push(conv);
    } else if (date >= yesterday) {
      yesterdayItems.push(conv);
    } else if (date >= lastWeek) {
      lastWeekItems.push(conv);
    } else {
      olderItems.push(conv);
    }
  });

  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (lastWeekItems.length > 0) groups.push({ label: 'Last 7 days', items: lastWeekItems });
  if (olderItems.length > 0) groups.push({ label: 'Older', items: olderItems });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Main sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <Link href="/" className="sidebar-brand-link" onClick={onClose}>
            <div className="sidebar-brand-logo">
              <Image
                src="/logo.png"
                alt="NEXORA AI"
                width={28}
                height={28}
                className="sidebar-logo-img"
              />
            </div>
            <span className="sidebar-brand-title">NEXORA AI</span>
          </Link>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            type="button"
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Primary Navigation Sections */}
        <div className="sidebar-nav-modules">
          {/* 1. Chat */}
          <Link
            href="/chat"
            className={`nav-module-link ${isChatRoute ? 'nav-module-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Chat</span>
          </Link>

          {/* 2. Intelligence Section with Collapsible Submenu */}
          <div className="nav-intel-section">
            <div
              className={`nav-module-link nav-intel-header ${isIntelRoute ? 'nav-module-link-active' : ''}`}
              onClick={() => setIntelExpanded(!intelExpanded)}
              role="button"
              tabIndex={0}
            >
              <div className="nav-module-left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Intelligence</span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`intel-chevron ${intelExpanded ? 'intel-chevron-open' : ''}`}
                aria-hidden="true"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {intelExpanded && (
              <div className="nav-intel-submenu">
                <Link
                  href="/intelligence"
                  className={`sub-nav-item ${pathname === '/intelligence' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Overview
                </Link>
                <Link
                  href="/intelligence/research"
                  className={`sub-nav-item ${pathname === '/intelligence/research' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Research Trends
                </Link>
                <Link
                  href="/intelligence/patents"
                  className={`sub-nav-item ${pathname === '/intelligence/patents' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Patent Watch
                </Link>
                <Link
                  href="/intelligence/competitors"
                  className={`sub-nav-item ${pathname === '/intelligence/competitors' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Competitor Watch
                </Link>
                <Link
                  href="/intelligence/news"
                  className={`sub-nav-item ${pathname === '/intelligence/news' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Industry News
                </Link>
                <Link
                  href="/intelligence/trends"
                  className={`sub-nav-item ${pathname === '/intelligence/trends' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Trend Engine
                </Link>
                <Link
                  href="/intelligence/insights"
                  className={`sub-nav-item ${pathname === '/intelligence/insights' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  AI Insights
                </Link>
                <Link
                  href="/intelligence/alerts"
                  className={`sub-nav-item ${pathname === '/intelligence/alerts' ? 'sub-nav-item-active' : ''}`}
                  onClick={onClose}
                >
                  Alerts
                </Link>
              </div>
            )}
          </div>

          {/* 3. Projects */}
          <Link
            href="/projects"
            className={`nav-module-link ${isProjectsRoute ? 'nav-module-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Projects</span>
          </Link>

          {/* 4. Reports */}
          <Link
            href="/reports"
            className={`nav-module-link ${isReportsRoute ? 'nav-module-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Reports</span>
          </Link>

          {/* 5. Settings */}
          <Link
            href="/settings"
            className={`nav-module-link ${isSettingsRoute ? 'nav-module-link-active' : ''}`}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Settings</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Chat Conversations Drawer (Active when in /chat or if conversations exist) */}
        {isChatRoute && (
          <>
            <div className="sidebar-header">
              <button
                onClick={() => {
                  onNewChat?.();
                  onClose();
                }}
                className="new-chat-btn"
                type="button"
                id="btn-new-chat"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>New chat</span>
              </button>
            </div>

            {/* Search */}
            <div className="sidebar-search">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="search-icon" aria-hidden="true">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search chats..."
                className="sidebar-search-input"
                aria-label="Search conversations"
                id="sidebar-search"
              />
            </div>

            {/* Conversation list */}
            <nav className="sidebar-conversations" aria-label="Conversations">
              {conversations.length === 0 ? (
                <div className="sidebar-empty">
                  <p>{searchQuery ? 'No results found' : 'No conversations yet'}</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="conversation-group">
                    <h3 className="conversation-group-label">{group.label}</h3>
                    {group.items.map((conv) => (
                      <div
                        key={conv.id}
                        className={`conversation-item ${
                          conv.id === activeConversationId ? 'conversation-item-active' : ''
                        }`}
                      >
                        {editingId === conv.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDownRename}
                            onBlur={handleConfirmRename}
                            className="conversation-rename-input"
                            autoFocus
                            aria-label="Rename conversation"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              onSelectConversation?.(conv.id);
                              onClose();
                            }}
                            className="conversation-item-btn"
                            type="button"
                            title={conv.title}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M2 4H14M2 8H10M2 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="conversation-item-title">{conv.title}</span>
                          </button>
                        )}

                        {/* Item actions */}
                        {editingId !== conv.id && (
                          <div className="conversation-item-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(conv);
                              }}
                              className="conv-action-btn"
                              type="button"
                              aria-label="Rename conversation"
                              title="Rename"
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {deletingId === conv.id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(conv.id);
                                }}
                                className="conv-action-btn conv-action-btn-danger"
                                type="button"
                                aria-label="Confirm delete"
                                title="Click to confirm"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(conv.id);
                                  setTimeout(() => setDeletingId(null), 3000);
                                }}
                                className="conv-action-btn"
                                type="button"
                                aria-label="Delete conversation"
                                title="Delete"
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                  <path d="M3 4H13M5.5 4V3C5.5 2.448 5.948 2 6.5 2H9.5C10.052 2 10.5 2.448 10.5 3V4M6 7V12M10 7V12M4 4L4.5 13C4.5 13.552 4.948 14 5.5 14H10.5C11.052 14 11.5 13.552 11.5 13L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </nav>
          </>
        )}

        {/* User profile area */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="sidebar-user-avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="sidebar-user-avatar-placeholder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.displayName || 'User'}</span>
              <span className="sidebar-user-email">{user?.email || ''}</span>
            </div>
          </div>
          <div className="sidebar-footer-actions">
            <button
              onClick={() => router.push('/settings')}
              className="sidebar-footer-btn"
              type="button"
              aria-label="Settings"
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 1.5V3.5M8 12.5V14.5M1.5 8H3.5M12.5 8H14.5M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={handleSignOut}
              className="sidebar-footer-btn"
              type="button"
              aria-label="Sign out"
              title="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 2H3.5C2.67 2 2 2.67 2 3.5V12.5C2 13.33 2.67 14 3.5 14H6M6 8H14M14 8L11 5M14 8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
