// ============================================================
// GET /api/intelligence/research — Research Publications
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { getIntelligenceItems } from '@/lib/database/intelligence';

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded.' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const keyword = searchParams.get('keyword') || undefined;
    const searchQuery = searchParams.get('q') || undefined;
    const minRelevance = searchParams.get('minRelevance')
      ? parseFloat(searchParams.get('minRelevance')!)
      : undefined;

    const items = await getIntelligenceItems(userId, {
      projectId,
      type: 'research',
      topic,
      keyword,
      searchQuery,
      minRelevance,
      limit: 100,
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load research items.' }, { status: 500 });
  }
}
