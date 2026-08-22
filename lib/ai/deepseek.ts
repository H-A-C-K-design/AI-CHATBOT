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
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 4000,
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
