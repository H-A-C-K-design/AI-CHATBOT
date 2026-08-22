// ============================================================
// /api/intelligence/projects — Monitoring Projects API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { getProjects, createProject } from '@/lib/database/intelligence';
import type { CreateProjectInput } from '@/types';

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

    const projects = await getProjects(userId);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to load projects.' }, { status: 500 });
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

    const body = (await request.json()) as CreateProjectInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required.' },
        { status: 400 }
      );
    }
    if (!body.industry || !body.industry.trim()) {
      return NextResponse.json(
        { success: false, error: 'Industry is required.' },
        { status: 400 }
      );
    }

    const project = await createProject(userId, body);
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create project.' }, { status: 500 });
  }
}
