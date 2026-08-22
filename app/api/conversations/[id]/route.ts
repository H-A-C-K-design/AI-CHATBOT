// ============================================================
// GET/PATCH/DELETE /api/conversations/[id]
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { getConversation, updateConversation, deleteConversation } from '@/lib/database/conversations';
import { getMessages } from '@/lib/database/messages';
import { updateConversationSchema } from '@/lib/validation/chat';
import type { ConversationDetailResponse, ConversationUpdateResponse, ConversationDeleteResponse, ApiError } from '@/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ConversationDetailResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;
    const { id } = await context.params;

    const conversation = await getConversation(userId, id);
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' } },
        { status: 404 }
      );
    }

    const messages = await getMessages(id);

    return NextResponse.json({ success: true, conversation, messages });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[GET /api/conversations/[id]] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load conversation.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ConversationUpdateResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;
    const { id } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON.' } },
        { status: 400 }
      );
    }

    const parseResult = updateConversationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parseResult.error.issues[0]?.message || 'Invalid input.' } },
        { status: 400 }
      );
    }

    const updated = await updateConversation(userId, id, parseResult.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[PATCH /api/conversations/[id]] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update conversation.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ConversationDeleteResponse | ApiError>> {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;
    const { id } = await context.params;

    await deleteConversation(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: 401 }
      );
    }

    console.error('[DELETE /api/conversations/[id]] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete conversation.' } },
      { status: 500 }
    );
  }
}
