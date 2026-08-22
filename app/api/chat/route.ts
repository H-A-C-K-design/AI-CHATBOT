// ============================================================
// POST /api/chat — Real-Time Multi-AI Chat Endpoint
// Supports Live SSE Streaming, Multi-Model Routing & RAG Citations
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { sanitizeInput, sanitizeAIOutput } from '@/lib/validation/sanitize';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import {
  createConversation,
  getConversation,
  touchConversation,
  setConversationTitle,
} from '@/lib/database/conversations';
import { createMessage, getRecentMessages } from '@/lib/database/messages';
import {
  getIntelligenceItems,
  getProjects,
  calculateAndGetTrends,
  getAlerts,
} from '@/lib/database/intelligence';
import { streamUnifiedAI, dispatchUnifiedAI, generateTitleFromQuery } from '@/lib/ai/router';
import type { ChatResponse, ApiError, AIModelId, AIPersonaId, Message } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Authenticate Request
    let userId = 'anonymous';
    try {
      const decodedToken = await authenticateRequest(request);
      userId = decodedToken.uid;
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: authErr.message } },
          { status: 401 }
        );
      }
    }

    // 2. Rate Limit Check
    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded. Please wait a moment before sending your next prompt.',
          },
        },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    // 3. Parse Body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON request payload.' } },
        { status: 400 }
      );
    }

    const rawMessage = typeof body.message === 'string' ? body.message : '';
    if (!rawMessage.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Message content cannot be empty.' } },
        { status: 400 }
      );
    }

    const message = sanitizeInput(rawMessage);
    const requestedConvId = body.conversationId as string | undefined;
    const requestedModel = (body.model || 'gemini-3.5-flash') as AIModelId;
    const requestedPersona = (body.persona || 'general-assistant') as AIPersonaId;
    const isStreamingRequested = body.stream !== false; // Default to real-time streaming
    const customApiKey = (body.customApiKey || request.headers.get('x-custom-api-key') || undefined) as string | undefined;
    const attachments = (Array.isArray(body.attachments) ? body.attachments : []) as any[];

    // 4. Conversation Management (Fault-Tolerant)
    let conversationId: string =
      requestedConvId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let isNewConversation = false;

    try {
      if (requestedConvId) {
        const existingConv = await getConversation(userId, requestedConvId);
        if (existingConv) {
          conversationId = existingConv.id;
        }
      } else {
        const newConv = await createConversation(userId, {
          title: generateTitleFromQuery(message),
          model: requestedModel,
          persona: requestedPersona,
        });
        conversationId = newConv.id;
        isNewConversation = true;
      }
    } catch (dbErr) {
      console.warn('[/api/chat] Conversation DB Warning:', (dbErr as Error).message);
    }

    // 5. Context History Retrieval (prior turns in this conversation)
    let history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    try {
      const priorMessages = await getRecentMessages(conversationId, 16);
      history = priorMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } catch {
      history = [];
    }

    // 6. Persist Current User Message
    try {
      await createMessage(conversationId, 'user', message, { attachments });
    } catch (msgDbErr) {
      console.warn('[/api/chat] User Message DB Warning:', (msgDbErr as Error).message);
    }

    // 7. Intelligence RAG Retrieval Grounding
    const isIntelQuery = isIntelligenceIntent(message) || body.enableIntelligenceRAG === true;
    let intelContext = '';
    let extractedSources: Array<{ title: string; url: string; sourceName: string; type?: string }> = [];

    if (isIntelQuery) {
      try {
        const [items, projects, trends, alerts] = await Promise.all([
          getIntelligenceItems(userId, { searchQuery: extractKeywords(message), limit: 6 }),
          getProjects(userId),
          calculateAndGetTrends(userId),
          getAlerts(userId, { status: 'unread', limit: 4 }),
        ]);

        if (items.length > 0 || projects.length > 0) {
          intelContext = formatIntelligenceContext(items, projects, trends, alerts);
          extractedSources = items.map((item) => ({
            title: item.title,
            url: item.sourceUrl,
            sourceName: item.sourceName,
            type: item.type,
          }));
        }
      } catch (ragErr) {
        console.warn('[/api/chat] RAG Intelligence Warning:', (ragErr as Error).message);
      }
    }

    let attachmentContext = '';
    if (attachments.length > 0) {
      const fileSummaries = attachments.map((att: any) => {
        if (att.textContent) {
          return `\n--- Attached Document: ${att.name} (${(att.size / 1024).toFixed(1)} KB) ---\n${att.textContent.slice(0, 10000)}\n--- End of ${att.name} ---`;
        } else if (att.type?.startsWith('image/')) {
          return `\n[User uploaded image attachment: "${att.name}" (${(att.size / 1024).toFixed(1)} KB)]`;
        } else {
          return `\n[User uploaded file attachment: "${att.name}" (${(att.size / 1024).toFixed(1)} KB)]`;
        }
      }).join('\n\n');
      attachmentContext = `\n\n[USER ATTACHED FILES]:\n${fileSummaries}`;
    }

    const augmentedMessage = `${message}${attachmentContext}${intelContext ? `\n\n${intelContext}` : ''}`;

    // ============================================================
    // STREAMING SSE MODE (Default ChatGPT Experience)
    // ============================================================
    if (isStreamingRequested) {
      const encoder = new TextEncoder();
      const generatedTitle = isNewConversation ? generateTitleFromQuery(message) : undefined;

      const readableStream = new ReadableStream({
        async start(controller) {
          // Helper to emit SSE event line
          const sendEvent = (obj: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          };

          // 1. Emit Initial Metadata
          sendEvent({
            type: 'meta',
            conversationId,
            title: generatedTitle,
            modelRequested: requestedModel,
            persona: requestedPersona,
          });

          // 2. Emit Sources if RAG context exists
          if (extractedSources.length > 0) {
            sendEvent({
              type: 'sources',
              sources: extractedSources,
            });
          }

          let accumulatedAnswer = '';
          let accumulatedThinking = '';
          let finalModelUsed = requestedModel;

          try {
            for await (const chunk of streamUnifiedAI(augmentedMessage, history, {
              model: requestedModel,
              persona: requestedPersona,
              customApiKey,
            })) {
              if (chunk.type === 'meta') {
                if (chunk.modelUsed) finalModelUsed = chunk.modelUsed as AIModelId;
                sendEvent({
                  type: 'meta',
                  modelUsed: chunk.modelUsed,
                  personaUsed: chunk.personaUsed,
                });
              } else if (chunk.type === 'think' && chunk.content) {
                accumulatedThinking += chunk.content;
                sendEvent({
                  type: 'think',
                  content: chunk.content,
                });
              } else if (chunk.type === 'token' && chunk.content) {
                accumulatedAnswer += chunk.content;
                sendEvent({
                  type: 'token',
                  content: chunk.content,
                });
              } else if (chunk.type === 'done') {
                if (chunk.thinkingContent) accumulatedThinking = chunk.thinkingContent;
                if (chunk.content) accumulatedAnswer = chunk.content;
              }
            }

            // 3. Clean and Persist Assistant Message in DB
            const sanitizedAnswer = sanitizeAIOutput(accumulatedAnswer);
            const assistantMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

            try {
              await createMessage(conversationId, 'assistant', sanitizedAnswer, {
                id: assistantMsgId,
                modelUsed: finalModelUsed,
                personaUsed: requestedPersona,
                thinkingContent: accumulatedThinking || undefined,
                sources: extractedSources.length > 0 ? extractedSources : undefined,
              });
              await touchConversation(conversationId, sanitizedAnswer);
              if (isNewConversation && generatedTitle) {
                await setConversationTitle(conversationId, generatedTitle);
              }
            } catch (persistErr) {
              console.warn('[/api/chat] Streaming persist warning:', (persistErr as Error).message);
            }

            // 4. Send Done Event
            sendEvent({
              type: 'done',
              messageId: assistantMsgId,
              fullContent: sanitizedAnswer,
              thinkingContent: accumulatedThinking || undefined,
              modelUsed: finalModelUsed,
            });
          } catch (streamErr) {
            const errorMsg = (streamErr as Error)?.message || 'Stream generation failed';
            console.error('[/api/chat] Streaming error:', errorMsg);
            sendEvent({
              type: 'error',
              message: errorMsg,
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          ...rateLimitHeaders(rateResult),
        },
      });
    }

    // ============================================================
    // NON-STREAMING JSON FALLBACK
    // ============================================================
    const dispatchResult = await dispatchUnifiedAI(augmentedMessage, history, {
      model: requestedModel,
      persona: requestedPersona,
      customApiKey,
    });

    const sanitizedAnswer = sanitizeAIOutput(dispatchResult.response);
    let assistantMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationId,
      role: 'assistant',
      content: sanitizedAnswer,
      createdAt: new Date().toISOString(),
      modelUsed: dispatchResult.modelUsed,
      personaUsed: dispatchResult.personaUsed,
      thinkingContent: dispatchResult.thinkingContent,
      sources: extractedSources.length > 0 ? extractedSources : undefined,
    };

    try {
      assistantMessage = await createMessage(conversationId, 'assistant', sanitizedAnswer);
      await touchConversation(conversationId);
      if (isNewConversation) {
        await setConversationTitle(conversationId, dispatchResult.title);
      }
    } catch (persistErr) {
      console.warn('[/api/chat] Persist warning:', (persistErr as Error).message);
    }

    const responseData: ChatResponse = {
      success: true,
      conversationId,
      message: assistantMessage,
      title: isNewConversation ? dispatchResult.title : undefined,
      modelUsed: dispatchResult.modelUsed,
    };

    return NextResponse.json(responseData, {
      headers: rateLimitHeaders(rateResult),
    });
  } catch (error) {
    const errMessage = (error as Error).message || 'An unexpected error occurred.';
    console.error('[/api/chat] Internal error:', errMessage);

    return NextResponse.json(
      {
        success: false,
        error: { code: 'CHAT_REQUEST_FAILED', message: errMessage },
      },
      { status: 500 }
    );
  }
}

