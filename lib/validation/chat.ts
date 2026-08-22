// ============================================================
// Input Validation — Zod Schemas
// ============================================================
import { z } from 'zod';

// --- Constants ---
export const MAX_MESSAGE_LENGTH = 16000; // ~16K characters
export const MAX_TITLE_LENGTH = 200;
export const MAX_REQUEST_SIZE = 64 * 1024; // 64KB

// --- Chat Request ---
export const chatRequestSchema = z.object({
  conversationId: z
    .string()
    .min(1, 'Conversation ID must not be empty')
    .max(128, 'Conversation ID too long')
    .optional(),
  message: z
    .string()
    .min(1, 'Message must not be empty')
    .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`),
  agentMode: z
    .enum(['swarm', 'lead-orchestrator', 'research-analyst', 'code-engineer', 'security-critic'])
    .optional(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

// --- Conversation Create ---
export const createConversationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`)
    .optional(),
});

// --- Conversation Update ---
export const updateConversationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`),
});

// --- ID Validation ---
export const idParamSchema = z.object({
  id: z.string().min(1).max(128),
});

/**
 * Validate request body size before parsing.
 */
export function validateRequestSize(contentLength: string | null): boolean {
  if (!contentLength) return true; // Let body parsing handle missing content-length
  const size = parseInt(contentLength, 10);
  return !isNaN(size) && size <= MAX_REQUEST_SIZE;
}
