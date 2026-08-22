// ============================================================
// Firestore — Message CRUD Operations (Server-side)
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import type { Message, MessageRole } from '@/types';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Create a new message in a conversation.
 */
export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  agentSteps?: import('@/types').AgentStep[],
  agentMode?: import('@/types').AgentMode
): Promise<Message> {
  const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const message: Message = {
    id,
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...(agentSteps && agentSteps.length > 0 && { agentSteps }),
    ...(agentMode && { agentMode }),
  };

  try {
    const docRef = adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .doc(id);
    await docRef.set(message);
  } catch (error) {
    console.warn('[Firestore] createMessage write warning:', (error as Error).message);
  }

  return message;
}

/**
 * Get all messages for a conversation, sorted by creation time ascending.
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const snapshot = await adminDb
      .collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .get();

    const messages = snapshot.docs.map((doc) => doc.data() as Message);
    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    console.error('[Firestore] getMessages error:', (error as Error).message);
    return [];
  }
}

/**
 * Get the last N messages for context (used when sending to n8n).
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
}
