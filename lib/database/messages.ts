// ============================================================
// Firestore — Message CRUD Operations (Server-side)
// With Resilient Server-Side Memory Cache for Conversation Continuity
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import type { Message, MessageRole } from '@/types';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

// Resilient Server-Side In-Memory Cache for conversation messages
const serverMessagesCache: Map<string, Message[]> = new Map();

function getConversationMessagesCache(conversationId: string): Message[] {
  if (!serverMessagesCache.has(conversationId)) {
    serverMessagesCache.set(conversationId, []);
  }
  return serverMessagesCache.get(conversationId)!;
}

/**
 * Create a new message in a conversation.
 */
export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  extra?: Partial<Message>
): Promise<Message> {
  const id = extra?.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const message: Message = {
    id,
    conversationId,
    role,
    content,
    createdAt: extra?.createdAt || new Date().toISOString(),
    modelUsed: extra?.modelUsed,
    personaUsed: extra?.personaUsed,
    thinkingContent: extra?.thinkingContent,
    attachments: extra?.attachments,
    sources: extra?.sources,
  };

  // 1. Instantly store in server-side memory cache
  const cache = getConversationMessagesCache(conversationId);
  const existingIdx = cache.findIndex((m) => m.id === id);
  if (existingIdx >= 0) {
    cache[existingIdx] = message;
  } else {
    cache.push(message);
  }

  // 2. Persist to Firestore DB (fault-tolerant)
  try {
    const docRef = adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .doc(id);
    await docRef.set(message);
  } catch (error) {
    console.warn('[Firestore] createMessage write notice:', (error as Error).message);
  }

  return message;
}

/**
 * Get all messages for a conversation, sorted by creation time ascending.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const cache = getConversationMessagesCache(conversationId);

  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .get();

    if (!snapshot.empty) {
      const dbMessages = snapshot.docs.map((doc) => doc.data() as Message);
      // Merge DB messages into cache
      const map = new Map<string, Message>();
      cache.forEach((m) => map.set(m.id, m));
      dbMessages.forEach((m) => map.set(m.id, m));
      const combined = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      serverMessagesCache.set(conversationId, combined);
      return combined;
    }
  } catch (error) {
    console.warn('[Firestore] getMessages notice (using memory cache):', (error as Error).message);
  }

  return [...cache].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Get the last N messages for context (used for Multi-AI conversation continuity).
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  const allMessages = await getMessages(conversationId);
  return allMessages.slice(-limit);
}

/**
 * Delete all messages in a conversation (batch delete).
 */
export async function deleteMessages(conversationId: string): Promise<void> {
  serverMessagesCache.delete(conversationId);

  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] deleteMessages notice:', (error as Error).message);
  }
}
