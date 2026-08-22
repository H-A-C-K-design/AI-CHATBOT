// ============================================================
// GET /api/intelligence/trends — Historical Trend Detection Engine
// Calculated Dynamically from Real Database Records
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { calculateAndGetTrends } from '@/lib/database/intelligence';

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

    const trends = await calculateAndGetTrends(userId, projectId);

    const emerging = trends.filter((t) => t.status === 'emerging');
    const growing = trends.filter((t) => t.status === 'growing');
    const stable = trends.filter((t) => t.status === 'stable');
    const declining = trends.filter((t) => t.status === 'declining');

    return NextResponse.json({
      success: true,
      trends,
      breakdown: {
        emerging,
        growing,
        stable,
        declining,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to calculate trends.' }, { status: 500 });
  }
}
