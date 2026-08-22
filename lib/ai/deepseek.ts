// ============================================================
// DeepSeek Reasoning Client with Live <think> Stream Parsing
// ============================================================

export interface StreamDeepSeekOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const DEFAULT_DEEPSEEK_SYSTEM = `You are DeepSeek-R1, an elite mathematical, algorithmic, and architectural reasoning assistant.
- ALWAYS write 100% COMPLETE, working, unbroken, and production-ready code. NEVER truncate or omit code, and NEVER write placeholders like '// ... rest of code'.
- Provide meticulous step-by-step reasoning when solving complex technical problems.
- Format all code with strict syntax highlighting, type safety, and error handling.
- Be exhaustive, precise, and direct.`;

/**
 * Real-time SSE streaming for DeepSeek with <think> tag separation
 */
export async function* streamFromDeepSeek(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamDeepSeekOptions = {}
): AsyncGenerator<{ text?: string; thinking?: string }, void, unknown> {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const systemText = options.systemInstruction || DEFAULT_DEEPSEEK_SYSTEM;
  const messages = [
    { role: 'system', content: systemText },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'deepseek-reasoner',
      messages,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 8192,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      errorData?.error?.message || `DeepSeek API error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('No response body received from DeepSeek stream.');
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
          const delta = parsed?.choices?.[0]?.delta;
          if (delta?.reasoning_content) {
            yield { thinking: delta.reasoning_content };
          }
          if (delta?.content) {
            yield { text: delta.content };
          }
        } catch {
          // Ignore incomplete chunk parses
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Send message to DeepSeek API (non-streaming)
 */
export async function sendToDeepSeek(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamDeepSeekOptions = {}
): Promise<{ response: string; title: string; thinkingContent?: string }> {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  const systemText = options.systemInstruction || DEFAULT_DEEPSEEK_SYSTEM;
  const messages = [
    { role: 'system', content: systemText },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'deepseek-reasoner',
        messages,
        temperature: options.temperature ?? 0.5,
        max_tokens: options.maxTokens ?? 8192,
      }),
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message || `DeepSeek API error HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const choice = data?.choices?.[0]?.message;
    const content = choice?.content;
    const reasoning = choice?.reasoning_content;

    if (!content) {
      throw new Error('Received an empty response from DeepSeek.');
    }

    return {
      response: content,
      title: userMessage.substring(0, 80),
      thinkingContent: reasoning || undefined,
    };
  } finally {
    clearTimeout(timeout);
  }
}
