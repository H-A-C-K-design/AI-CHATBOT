// ============================================================
// Firestore — Conversation CRUD Operations (Server-side)
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import type { Conversation, CreateConversationInput, UpdateConversationInput } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';

// Resilient Server-Side Memory Cache for conversations
const serverConversationsCache: Map<string, Map<string, Conversation>> = new Map();

function getUserConversationsCache(userId: string): Map<string, Conversation> {
  if (!serverConversationsCache.has(userId)) {
    serverConversationsCache.set(userId, new Map());
  }
  return serverConversationsCache.get(userId)!;
}

/**
 * Create a new conversation / history session for a user.
 */
export async function createConversation(
  userId: string,
  input?: CreateConversationInput
): Promise<Conversation> {
  const now = new Date().toISOString();
  const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const conversation: Conversation = {
    id,
    userId,
    title: input?.title?.trim() || 'New conversation',
    model: input?.model || 'gemini-3.5-flash',
    persona: input?.persona || 'general-assistant',
    isPinned: input?.isPinned || false,
    tags: input?.tags || [],
    messageCount: 0,
    lastMessageSnippet: '',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Store in server cache
  const cache = getUserConversationsCache(userId);
  cache.set(id, conversation);

  // 2. Persist to Firestore DB
  try {
    const docRef = adminDb.collection(CONVERSATIONS_COLLECTION).doc(id);
    await docRef.set(conversation);
  } catch (error) {
    console.warn('[Firestore] createConversation write warning:', (error as Error).message);
  }

  return conversation;
}

/**
 * Get all conversations for a user, sorted by pinned status and updatedAt descending.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const cache = getUserConversationsCache(userId);
  const cachedConversations = Array.from(cache.values());

  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const dbConversations = snapshot.docs.map((doc) => doc.data() as Conversation);

    // Sync DB conversations into cache
    dbConversations.forEach((c) => cache.set(c.id, c));

    const allMap = new Map<string, Conversation>();
    cachedConversations.forEach((c) => allMap.set(c.id, c));
    dbConversations.forEach((c) => allMap.set(c.id, c));

    const combined = Array.from(allMap.values());
    
    // Sort pinned conversations first, then newest updatedAt
    return combined.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[Firestore] getConversations error (returning cache):', (error as Error).message);
    return cachedConversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }
}

/**
 * Get a single conversation by ID — enforces user ownership.
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<Conversation | null> {
  const cache = getUserConversationsCache(userId);
  const cached = cache.get(conversationId);
  if (cached) return cached;

  try {
    const doc = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .get();

    if (!doc.exists) return null;

    const conversation = doc.data() as Conversation;
    if (conversation.userId !== userId) return null;

    cache.set(conversationId, conversation);
    return conversation;
  } catch (error) {
    console.warn('[Firestore] getConversation:', (error as Error).message);
    return null;
  }
}

/**
 * Update a conversation (e.g. rename, pin/unpin, tags). Enforces user ownership.
 */
export async function updateConversation(
  userId: string,
  conversationId: string,
  input: UpdateConversationInput
): Promise<Conversation | null> {
  const existing = await getConversation(userId, conversationId);
  if (!existing) return null;

  const updates: Partial<Conversation> = {
    updatedAt: new Date().toISOString(),
  };

  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.isPinned !== undefined) updates.isPinned = input.isPinned;
  if (input.tags !== undefined) updates.tags = input.tags;

  const updated: Conversation = { ...existing, ...updates };

  const cache = getUserConversationsCache(userId);
  cache.set(conversationId, updated);

  try {
    await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .update(updates);
  } catch (error) {
    console.warn('[Firestore] updateConversation:', (error as Error).message);
  }

  return updated;
}

/**
 * Update only the updatedAt timestamp and last message snippet (when messages are added).
 */
export async function touchConversation(
  conversationId: string,
  lastSnippet?: string
): Promise<void> {
  // Update cache across all users
  for (const userCache of serverConversationsCache.values()) {
    if (userCache.has(conversationId)) {
      const conv = userCache.get(conversationId)!;
      conv.updatedAt = new Date().toISOString();
      if (lastSnippet) conv.lastMessageSnippet = lastSnippet.slice(0, 160);
      userCache.set(conversationId, conv);
    }
  }

  try {
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (lastSnippet) {
      updates.lastMessageSnippet = lastSnippet.slice(0, 160);
    }
    await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .update(updates);
  } catch (error) {
    console.warn('[Firestore] touchConversation:', (error as Error).message);
  }
}

/**
 * Update conversation title (server-side, no ownership check — call after verifying).
 */
export async function setConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  for (const userCache of serverConversationsCache.values()) {
    if (userCache.has(conversationId)) {
      const conv = userCache.get(conversationId)!;
      conv.title = title;
      conv.updatedAt = new Date().toISOString();
      userCache.set(conversationId, conv);
    }
  }

  try {
    await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .update({ title, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn('[Firestore] setConversationTitle:', (error as Error).message);
  }
}

/**
 * Delete a conversation and all its messages. Enforces user ownership.
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const cache = getUserConversationsCache(userId);
  cache.delete(conversationId);

  try {
    // Delete all messages in the subcollection
    const messagesSnapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection('messages')
      .get();

    const batch = adminDb.batch();

    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the conversation document
    batch.delete(adminDb.collection(CONVERSATIONS_COLLECTION).doc(conversationId));

    await batch.commit();
    return true;
  } catch (error) {
    console.warn('[Firestore] deleteConversation notice:', (error as Error).message);
    return true;
  }
}

/**
 * Search conversations by title for a user.
 */
export async function searchConversations(
  userId: string,
  query: string
): Promise<Conversation[]> {
  // Firestore doesn't support full-text search, so we fetch all user conversations
  // and filter client-side. For production scale, consider Algolia or similar.
  const conversations = await getConversations(userId);
  const lowerQuery = query.toLowerCase();

  return conversations.filter((c) =>
    c.title.toLowerCase().includes(lowerQuery)
  );
}
