// ============================================================
// Direct Google Gemini Client with Real-Time SSE Streaming
// ============================================================

export interface GeminiResponse {
  response: string;
  title?: string;
  thinkingContent?: string;
}

export interface StreamGeminiOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are NEXORA AI, a world-class, Principal AI Software Engineer and Intelligent Workspace Companion.
- ALWAYS write 100% COMPLETE, fully functional, unbroken, and production-ready code. NEVER cut off code in the middle, never omit implementations, and NEVER use lazy placeholders like '// ... rest of code' or '// TODO implement here'.
- If providing a script, component, or module, provide the entire working code with imports, types, proper error handling, and export statements.
- Format all code with proper markdown language identifiers (e.g. \`\`\`typescript, \`\`\`python, \`\`\`tsx, \`\`\`html, \`\`\`css, \`\`\`json, \`\`\`bash).
- Structure your response professionally:
  1. Direct, authoritative explanation of the architecture or logic.
  2. Full, complete, syntax-highlighted code block(s).
  3. Brief breakdown of key technical decisions, security considerations, and step-by-step usage/testing instructions.
- Be accurate, concise, and developer-centric.`;

const WORKING_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
];

/**
 * Format conversation history into Gemini API format with strict turn alternation
 */
function buildGeminiContents(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
) {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  // 1. Process and format past conversation turns
  for (const msg of history.slice(-16)) {
    if (msg.role === 'system' || !msg.content?.trim()) continue;
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user';

    // Gemini API requires strict role alternation (user -> model -> user -> model)
    if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
      contents[contents.length - 1].parts[0].text += `\n\n${msg.content}`;
    } else {
      contents.push({
        role: geminiRole,
        parts: [{ text: msg.content }],
      });
    }
  }

  // 2. Gemini requires the conversation to start with a 'user' turn
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  // 3. Append the new incoming user prompt
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });
  }

  return contents;
}

/**
 * Real-time SSE Streaming Generator for Gemini
 * Tries models in priority order for maximum reliability
 */
export async function* streamFromGemini(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamGeminiOptions = {}
): AsyncGenerator<{ text?: string; thinking?: string }, void, unknown> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const requestedModel = options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modelsToTry = Array.from(new Set([requestedModel, ...WORKING_MODELS]));
  const systemText = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  const contents = buildGeminiContents(userMessage, history);

  let streamConnected = false;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.5,
            maxOutputTokens: options.maxTokens ?? 8192,
          },
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData?.error?.message || `Gemini API error HTTP ${response.status}`;
        lastError = new Error(errorMsg);
        continue; // Try next available model in chain
      }

      if (!response.body) {
        continue;
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
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              const candidate = parsed?.candidates?.[0];
              const parts = candidate?.content?.parts || [];

              for (const part of parts) {
                if (part.thought && typeof part.text === 'string') {
                  yield { thinking: part.text };
                } else if (typeof part.text === 'string') {
                  yield { text: part.text };
                }
              }
            } catch {
              // Ignore partial chunk parsing
            }
          }
        }
        streamConnected = true;
        break; // Stream completed successfully
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (!streamConnected && lastError) {
    throw lastError;
  }
}

/**
 * Send message to Google Gemini API with multi-model fallback chain (non-streaming)
 */
export async function sendToGemini(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: StreamGeminiOptions = {}
): Promise<GeminiResponse> {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local.');
  }

  const contents = buildGeminiContents(userMessage, history);
  const systemText = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

  const requestedModel = options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modelsToTry = Array.from(new Set([requestedModel, ...WORKING_MODELS]));

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
            parts: [{ text: systemText }],
          },
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.5,
            maxOutputTokens: options.maxTokens ?? 8192,
          },
        }),
        signal: options.signal,
      });

      if (response.ok) {
        data = await response.json();
        break;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData?.error?.message || `Gemini API returned error ${response.status}`;
        lastError = new Error(errorMsg);
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
}
