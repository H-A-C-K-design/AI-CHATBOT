// ============================================================
// GET/POST /api/conversations — List & Create Conversations
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { getConversations, searchConversations, createConversation } from '@/lib/database/conversations';
import { createConversationSchema } from '@/lib/validation/chat';
import type { ConversationsListResponse, ConversationCreateResponse, ApiError } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ConversationsListResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    // Check for search query
    const searchQuery = request.nextUrl.searchParams.get('q');

    let conversations;
    if (searchQuery && searchQuery.trim().length > 0) {
      conversations = await searchConversations(userId, searchQuery.trim());
    } else {
      conversations = await getConversations(userId);
    }

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[GET /api/conversations] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load conversations.' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ConversationCreateResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for creating a conversation
    }

    const parseResult = createConversationSchema.safeParse(body);
    const title = parseResult.success ? parseResult.data.title : undefined;

    const conversation = await createConversation(userId, { title });

    return NextResponse.json({ success: true, conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[POST /api/conversations] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create conversation.' } },
      { status: 500 }
    );
  }
}
