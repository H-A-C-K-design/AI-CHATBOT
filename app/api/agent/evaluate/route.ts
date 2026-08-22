// ============================================================
// POST /api/agent/evaluate & GET /api/agent/evaluate
// AI Agent Automated & Human Evaluation Benchmark API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { runCompleteAgentBenchmark, executeScenarioRun, BENCHMARK_SCENARIOS } from '@/lib/ai/agent/evaluator';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';
import type { AgentBenchmarkReport } from '@/types/evaluation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resilient in-memory cache for latest benchmark report
let cachedBenchmarkReport: AgentBenchmarkReport | null = null;

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateResult = checkRateLimit('evaluator-service');
    const body = await request.json().catch(() => ({}));
    const scenarioId = body?.scenarioId as string | undefined;

    if (scenarioId) {
      const scenario = BENCHMARK_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json(
          { success: false, error: { message: `Scenario ${scenarioId} not found.` } },
          { status: 404 }
        );
      }
      const singleResult = await executeScenarioRun(scenario, 1);
      return NextResponse.json({ success: true, result: singleResult });
    }

    // Run Full Benchmark Suite
    const report = await runCompleteAgentBenchmark();
    cachedBenchmarkReport = report;

    return NextResponse.json(
      {
        success: true,
        report,
      },
      { headers: rateLimitHeaders(rateResult) }
    );
  } catch (error) {
    console.error('[/api/agent/evaluate] Error:', (error as Error).message);
    return NextResponse.json(
      {
        success: false,
        error: { message: (error as Error).message || 'Evaluation run failed.' },
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  try {
    if (!cachedBenchmarkReport) {
      cachedBenchmarkReport = await runCompleteAgentBenchmark();
    }

    return NextResponse.json({
      success: true,
      report: cachedBenchmarkReport,
      scenariosCount: BENCHMARK_SCENARIOS.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
