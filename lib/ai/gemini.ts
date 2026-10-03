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

const DEFAULT_SYSTEM_INSTRUCTION = `You are Feed Forge AI, a world-class, Principal AI Software Engineer, Visual Synthesizer, and Intelligent Workspace Companion.
- ALWAYS write 100% COMPLETE, fully functional, unbroken, and production-ready code. NEVER cut off code in the middle, never omit implementations, and NEVER use lazy placeholders.
- DIRECT IMAGE GENERATION: Whenever the user asks to generate, create, draw, paint, or render an image, NEVER say you cannot generate images and NEVER provide boilerplate prompt text. ALWAYS directly generate and embed the visual image using markdown format:
  ![Image Description](https://image.pollinations.ai/prompt/YOUR_URL_ENCODED_PROMPT_HERE?width=1024&height=1024&nologo=true&enhance=true)
  Followed by a crisp breakdown of the artistic style, lighting, and composition.
- SINGLE-BLOCK 60FPS INTERACTIVE ANIMATIONS: Whenever the user asks for an animation, interactive visualization, 3D effect, particle system, canvas simulation, game, or UI animation:
  1. ALWAYS provide ONE SINGLE, complete, self-contained interactive HTML5 application inside a SINGLE \`\`\`html code block.
  2. Put ALL styles in inline <style> tags and ALL JavaScript/Canvas physics in inline <script> tags inside that one block.
  3. NEVER split the code into separate 'index.html', 'style.css', 'script.js' files. Everything must be in that single \`\`\`html code block so the live interactive animation sandbox runs it immediately!
  4. Make it responsive, visually stunning with smooth 60fps requestAnimationFrame physics, interactive on mousemove/clicks, and beautifully styled.
- Structure your response professionally and accurately.`;

const WORKING_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
];

function resolveModelCandidates(requestedModel?: string): string[] {
  const defaults = [...WORKING_MODELS];
  if (!requestedModel) return defaults;

  let prioritized: string[] = [];
  if (requestedModel.includes('3.6') || requestedModel.includes('pro')) {
    prioritized = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  } else if (requestedModel.includes('3.5') || requestedModel.includes('flash')) {
    prioritized = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'];
  } else {
    prioritized = [requestedModel, ...defaults];
  }

  return Array.from(new Set([...prioritized, ...defaults]));
}

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
 * Resolve the optimal API key based on query intent (animation vs image vs general)
 */
export function resolveApiKeyForPrompt(userMessage: string, customApiKey?: string): string {
  if (customApiKey) return customApiKey;

  const lower = userMessage.toLowerCase();

  // 1. Image Generation Intent -> IMAGE_API_KEY
  if (
    lower.includes('generate image') ||
    lower.includes('generate an image') ||
    lower.includes('create image') ||
    lower.includes('create an image') ||
    lower.startsWith('draw ') ||
    lower.includes('draw an image') ||
    lower.startsWith('paint ') ||
    lower.includes('illustration of') ||
    lower.includes('picture of') ||
    lower.includes('photo of')
  ) {
    return process.env.IMAGE_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  // 2. Animation & Visualization Intent -> ANIMATION_API_KEY
  if (
    lower.includes('animation') ||
    lower.includes('animate') ||
    lower.includes('video') ||
    lower.includes('canvas simulation') ||
    lower.includes('particle') ||
    lower.includes('visualizer') ||
    lower.includes('interactive visual')
  ) {
    return process.env.ANIMATION_API_KEY || process.env.GEMINI_API_KEY || '';
  }

  // 3. Default General Key
  return process.env.GEMINI_API_KEY || process.env.ANIMATION_API_KEY || process.env.IMAGE_API_KEY || '';
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
  const apiKey = resolveApiKeyForPrompt(userMessage, options.apiKey);
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const requestedModel = options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modelsToTry = resolveModelCandidates(requestedModel);
  const systemText = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
  const contents = buildGeminiContents(userMessage, history);

  let streamConnected = false;
  let lastError: Error | null = null;
  let totalYielded = 0;

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
          errorData?.error?.message || `Gemini API error HTTP ${response.status} on model ${model}`;
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
                  totalYielded++;
                  yield { text: part.text };
                }
              }
            } catch {
              // Ignore partial chunk parsing
            }
          }
        }

        if (totalYielded > 0) {
          streamConnected = true;
          break; // Stream completed with real output
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (!streamConnected && totalYielded === 0 && lastError) {
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
  const apiKey = resolveApiKeyForPrompt(userMessage, options.apiKey);

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local.');
  }

  const contents = buildGeminiContents(userMessage, history);
  const systemText = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

  const requestedModel = options.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const modelsToTry = resolveModelCandidates(requestedModel);

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
