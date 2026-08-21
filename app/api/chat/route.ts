// ============================================================
// POST /api/chat — Main Chat Endpoint (Powered by OpenAI)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { chatRequestSchema, validateRequestSize } from '@/lib/validation/chat';
import { sanitizeInput, sanitizeAIOutput } from '@/lib/validation/sanitize';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import {
  createConversation,
  getConversation,
  touchConversation,
  setConversationTitle,
} from '@/lib/database/conversations';
import { createMessage, getRecentMessages } from '@/lib/database/messages';
import { sendToOpenAI } from '@/lib/ai/openai';
import type { ChatResponse, ApiError } from '@/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse | ApiError>> {
  try {
    // 1. Validate request size
    if (!validateRequestSize(request.headers.get('content-length'))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'REQUEST_TOO_LARGE', message: 'Request body is too large.' },
        },
        { status: 413 }
      );
    }

    // 2. Authenticate
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    // 3. Rate limit
    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait before trying again.',
          },
        },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    // 4. Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body.' },
        },
        { status: 400 }
      );
    }

    const parseResult = chatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues?.[0];
      const errorMsg = issue?.message || 'Invalid request payload.';
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: errorMsg },
        },
        { status: 400 }
      );
    }

    const { message: rawMessage, conversationId: requestedConvId } = parseResult.data;
    const message = sanitizeInput(rawMessage);

    // 5. Conversation management
    let conversationId: string;
    let isNewConversation = false;

    if (requestedConvId) {
      const conversation = await getConversation(userId, requestedConvId);
      if (!conversation) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONVERSATION_NOT_FOUND',
              message: 'Conversation not found.',
            },
          },
          { status: 404 }
        );
      }
      conversationId = conversation.id;
    } else {
      // Create a new conversation
      const newConv = await createConversation(userId, {
        title: 'New conversation',
      });
      conversationId = newConv.id;
      isNewConversation = true;
    }

    // 6. Persist user message
    await createMessage(conversationId, 'user', message);

    // 7. Build context history
    const recentMessages = await getRecentMessages(conversationId, 20);
    const history = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 8. Generate AI Response with OpenAI (gpt-4o-mini)
    const openAiResult = await sendToOpenAI(message, history);
    const aiResponseText = openAiResult.response;
    const aiResponseTitle = openAiResult.title;

    // 9. Sanitize and persist assistant message
    const assistantContent = sanitizeAIOutput(aiResponseText);
    const assistantMessage = await createMessage(
      conversationId,
      'assistant',
      assistantContent
    );

    // 10. Update conversation timestamp
    await touchConversation(conversationId);

    // 11. Auto-generate title for new conversations
    let generatedTitle: string | undefined;
    if (isNewConversation) {
      const title = aiResponseTitle || message.substring(0, 100);
      await setConversationTitle(conversationId, title);
      generatedTitle = title;
    }

    // 12. Return response
    const response: ChatResponse = {
      success: true,
      conversationId,
      message: assistantMessage,
      ...(generatedTitle && { title: generatedTitle }),
    };

    return NextResponse.json(response, {
      headers: rateLimitHeaders(rateResult),
    });
  } catch (error) {
    // Auth errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    // OpenAI or custom error message
    const errMessage = (error as Error).message || 'An unexpected error occurred.';
    console.error('[/api/chat] Error:', errMessage);

    return NextResponse.json(
      {
        success: false,
        error: { code: 'CHAT_REQUEST_FAILED', message: errMessage },
      },
      { status: 500 }
    );
  }
}
