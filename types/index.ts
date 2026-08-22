// ============================================================
// AI Chatbot Platform — Core Type Definitions
// ============================================================

// --- User ---
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
}

// --- Conversation ---
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateConversationInput {
  title?: string;
}

export interface UpdateConversationInput {
  title: string;
}

// --- Message ---
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO string
}

// --- Chat API ---
export interface ChatRequest {
  conversationId?: string; // omit to create new conversation
  message: string;
}

export interface ChatResponse {
  success: true;
  conversationId: string;
  message: Message;
  title?: string; // included when a new title is auto-generated
}

// --- n8n ---
export interface N8nPayload {
  conversationId: string;
  message: string;
  history: Array<{ role: MessageRole; content: string }>;
}

export interface N8nResponse {
  response: string;
  title?: string;
}

// --- API Errors ---
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'CHAT_REQUEST_FAILED'
  | 'CONVERSATION_NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'AI_NOT_CONFIGURED'
  | 'MESSAGE_TOO_LONG'
  | 'REQUEST_TOO_LARGE';

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type ApiResult<T> = T | ApiError;

// --- Conversations API ---
export interface ConversationsListResponse {
  success: true;
  conversations: Conversation[];
}

export interface ConversationDetailResponse {
  success: true;
  conversation: Conversation;
  messages: Message[];
}

export interface ConversationCreateResponse {
  success: true;
  conversation: Conversation;
}

export interface ConversationUpdateResponse {
  success: true;
  conversation: Conversation;
}

export interface ConversationDeleteResponse {
  success: true;
}

export interface MessagesListResponse {
  success: true;
  messages: Message[];
}

// --- Re-export Intelligence Types ---
export * from './intelligence';
