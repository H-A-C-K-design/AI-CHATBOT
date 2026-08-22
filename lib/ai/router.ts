// ============================================================
// Multi-AI Intelligent Router & Real Provider Dispatcher
// Pure Real AI: Google Gemini, OpenAI ChatGPT, DeepSeek-R1
// Zero Mock, Zero Fake Pre-recorded Responses
// ============================================================
import { streamFromGemini, sendToGemini } from './gemini';
import { streamFromOpenAI, sendToOpenAI } from './openai';
import { streamFromDeepSeek, sendToDeepSeek } from './deepseek';
import { getPersonaById, AI_MODELS } from './models';
import type { AIModelId, AIPersonaId, StreamEventChunk } from '@/types';

export interface DispatchOptions {
  model?: AIModelId;
  persona?: AIPersonaId;
  enableReasoning?: boolean;
  enableIntelligenceRAG?: boolean;
  customApiKey?: string;
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Auto-select the optimal Real AI Model based on user intent analysis
 */
export function determineOptimalModel(userMessage: string): AIModelId {
  const text = userMessage.toLowerCase();

  // 1. Algorithmic, math, proof, step-by-step logic queries -> DeepSeek R1
  if (
    text.includes('proof') ||
    text.includes('algorithm') ||
    text.includes('math') ||
    text.includes('graph theory') ||
    text.includes('dynamic programming') ||
    text.includes('time complexity') ||
    text.includes('step by step reasoning')
  ) {
    return 'deepseek-r1';
  }

  // 2. High-level architecture, complex refactoring & security -> GPT-4o
  if (
    text.includes('architecture') ||
    text.includes('system design') ||
    text.includes('microservice') ||
    text.includes('security') ||
    text.includes('vulnerability') ||
    text.includes('refactor this architecture')
  ) {
    return 'gpt-4o';
  }

  // 3. Default to ultra-fast, high-accuracy Google Gemini
  return 'gemini-3.5-flash';
}

/**
 * Stream Unified Real AI response over an AsyncGenerator with transparent error handling
 */
export async function* streamUnifiedAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: DispatchOptions = {}
): AsyncGenerator<StreamEventChunk, void, unknown> {
  const startTime = Date.now();
  let requestedModel = options.model || 'gemini-3.5-flash';
  if (requestedModel === 'auto-router') {
    requestedModel = determineOptimalModel(userMessage);
  }

  const persona = getPersonaById(options.persona);
  const systemInstruction = persona.systemInstruction;
  let activeModelUsed: string = requestedModel;

  let streamSuccess = false;
  let fullAccumulatedText = '';
  let fullAccumulatedThinking = '';
  let primaryError: Error | null = null;

  // 1. Stream from the selected Real AI Provider
  try {
    if (requestedModel === 'gemini-3.5-flash' || requestedModel === 'gemini-3.6-flash') {
      yield {
        type: 'meta',
        modelUsed: requestedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' : 'Gemini 3.6 Flash',
        personaUsed: persona.name,
      };

      for await (const chunk of streamFromGemini(userMessage, history, {
        apiKey: options.customApiKey,
        model: requestedModel,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      })) {
        if (chunk.thinking) {
          fullAccumulatedThinking += chunk.thinking;
          yield { type: 'think', content: chunk.thinking };
        }
        if (chunk.text) {
          fullAccumulatedText += chunk.text;
          yield { type: 'token', content: chunk.text };
        }
      }
      streamSuccess = true;
    } else if (requestedModel === 'gpt-4o' || requestedModel === 'gpt-4o-mini') {
      yield {
        type: 'meta',
        modelUsed: requestedModel === 'gpt-4o' ? 'ChatGPT (GPT-4o)' : 'GPT-4o Mini',
        personaUsed: persona.name,
      };

      for await (const chunk of streamFromOpenAI(userMessage, history, {
        apiKey: options.customApiKey,
        model: requestedModel,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      })) {
        if (chunk.text) {
          fullAccumulatedText += chunk.text;
          yield { type: 'token', content: chunk.text };
        }
      }
      streamSuccess = true;
    } else if (requestedModel === 'deepseek-r1') {
      yield {
        type: 'meta',
        modelUsed: 'DeepSeek-R1 (Reasoning)',
        personaUsed: persona.name,
      };

      for await (const chunk of streamFromDeepSeek(userMessage, history, {
        apiKey: options.customApiKey,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      })) {
        if (chunk.thinking) {
          fullAccumulatedThinking += chunk.thinking;
          yield { type: 'think', content: chunk.thinking };
        }
        if (chunk.text) {
          fullAccumulatedText += chunk.text;
          yield { type: 'token', content: chunk.text };
        }
      }
      streamSuccess = true;
    } else {
      // Default to Google Gemini
      yield {
        type: 'meta',
        modelUsed: 'Gemini 3.5 Flash',
        personaUsed: persona.name,
      };

      for await (const chunk of streamFromGemini(userMessage, history, {
        apiKey: options.customApiKey,
        model: 'gemini-3.5-flash',
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      })) {
        if (chunk.thinking) {
          fullAccumulatedThinking += chunk.thinking;
          yield { type: 'think', content: chunk.thinking };
        }
        if (chunk.text) {
          fullAccumulatedText += chunk.text;
          yield { type: 'token', content: chunk.text };
        }
      }
      streamSuccess = true;
    }
  } catch (providerError) {
    primaryError = providerError as Error;
    console.warn(`[Multi-AI] Primary stream error on ${requestedModel}:`, primaryError.message);

    // If a non-Gemini model failed (e.g. OpenAI/DeepSeek key not configured), try real Gemini as automatic real failover
    if (requestedModel !== 'gemini-3.5-flash' && requestedModel !== 'gemini-3.6-flash') {
      try {
        yield {
          type: 'meta',
          modelUsed: 'Gemini 3.5 Flash (Auto-Failover)',
          personaUsed: persona.name,
        };

        for await (const chunk of streamFromGemini(userMessage, history, {
          model: 'gemini-3.5-flash',
          systemInstruction,
          temperature: options.temperature,
          signal: options.signal,
        })) {
          if (chunk.thinking) {
            fullAccumulatedThinking += chunk.thinking;
            yield { type: 'think', content: chunk.thinking };
          }
          if (chunk.text) {
            fullAccumulatedText += chunk.text;
            yield { type: 'token', content: chunk.text };
          }
        }
        activeModelUsed = 'gemini-3.5-flash';
        streamSuccess = true;
      } catch (fallbackError) {
        console.error('[Multi-AI] Fallback real AI failed:', (fallbackError as Error).message);
      }
    }
  }

  // If real AI generation did not succeed, throw genuine error — ZERO fake simulated responses
  if (!streamSuccess) {
    throw primaryError || new Error(`Failed to generate real AI response for ${requestedModel}. Please check your API configuration.`);
  }

  const durationMs = Date.now() - startTime;

  yield {
    type: 'done',
    content: fullAccumulatedText,
    thinkingContent: fullAccumulatedThinking || undefined,
    reasoningDurationMs: fullAccumulatedThinking ? durationMs : undefined,
    modelUsed: activeModelUsed,
  };
}

