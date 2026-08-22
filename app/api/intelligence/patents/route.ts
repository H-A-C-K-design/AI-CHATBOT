// ============================================================
// GET /api/intelligence/patents — Patent Watch
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
    const assignee = searchParams.get('assignee') || undefined;
    const technology = searchParams.get('technology') || undefined;
    const keyword = searchParams.get('keyword') || undefined;
    const searchQuery = searchParams.get('q') || undefined;

    let items = await getIntelligenceItems(userId, {
      projectId,
      type: 'patent',
      keyword,
      searchQuery,
      limit: 100,
    });

    if (assignee) {
      const lowerAssignee = assignee.toLowerCase();
      items = items.filter((i) => i.organization?.toLowerCase().includes(lowerAssignee));
    }

    if (technology) {
      const lowerTech = technology.toLowerCase();
      items = items.filter((i) => i.topics.some((t) => t.toLowerCase().includes(lowerTech)));
    }

    return NextResponse.json({ success: true, items });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load patent items.' }, { status: 500 });
  }
}
