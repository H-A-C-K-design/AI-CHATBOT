// ============================================================
// Direct Google Gemini Client — Server-side Only
// ============================================================

export interface GeminiResponse {
  response: string;
  title?: string;
}

const SYSTEM_INSTRUCTION = `You are NEXORA AI, an intelligent, professional AI coding assistant and developer workspace companion.
- Provide clean, production-grade code with error handling, type definitions, and best practices.
- Use markdown formatting with language identifiers for all code blocks (e.g. \`\`\`python, \`\`\`typescript, \`\`\`sql).
- Be concise, accurate, and direct. Explain key decisions briefly.`;

/**
 * Send messages to Google Gemini API (gemini-3.6-flash / gemini-2.5-flash).
 */
export async function sendToGemini(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local.');
  }

  const contents = [
    ...history.slice(-10).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const requestedModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const fallbackModels = [
      requestedModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];
    // Deduplicate
    const modelsToTry = Array.from(new Set(fallbackModels));

    let lastError: Error | null = null;
    let data: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
            },
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          data = await response.json();
          break;
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg =
            errorData?.error?.message || `Gemini API returned error ${response.status}`;
          lastError = new Error(errorMsg);
          // If 404 or auth error, don't waste time trying invalid keys/endpoints
          if (response.status === 400 || response.status === 401 || response.status === 403) {
            break;
          }
        }
      } catch (err) {
        lastError = err as Error;
      }
    }

    if (!data) {
      throw lastError || new Error('Failed to generate response from Gemini.');
    }

    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const textPart = parts.find((p: any) => typeof p.text === 'string' && p.text.trim().length > 0);
    const text = textPart?.text || parts[0]?.text;

    if (!text) {
      throw new Error('Received an empty response from Gemini.');
    }

    return {
      response: text,
      title: userMessage.substring(0, 80),
    };
  } finally {
    clearTimeout(timeout);
  }
}
