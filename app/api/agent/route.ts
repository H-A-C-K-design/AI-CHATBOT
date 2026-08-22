// ============================================================
// POST /api/agent — Autonomous AI Cognitive Agent Endpoint
// Lifecycle: Understand → Plan/Reason → Collaborate → Use Tools → Manage Context
// Full Real-Time SSE Stream of Reasoning Milestones & Tool Logs
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
import { runAutonomousAgentStream } from '@/lib/ai/agent/agent-engine';
import { generateTitleFromQuery } from '@/lib/ai/router';
import type { AIModelId, AIPersonaId } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Authenticate
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

    // 2. Rate Limit
    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Agent rate limit exceeded. Please wait a moment before sending your next task.',
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
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON payload.' } },
        { status: 400 }
      );
    }

    const rawMessage = typeof body.message === 'string' ? body.message : '';
    if (!rawMessage.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Task description cannot be empty.' } },
        { status: 400 }
      );
    }

    const message = sanitizeInput(rawMessage);
    const requestedConvId = body.conversationId as string | undefined;
    const requestedModel = (body.model || 'gemini-3.5-flash') as AIModelId;
    const requestedPersona = (body.persona || 'code-engineer') as AIPersonaId;
    const customApiKey = (body.customApiKey || request.headers.get('x-custom-api-key') || undefined) as string | undefined;

    // 4. Conversation Management
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
          title: `[Agent] ${generateTitleFromQuery(message)}`,
          model: requestedModel,
          persona: requestedPersona,
        });
        conversationId = newConv.id;
        isNewConversation = true;
      }
    } catch (dbErr) {
      console.warn('[/api/agent] Conversation DB Notice:', (dbErr as Error).message);
    }

    // 5. Persist User Message
    try {
      await createMessage(conversationId, 'user', message);
    } catch (msgErr) {
      console.warn('[/api/agent] User Msg DB Notice:', (msgErr as Error).message);
    }

    // 6. Context History
    let history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    try {
      const recentMessages = await getRecentMessages(conversationId, 10);
      history = recentMessages.map((m) => ({ role: m.role, content: m.content }));
    } catch {
      history = [];
    }

    // 7. Stream SSE Agent Execution
    const encoder = new TextEncoder();
    const generatedTitle = isNewConversation ? generateTitleFromQuery(message) : undefined;

    const readableStream = new ReadableStream({
      async start(controller) {
        const sendEvent = (obj: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };

        // Initial metadata
        sendEvent({
          type: 'meta',
          conversationId,
          title: generatedTitle,
          isAgentMode: true,
          modelUsed: requestedModel,
        });

        try {
          let lastFinalSolution = '';
          let lastExecutionState: any = null;

          for await (const chunk of runAutonomousAgentStream(message, history, {
            model: requestedModel,
            persona: requestedPersona,
            customApiKey,
            userId,
          })) {
            if (chunk.type === 'agent_done' && chunk.data?.executionState) {
              lastExecutionState = chunk.data.executionState;
              lastFinalSolution = chunk.data.fullSolution || '';
            }

            // Stream chunk directly to client
            sendEvent({
              ...chunk,
              conversationId,
            });
          }

          // Persist assistant message with execution state
          if (lastFinalSolution) {
            const sanitizedAnswer = sanitizeAIOutput(lastFinalSolution);
            try {
              await createMessage(conversationId, 'assistant', sanitizedAnswer);
              await touchConversation(conversationId);
              if (isNewConversation && generatedTitle) {
                await setConversationTitle(conversationId, `[Agent] ${generatedTitle}`);
              }
            } catch (pErr) {
              console.warn('[/api/agent] Persist Notice:', (pErr as Error).message);
            }
          }
        } catch (streamErr) {
          sendEvent({
            type: 'agent_error',
            errorMessage: (streamErr as Error).message || 'Agent stream execution failed',
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'CHAT_REQUEST_FAILED', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
