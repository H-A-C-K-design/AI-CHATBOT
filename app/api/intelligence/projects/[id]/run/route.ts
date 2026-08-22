// ============================================================
// POST /api/intelligence/projects/[id]/run — Trigger Monitoring Run
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { runProjectMonitoring } from '@/lib/intelligence/orchestrator';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    const result = await runProjectMonitoring(userId, id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    console.error('[/api/intelligence/projects/run] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Monitoring run failed.' },
      { status: 500 }
    );
  }
}
