// ============================================================
// GET /api/intelligence/news — Industry News & Announcements
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
    const searchQuery = searchParams.get('q') || undefined;
    const minImpact = searchParams.get('minImpact')
      ? parseFloat(searchParams.get('minImpact')!)
      : undefined;

    let items = await getIntelligenceItems(userId, {
      projectId,
      topic,
      searchQuery,
      limit: 100,
    });

    // Filter to news and competitor updates
    items = items.filter((i) => i.type === 'news' || i.type === 'competitor');

    if (minImpact !== undefined) {
      items = items.filter((i) => i.impactScore >= minImpact);
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load news items.' }, { status: 500 });
  }
}
