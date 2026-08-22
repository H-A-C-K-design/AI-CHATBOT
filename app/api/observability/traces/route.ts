// ============================================================
// GET & POST /api/observability/traces
// OpenTelemetry / Langfuse Tracing & Telemetry API
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTraces,
  getObservabilitySummary,
  runControlledFailureAndRecoveryTest,
} from '@/lib/observability/tracer';
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const traces = getAllTraces();
    const summary = getObservabilitySummary();

    return NextResponse.json({
      success: true,
      traces,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const rateResult = checkRateLimit('observability-tracer');

    // Run real controlled failure and auto-recovery run
    const newTrace = await runControlledFailureAndRecoveryTest();
    const summary = getObservabilitySummary();

    return NextResponse.json(
      {
        success: true,
        trace: newTrace,
        summary,
        message: 'Controlled tool failure executed, diagnosed, and recovered via fallback successfully.',
      },
      { headers: rateLimitHeaders(rateResult) }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: (error as Error).message } },
      { status: 500 }
    );
  }
}
