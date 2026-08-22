// ============================================================
// Direct OpenAI Client with Real-Time SSE Streaming
// ============================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  response: string;
  title?: string;
}

export interface StreamOpenAIOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const DEFAULT_SYSTEM_PROMPT = `You are NEXORA AI, a world-class, professional AI coding assistant and intelligent workspace companion.
- Provide clean, production-grade code with error handling, type definitions, and best practices.
- Use markdown formatting with language identifiers for all code blocks (e.g. \`\`\`python, \`\`\`typescript, \`\`\`sql).
- Be concise, accurate, and direct. Avoid unnecessary conversational fluff.
- When generating code, explain critical design decisions briefly after the code block.`;

/**
 * Real-time SSE Streaming Generator for OpenAI
 */
export async function* streamFromOpenAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamOpenAIOptions = {}
): AsyncGenerator<{ text?: string }, void, unknown> {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const systemText = options.systemInstruction || DEFAULT_SYSTEM_PROMPT;
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemText },
    ...history.slice(-12).map((msg) => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 3500,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      errorData?.error?.message || `OpenAI API error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('No response body received from OpenAI stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            yield { text: delta };
          }
        } catch {
          // Ignore incomplete chunk JSON parses
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Send messages directly to OpenAI API (non-streaming)
 */
export async function sendToOpenAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamOpenAIOptions = {}
): Promise<OpenAIResponse> {
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in .env.local.');
  }

  const systemText = options.systemInstruction || DEFAULT_SYSTEM_PROMPT;
  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemText },
    ...history.slice(-12).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40_000);

  try {
    const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 3500,
      }),
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message || `OpenAI API returned error ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Received an empty response from OpenAI.');
    }

    return {
      response: content,
      title: userMessage.substring(0, 80),
    };
  } finally {
    clearTimeout(timeout);
  }
}
