// ============================================================
// /api/intelligence/insights — AI Strategic Insight Engine
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import {
  getAIInsights,
  saveAIInsight,
  getIntelligenceItems,
  getProject,
  getProjects,
} from '@/lib/database/intelligence';
import { generateStrategicInsights } from '@/lib/intelligence/analyzer';

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

    const insights = await getAIInsights(userId, projectId);
    return NextResponse.json({ success: true, insights });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load insights.' }, { status: 500 });
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

    const { projectId } = await request.json().catch(() => ({}));
    let targetProject = projectId ? await getProject(userId, projectId) : null;

    if (!targetProject) {
      const allProjects = await getProjects(userId);
      targetProject = allProjects[0] || null;
    }

    if (!targetProject) {
      return NextResponse.json(
        { success: false, error: 'No active monitoring projects found.' },
        { status: 400 }
      );
    }

    const items = await getIntelligenceItems(userId, {
      projectId: targetProject.id,
      limit: 30,
    });

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No intelligence records collected yet. Run monitoring first to generate insights.',
        },
        { status: 400 }
      );
    }

    const generated = await generateStrategicInsights(items, targetProject);
    const savedList = [];
    for (const ins of generated) {
      const saved = await saveAIInsight(ins);
      savedList.push(saved);
    }

    return NextResponse.json({ success: true, insights: savedList });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate strategic insights.' },
      { status: 500 }
    );
  }
}
