// ============================================================
// n8n Webhook Client — Server-side Only
// ============================================================
import type { N8nPayload, N8nResponse } from '@/types';

const N8N_TIMEOUT_MS = 60_000; // 60 seconds

/**
 * Send a chat request to the n8n webhook and receive the AI response.
 */
export async function sendToN8n(payload: N8nPayload): Promise<N8nResponse> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    throw new N8nError(
      'N8N_NOT_CONFIGURED',
      'n8n webhook URL is not configured. Set the N8N_WEBHOOK_URL environment variable.'
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add webhook secret as authorization header if configured
    if (webhookSecret) {
      headers['X-Webhook-Secret'] = webhookSecret;
    }

    // Include format fields for standard Webhook, Chat Trigger, and LangChain Agent nodes
    const bodyData = {
      ...payload,
      chatInput: payload.message,
      input: payload.message,
      sessionId: payload.conversationId,
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
      signal: controller.signal,
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`[n8n] Webhook returned status ${status}`);
      throw new N8nError(
        'N8N_REQUEST_FAILED',
        'The AI service is temporarily unavailable. Please try again.'
      );
    }

    const data = await response.json();

    // Validate and extract response text from various n8n output formats
    let responseText = '';

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      responseText =
        first?.output ||
        first?.response ||
        first?.text ||
        first?.message?.content ||
        first?.message ||
        (typeof first === 'string' ? first : '');
    } else if (typeof data === 'object' && data !== null) {
      responseText =
        data?.output ||
        data?.response ||
        data?.message?.content ||
        data?.message ||
        data?.text ||
        data?.result ||
        '';
    } else if (typeof data === 'string') {
      responseText = data;
    }

    if (!responseText) {
      console.error('[n8n] Unexpected response format:', JSON.stringify(data).substring(0, 200));
      throw new N8nError(
        'N8N_INVALID_RESPONSE',
        'Received an unexpected response from the AI service.'
      );
    }

    return {
      response: String(responseText),
      title: data?.title || (Array.isArray(data) ? data[0]?.title : undefined),
    };
  } catch (error) {
    if (error instanceof N8nError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new N8nError(
        'N8N_TIMEOUT',
        'The AI service took too long to respond. Please try again.'
      );
    }

    console.error('[n8n] Request failed:', (error as Error).message);
    throw new N8nError(
      'N8N_REQUEST_FAILED',
      'Unable to reach the AI service. Please try again later.'
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Custom error class for n8n-related errors.
 */
export class N8nError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'N8nError';
  }
}
