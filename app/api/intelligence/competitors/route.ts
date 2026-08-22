// ============================================================
// /api/intelligence/competitors — Competitor Watch API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import {
  getProjects,
  getProject,
  updateProject,
  getIntelligenceItems,
} from '@/lib/database/intelligence';

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

    const projects = await getProjects(userId);
    const relevantProjects = projectId
      ? projects.filter((p) => p.id === projectId)
      : projects;

    // Aggregate unique competitors
    const competitorMap: Record<
      string,
      {
        name: string;
        projectIds: string[];
        projectNames: string[];
        researchCount: number;
        patentCount: number;
        newsCount: number;
        latestItem?: {
          title: string;
          date: string;
          sourceUrl: string;
          type: string;
          summary: string;
        };
        items: any[];
      }
    > = {};

    relevantProjects.forEach((proj) => {
      (proj.competitors || []).forEach((comp) => {
        const trimmed = comp.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        if (!competitorMap[key]) {
          competitorMap[key] = {
            name: trimmed,
            projectIds: [proj.id],
            projectNames: [proj.name],
            researchCount: 0,
            patentCount: 0,
            newsCount: 0,
            items: [],
          };
        } else {
          if (!competitorMap[key].projectIds.includes(proj.id)) {
            competitorMap[key].projectIds.push(proj.id);
            competitorMap[key].projectNames.push(proj.name);
          }
        }
      });
    });

    // Fetch actual intelligence items for these competitors
    const allItems = await getIntelligenceItems(userId, { projectId, limit: 300 });

    allItems.forEach((item) => {
      const compName =
        item.metadata?.competitorName ||
        item.organization ||
        item.title;

      Object.keys(competitorMap).forEach((key) => {
        const target = competitorMap[key].name.toLowerCase();
        if (
          compName.toLowerCase().includes(target) ||
          item.title.toLowerCase().includes(target) ||
          item.description.toLowerCase().includes(target)
        ) {
          if (item.type === 'research') competitorMap[key].researchCount += 1;
          if (item.type === 'patent') competitorMap[key].patentCount += 1;
          if (item.type === 'news' || item.type === 'competitor') competitorMap[key].newsCount += 1;

          if (competitorMap[key].items.length < 5) {
            competitorMap[key].items.push(item);
          }

          if (!competitorMap[key].latestItem) {
            competitorMap[key].latestItem = {
              title: item.title,
              date: item.publishedAt,
              sourceUrl: item.sourceUrl,
              type: item.type,
              summary: item.summary,
            };
          }
        }
      });
    });

    const competitors = Object.values(competitorMap);
    return NextResponse.json({ success: true, competitors });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load competitors.' }, { status: 500 });
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

    const { projectId, competitorName } = await request.json();
    if (!projectId || !competitorName || !competitorName.trim()) {
      return NextResponse.json(
        { success: false, error: 'projectId and competitorName are required.' },
        { status: 400 }
      );
    }

    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    const existingCompetitors = project.competitors || [];
    const trimmed = competitorName.trim();
    if (!existingCompetitors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      existingCompetitors.push(trimmed);
      await updateProject(userId, projectId, { competitors: existingCompetitors });
    }

    return NextResponse.json({ success: true, competitors: existingCompetitors });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to add competitor.' }, { status: 500 });
  }
}
