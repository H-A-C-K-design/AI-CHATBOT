// ============================================================
// /api/intelligence/alerts — Alert Engine API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { getAlerts, updateAlertStatus } from '@/lib/database/intelligence';
import type { AlertPriority, AlertStatus } from '@/types';

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
    const status = (searchParams.get('status') as AlertStatus) || undefined;
    const priority = (searchParams.get('priority') as AlertPriority) || undefined;

    const alerts = await getAlerts(userId, {
      projectId,
      status,
      priority,
      limit: 100,
    });

    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load alerts.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const decodedToken = await authenticateRequest(request);
    const userId = decodedToken.uid;

    const { alertId, status } = (await request.json()) as {
      alertId: string;
      status: AlertStatus;
    };

    if (!alertId || !status) {
      return NextResponse.json(
        { success: false, error: 'alertId and status are required.' },
        { status: 400 }
      );
    }

    const updated = await updateAlertStatus(userId, alertId, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Alert not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update alert.' }, { status: 500 });
  }
}
