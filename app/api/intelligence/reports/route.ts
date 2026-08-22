// ============================================================
// /api/intelligence/reports — Intelligence Reports Generator & List
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import {
  getReports,
  saveReport,
  getProject,
  getProjects,
  getIntelligenceItems,
} from '@/lib/database/intelligence';
import { generateExecutiveReport } from '@/lib/intelligence/analyzer';

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

    const reports = await getReports(userId, projectId);
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load reports.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { projectId, period } = (await request.json().catch(() => ({}))) as {
      projectId?: string;
      period?: string;
    };

    let targetProject = projectId ? await getProject(userId, projectId) : null;
    if (!targetProject) {
      const allProjects = await getProjects(userId);
      targetProject = allProjects[0] || null;
    }

    if (!targetProject) {
      return NextResponse.json(
        { success: false, error: 'Please create a monitoring project first.' },
        { status: 400 }
      );
    }

    const items = await getIntelligenceItems(userId, {
      projectId: targetProject.id,
      limit: 50,
    });

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No intelligence items available for this project. Run monitoring first to collect real data.',
        },
        { status: 400 }
      );
    }

    const generatedReport = await generateExecutiveReport(
      items,
      targetProject,
      period || 'Last 30 Days'
    );
    const saved = await saveReport(generatedReport);

    return NextResponse.json({ success: true, report: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate report.' },
      { status: 500 }
    );
  }
}
