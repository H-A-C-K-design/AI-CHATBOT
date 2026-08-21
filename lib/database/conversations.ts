// ============================================================
// Firestore — Conversation CRUD Operations (Server-side)
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import type { Conversation, CreateConversationInput, UpdateConversationInput } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Create a new conversation for a user.
 */
export async function createConversation(
  userId: string,
  input?: CreateConversationInput
): Promise<Conversation> {
  const now = new Date().toISOString();
  const docRef = adminDb.collection(CONVERSATIONS_COLLECTION).doc();

  const conversation: Conversation = {
    id: docRef.id,
    userId,
    title: input?.title || 'New conversation',
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(conversation);
  return conversation;
}

/**
 * Get all conversations for a user, sorted by updatedAt descending.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const conversations = snapshot.docs.map((doc) => doc.data() as Conversation);
    
    // Sort in-memory to prevent index precondition errors
    return conversations.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error('[Firestore] getConversations error:', (error as Error).message);
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
  const doc = await adminDb
    .collection(CONVERSATIONS_COLLECTION)
    .doc(conversationId)
    .get();

  if (!doc.exists) return null;

  const conversation = doc.data() as Conversation;

  // Ownership check
  if (conversation.userId !== userId) return null;

  return conversation;
}

/**
 * Update a conversation (e.g. rename). Enforces user ownership.
 */
export async function updateConversation(
  userId: string,
  conversationId: string,
  input: UpdateConversationInput
): Promise<Conversation | null> {
  const existing = await getConversation(userId, conversationId);
  if (!existing) return null;

  const updates = {
    title: input.title,
    updatedAt: new Date().toISOString(),
  };

  await adminDb
    .collection(CONVERSATIONS_COLLECTION)
    .doc(conversationId)
    .update(updates);

  return { ...existing, ...updates };
}

/**
 * Update only the updatedAt timestamp (used when new messages are added).
 */
export async function touchConversation(conversationId: string): Promise<void> {
  await adminDb
    .collection(CONVERSATIONS_COLLECTION)
    .doc(conversationId)
    .update({ updatedAt: new Date().toISOString() });
}

/**
 * Update conversation title (server-side, no ownership check — call after verifying).
 */
export async function setConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  await adminDb
    .collection(CONVERSATIONS_COLLECTION)
    .doc(conversationId)
    .update({ title, updatedAt: new Date().toISOString() });
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
