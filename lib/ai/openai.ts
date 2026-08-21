// ============================================================
// Direct OpenAI Client — Server-side Only
// ============================================================

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  response: string;
  title?: string;
}

const SYSTEM_PROMPT = `You are NEXORA AI, a world-class, professional AI coding assistant and intelligent workspace companion.
- Provide clean, production-grade code with error handling, type definitions, and best practices.
- Use markdown formatting with language identifiers for all code blocks (e.g. \`\`\`python, \`\`\`typescript, \`\`\`sql).
- Be concise, accurate, and direct. Avoid unnecessary conversational fluff.
- When generating code, explain critical design decisions briefly after the code block.`;

/**
 * Send messages directly to OpenAI API (gpt-4o-mini / gpt-4o).
 */
export async function sendToOpenAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in .env.local.');
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message || `OpenAI API returned error ${response.status}`;
      console.error('[OpenAI] API error:', errorMsg);
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