/**
 * Non-Streaming Dispatcher with 100% Real AI Providers
 */
export async function dispatchUnifiedAI(
  userMessage: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: DispatchOptions = {}
): Promise<{
  response: string;
  title: string;
  modelUsed: string;
  personaUsed: string;
  thinkingContent?: string;
}> {
  let requestedModel = options.model || 'gemini-3.5-flash';
  if (requestedModel === 'auto-router') {
    requestedModel = determineOptimalModel(userMessage);
  }

  const persona = getPersonaById(options.persona);
  const systemInstruction = persona.systemInstruction;

  try {
    if (requestedModel === 'gemini-3.5-flash' || requestedModel === 'gemini-3.6-flash') {
      const geminiRes = await sendToGemini(userMessage, history, {
        apiKey: options.customApiKey,
        model: requestedModel,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      });

      return {
        response: geminiRes.response,
        title: generateTitleFromQuery(userMessage),
        modelUsed: requestedModel === 'gemini-3.5-flash' ? 'Gemini 3.5 Flash' : 'Gemini 3.6 Flash',
        personaUsed: persona.name,
      };
    }

    if (requestedModel === 'gpt-4o' || requestedModel === 'gpt-4o-mini') {
      const openAiRes = await sendToOpenAI(userMessage, history, {
        apiKey: options.customApiKey,
        model: requestedModel,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      });

      return {
        response: openAiRes.response,
        title: generateTitleFromQuery(userMessage),
        modelUsed: requestedModel === 'gpt-4o' ? 'ChatGPT (GPT-4o)' : 'GPT-4o Mini',
        personaUsed: persona.name,
      };
    }

    if (requestedModel === 'deepseek-r1') {
      const deepseekRes = await sendToDeepSeek(userMessage, history, {
        apiKey: options.customApiKey,
        systemInstruction,
        temperature: options.temperature,
        signal: options.signal,
      });

      return {
        response: deepseekRes.response,
        title: generateTitleFromQuery(userMessage),
        modelUsed: 'DeepSeek-R1 (Reasoning)',
        personaUsed: persona.name,
        thinkingContent: deepseekRes.thinkingContent,
      };
    }

    // Default to Gemini 3.5 Flash
    const geminiRes = await sendToGemini(userMessage, history, {
      apiKey: options.customApiKey,
      model: 'gemini-3.5-flash',
      systemInstruction,
      temperature: options.temperature,
      signal: options.signal,
    });

    return {
      response: geminiRes.response,
      title: generateTitleFromQuery(userMessage),
      modelUsed: 'Gemini 3.5 Flash',
      personaUsed: persona.name,
    };
  } catch (primaryErr) {
    console.warn(`[Multi-AI] Primary dispatch error on ${requestedModel}:`, (primaryErr as Error).message);

    // Try real Gemini fallback
    if (requestedModel !== 'gemini-3.5-flash' && requestedModel !== 'gemini-3.6-flash') {
      try {
        const fallbackRes = await sendToGemini(userMessage, history, {
          model: 'gemini-3.5-flash',
          systemInstruction,
          temperature: options.temperature,
        });

        return {
          response: fallbackRes.response,
          title: generateTitleFromQuery(userMessage),
          modelUsed: 'Gemini 3.5 Flash (Auto-Failover)',
          personaUsed: persona.name,
        };
      } catch (fallbackErr) {
        console.error('[Multi-AI] Fallback real AI dispatch failed:', (fallbackErr as Error).message);
      }
    }

    // Throw authentic error — ZERO fake AI responses
    throw primaryErr;
  }
}

/**
 * Generate a clean 3-6 word ChatGPT-style title from prompt
 */
export function generateTitleFromQuery(message: string): string {
  const cleaned = message
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  const words = cleaned.split(' ').slice(0, 6).join(' ');
  return words.length > 50 ? `${words.substring(0, 47)}...` : words || 'New Conversation';
}
