// ============================================================
// POST /api/chat — Main Chat Endpoint with Intelligence RAG & Citations
// Supports Coding Assistant + Autonomous Intelligence Retrieval
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
import {
  getIntelligenceItems,
  getProjects,
  calculateAndGetTrends,
  getAlerts,
} from '@/lib/database/intelligence';
import { sendToOpenAI } from '@/lib/ai/openai';
import { sendToGemini } from '@/lib/ai/gemini';
import { sendToN8n } from '@/lib/n8n/client';
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
      if (conversation) {
        conversationId = conversation.id;
      } else {
        conversationId = requestedConvId;
      }
    } else {
      const newConv = await createConversation(userId, {
        title: 'New conversation',
      });
      conversationId = newConv.id;
      isNewConversation = true;
    }

    // 6. Persist user message
    await createMessage(conversationId, 'user', message);

    // 7. Context History & Intelligence Intent Retrieval (RAG)
    const recentMessages = await getRecentMessages(conversationId, 20);
    const history = recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Detect if the user query is asking for research, patents, competitor intel, trends, or project monitoring
    const isIntelQuery = isIntelligenceIntent(message);
    let augmentedMessage = message;

    if (isIntelQuery) {
      const [items, projects, trends, alerts] = await Promise.all([
        getIntelligenceItems(userId, { searchQuery: extractKeywords(message), limit: 8 }),
        getProjects(userId),
        calculateAndGetTrends(userId),
        getAlerts(userId, { status: 'unread', limit: 5 }),
      ]);

      if (items.length > 0 || projects.length > 0) {
        const intelContext = formatIntelligenceContext(items, projects, trends, alerts);
        augmentedMessage = `${message}\n\n${intelContext}`;
      } else {
        augmentedMessage = `${message}\n\n[SYSTEM INTELLIGENCE RETRIEVAL: No matching intelligence records found in database for user. Active Projects: 0. Instruct user to create a monitoring project in /intelligence or /projects if inquiring about competitive intelligence.]`;
      }
    }

    // 8. Generate AI Response (n8n Agent / Gemini / OpenAI)
    let aiResponseText = '';
    let aiResponseTitle: string | undefined;

    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const n8nResult = await sendToN8n({
          conversationId,
          message: augmentedMessage,
          history,
        });
        aiResponseText = n8nResult.response;
        aiResponseTitle = n8nResult.title;
      } catch (err: unknown) {
        console.warn('[AI] n8n webhook error, falling back to direct LLM:', (err as Error).message);
        if (process.env.GEMINI_API_KEY) {
          const geminiResult = await sendToGemini(augmentedMessage, history);
          aiResponseText = geminiResult.response;
          aiResponseTitle = geminiResult.title;
        } else if (process.env.OPENAI_API_KEY) {
          const openAiResult = await sendToOpenAI(augmentedMessage, history);
          aiResponseText = openAiResult.response;
          aiResponseTitle = openAiResult.title;
        } else {
          throw err;
        }
      }
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await sendToGemini(augmentedMessage, history);
        aiResponseText = geminiResult.response;
        aiResponseTitle = geminiResult.title;
      } catch (err: unknown) {
        if (process.env.OPENAI_API_KEY) {
          console.warn('[AI] Gemini error, trying OpenAI:', (err as Error).message);
          const openAiResult = await sendToOpenAI(augmentedMessage, history);
          aiResponseText = openAiResult.response;
          aiResponseTitle = openAiResult.title;
        } else {
          throw err;
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      const openAiResult = await sendToOpenAI(augmentedMessage, history);
      aiResponseText = openAiResult.response;
      aiResponseTitle = openAiResult.title;
    } else {
      throw new Error(
        'No AI API key or n8n webhook configured. Please set N8N_WEBHOOK_URL, GEMINI_API_KEY, or OPENAI_API_KEY in .env.local.'
      );
    }

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
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

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

/**
 * Check if the query is asking about intelligence, competitors, research, or patents.
 */
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
    'what changed in',
    'summarize this week',
    'what should our team',
    'growing fastest',
    'monitored',
    'industry news',
    'arxiv',
    'technology update',
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
  context += `Active Monitoring Projects: ${projects.map((p) => p.name).join(', ') || 'None'}\n\n`;

  if (items.length > 0) {
    context += `RELEVANT MONITORED RECORDS (${items.length}):\n`;
    items.forEach((item, i) => {
      context += `[Record ${i + 1}] Type: ${item.type.toUpperCase()} | Title: "${item.title}"\n`;
      context += `Source: ${item.sourceName} | Verified URL: ${item.sourceUrl}\n`;
      context += `Published: ${item.publishedAt} | Relevance: ${(item.relevanceScore * 100).toFixed(0)}% | Impact: ${(item.impactScore * 100).toFixed(0)}%\n`;
      context += `Summary: ${item.summary}\n`;
      if (item.whyItMatters) context += `Why It Matters: ${item.whyItMatters}\n`;
      context += `\n`;
    });
  }

  if (trends.length > 0) {
    context += `CURRENT HISTORICAL TRENDS:\n`;
    trends.slice(0, 3).forEach((t) => {
      context += `• ${t.topic} (${t.status.toUpperCase()}): ${t.growthRate >= 0 ? '+' : ''}${t.growthRate}% growth, ${t.itemCount} items\n`;
    });
    context += `\n`;
  }

  if (alerts.length > 0) {
    context += `ACTIVE HIGH-PRIORITY ALERTS:\n`;
    alerts.slice(0, 3).forEach((a) => {
      context += `• [${a.priority.toUpperCase()}] ${a.title} — ${a.reason}\n`;
    });
    context += `\n`;
  }

  context += `INSTRUCTIONS FOR RESPONSE:
1. Base your answer strictly on the above real records and context. Never fabricate facts, patents, research papers, or URLs.
2. If citing records, ALWAYS include clickable markdown links to the verified source URLs at the bottom under "Supporting sources:".
Example format:
Supporting sources:
• [Publication Title](sourceUrl) — SourceName (Research)
• [Patent Title](sourceUrl) — SourceName (Patent)
3. If no matching record answers the specific question, clearly explain what is currently monitored in the user's database.`;

  return context;
}