function isIntelligenceIntent(query: string): boolean {
  const lower = query.toLowerCase();
  const intelTriggers = [
    'research',
    'patent',
    'competitor',
    'intelligence',
    'paper',
    'publication',
    'trend',
    'alert',
    'developments in',
    'what changed',
    'summarize this week',
    'growing fastest',
    'industry news',
    'arxiv',
  ];
  return intelTriggers.some((t) => lower.includes(t));
}

function extractKeywords(query: string): string {
  return query
    .replace(/[^\w\s]/gi, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .join(' ');
}

function formatIntelligenceContext(
  items: any[],
  projects: any[],
  trends: any[],
  alerts: any[]
): string {
  let context = `[REAL VERIFIED DATABASE INTELLIGENCE RETRIEVAL]\n`;
  if (projects.length > 0) {
    context += `Active Monitoring Projects: ${projects.map((p) => p.name).join(', ')}\n\n`;
  }

  if (items.length > 0) {
    context += `RELEVANT MONITORED RECORDS (${items.length}):\n`;
    items.forEach((item, i) => {
      context += `[Record ${i + 1}] Type: ${item.type?.toUpperCase()} | Title: "${item.title}"\n`;
      context += `Source: ${item.sourceName} | Verified URL: ${item.sourceUrl}\n`;
      context += `Summary: ${item.summary}\n\n`;
    });
  }

  if (trends.length > 0) {
    context += `CURRENT HISTORICAL TRENDS:\n`;
    trends.slice(0, 3).forEach((t) => {
      context += `• ${t.topic}: ${t.growthRate >= 0 ? '+' : ''}${t.growthRate}% growth\n`;
    });
    context += `\n`;
  }

  context += `INSTRUCTIONS:
1. Base your answer on the above verified records.
2. Provide clickable markdown links to verified source URLs under a "Supporting Sources" section.`;

  return context;
}
