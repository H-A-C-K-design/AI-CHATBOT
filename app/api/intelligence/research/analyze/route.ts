// ============================================================
// POST /api/intelligence/research/analyze
// Dual-Model (Gemini + OpenAI) Research Paper Analysis Endpoint
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthError } from '@/lib/auth/session';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import { analyzeResearchPaper } from '@/lib/ai/research-analyzer';
import type { ResearchPaperAnalysis, PaperHistoryItem } from '@/types/research-analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-Memory Server Cache for Analyzed Papers
const paperAnalysisCache: Map<string, ResearchPaperAnalysis> = new Map();
const userPaperHistory: Map<string, PaperHistoryItem[]> = new Map();

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 1. Authenticate Request
    let userId = 'anonymous';
    try {
      const decodedToken = await authenticateRequest(request);
      userId = decodedToken.uid;
    } catch (authErr) {
      if (authErr instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: authErr.message } },
          { status: 401 }
        );
      }
    }

    // 2. Rate Limiting Check
    const rateResult = checkRateLimit(userId);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded. Please wait a moment before submitting your next paper.',
          },
        },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    // 3. Parse Request Payload
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const samplePaperId = formData.get('samplePaperId') as string | null;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        body = {
          fileBase64: buffer.toString('base64'),
          fileName: file.name,
          fileType: file.type,
          rawText: buffer.toString('utf-8'),
        };
      } else if (samplePaperId) {
        body = { samplePaperId };
      }
    } else {
      body = await request.json().catch(() => ({}));
    }

    const geminiKey = request.headers.get('x-gemini-api-key') || undefined;
    const openAIKey = request.headers.get('x-openai-api-key') || undefined;

    // 4. Execute Dual-Model Analysis
    const analysis = await analyzeResearchPaper(body, {
      geminiKey,
      openAIKey,
    });

    analysis.userId = userId;

    // 5. Store in Server Cache & User History
    paperAnalysisCache.set(analysis.id, analysis);

    if (!userPaperHistory.has(userId)) {
      userPaperHistory.set(userId, []);
    }
    const historyList = userPaperHistory.get(userId)!;
    historyList.unshift({
      id: analysis.id,
      title: analysis.metadata.title,
      authors: analysis.metadata.authors,
      createdAt: analysis.createdAt,
      consensusScore: analysis.modelComparison.consensusAgreementPercentage,
      fileName: analysis.metadata.fileName,
    });
    if (historyList.length > 20) historyList.pop();

    return NextResponse.json(
      {
        success: true,
        analysis,
      },
      {
        headers: rateLimitHeaders(rateResult),
      }
    );
  } catch (error) {
    const errorMsg = (error as Error).message || 'Failed to analyze research paper.';
    console.error('[/api/intelligence/research/analyze] Error:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: errorMsg,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    let userId = 'anonymous';
    try {
      const decodedToken = await authenticateRequest(request);
      userId = decodedToken.uid;
    } catch {
      // return default/sample history
    }

    const history = userPaperHistory.get(userId) || [];
    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json({ success: true, history: [] });
  }
}
