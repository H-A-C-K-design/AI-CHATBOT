// ============================================================
// Firestore — Conversation CRUD Operations (Server-side)
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import type { Conversation, CreateConversationInput, UpdateConversationInput } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';

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
  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const conversations = snapshot.docs.map((doc) => doc.data() as Conversation);
    
    // Sort pinned conversations first, then newest updatedAt
    return conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[Firestore] getConversations:', (error as Error).message);
    return [];
  }
}

/**
 * Get a single conversation by ID — enforces user ownership.
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<Conversation | null> {
  try {
    const doc = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .get();

    if (!doc.exists) return null;

    const conversation = doc.data() as Conversation;
    if (conversation.userId !== userId) return null;

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

  try {
    await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .update(updates);
  } catch (error) {
    console.warn('[Firestore] updateConversation:', (error as Error).message);
  }

  return { ...existing, ...updates };
}

/**
 * Update only the updatedAt timestamp and last message snippet (when messages are added).
 */
export async function touchConversation(
  conversationId: string,
  lastSnippet?: string
): Promise<void> {
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
  const existing = await getConversation(userId, conversationId);
  if (!existing) return false;

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
