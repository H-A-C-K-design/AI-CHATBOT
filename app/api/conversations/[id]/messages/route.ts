// ============================================================
// GET /api/conversations/[id]/messages
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { getConversation } from '@/lib/database/conversations';
import { getMessages } from '@/lib/database/messages';
import type { MessagesListResponse, ApiError } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<MessagesListResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;
    const { id } = await context.params;

    // Verify ownership
    const conversation = await getConversation(userId, id);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' } },
        { status: 404 }
      );
    }

    const messages = await getMessages(id);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[GET /api/conversations/[id]/messages] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load messages.' } },
      { status: 500 }
    );
  }
}
