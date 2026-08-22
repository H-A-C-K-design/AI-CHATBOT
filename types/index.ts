// ============================================================
// AI Chatbot Platform — Core Type Definitions & Multi-AI Schema
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
  model?: string;
  persona?: string;
}

export interface CreateConversationInput {
  title?: string;
  model?: string;
  persona?: string;
}

export interface UpdateConversationInput {
  title: string;
}

// --- Multi-AI Models & Providers ---
export type AIModelId =
  | 'gemini-3.5-flash'
  | 'gemini-3.6-flash'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'deepseek-r1'
  | 'claude-3-5-sonnet'
  | 'auto-router';

export type AIPersonaId =
  | 'general-assistant'
  | 'code-engineer'
  | 'intelligence-analyst'
  | 'security-critic'
  | 'creative-strategist';

export interface AIModelOption {
  id: AIModelId;
  name: string;
  provider: 'Google' | 'OpenAI' | 'DeepSeek' | 'Anthropic' | 'Omni';
  badge: 'Fast' | 'Reasoning' | 'Smart' | 'Code' | 'Auto';
  description: string;
  contextWindow: string;
  iconType: 'gemini' | 'openai' | 'deepseek' | 'claude' | 'router';
  supportsReasoning?: boolean;
}

export interface AIPersonaOption {
  id: AIPersonaId;
  name: string;
  role: string;
  description: string;
  icon: string;
  badge: string;
  systemInstruction: string;
}

// --- Message ---
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string; // ISO string
  modelUsed?: string;
  personaUsed?: string;
  thinkingContent?: string;
  reasoningDurationMs?: number;
  sources?: Array<{
    title: string;
    url: string;
    sourceName: string;
    type?: string;
  }>;
}

// --- Chat API ---
export interface ChatRequest {
  conversationId?: string; // omit to create new conversation
  message: string;
  model?: AIModelId;
  persona?: AIPersonaId;
  stream?: boolean;
  enableReasoning?: boolean;
  enableIntelligenceRAG?: boolean;
  customApiKey?: string; // Optional user-provided API key override
}

export interface ChatResponse {
  success: true;
  conversationId: string;
  message: Message;
  title?: string; // included when a new title is auto-generated
  modelUsed?: string;
}

// --- Real-time Streaming SSE Events ---
export type StreamEventType =
  | 'meta'
  | 'think'
  | 'token'
  | 'sources'
  | 'done'
  | 'error';

export interface StreamEventMeta {
  conversationId: string;
  modelUsed: string;
  title?: string;
  personaUsed?: string;
}

export interface StreamEventSources {
  sources: Array<{
    title: string;
    url: string;
    sourceName: string;
    type?: string;
  }>;
}

export interface StreamEventDone {
  messageId: string;
  fullContent: string;
  thinkingContent?: string;
  reasoningDurationMs?: number;
}

export interface StreamEventChunk {
  type: StreamEventType;
  content?: string;
  thinkingContent?: string;
  reasoningDurationMs?: number;
  modelUsed?: string;
  personaUsed?: string;
  sources?: Array<{
    title: string;
    url: string;
    sourceName: string;
    type?: string;
  }>;
}

// --- Multi-Agent Architecture ---
export type AgentId =
  | 'lead-orchestrator'
  | 'research-analyst'
  | 'code-engineer'
  | 'security-critic';

export type AgentMode = 'swarm' | AgentId;

export interface AgentStep {
  agentId: AgentId;
  agentName: string;
  role: string;
  title: string;
  content: string;
  durationMs: number;
  status: 'completed' | 'running' | 'failed';
}

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  systemInstruction: string;
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
