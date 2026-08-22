// ============================================================
// /api/intelligence/projects/[id] — Single Project CRUD
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { getProject, updateProject, deleteProject } from '@/lib/database/intelligence';
import type { UpdateProjectInput } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded.' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    const project = await getProject(userId, id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const body = (await request.json()) as UpdateProjectInput;
    const updated = await updateProject(userId, id, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Update failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const deleted = await deleteProject(userId, id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Delete failed.' }, { status: 500 });
  }
}
