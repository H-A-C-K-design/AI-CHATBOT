// ============================================================
// NEXORA AI Observability & End-to-End Tracing Type Definitions
// OpenTelemetry & Langfuse Compliant Agent Telemetry Schema
// ============================================================

export type SpanKind =
  | 'agent_stage'
  | 'llm_prompt'
  | 'decision'
  | 'tool_call'
  | 'retrieval'
  | 'error_recovery';

export type SpanStatus = 'unset' | 'ok' | 'error' | 'recovered';

export type ToolFailureType =
  | 'NETWORK_TIMEOUT'
  | 'API_500_INTERNAL'
  | 'RATE_LIMIT_429'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'AUTH_FAILED'
  | 'RESOURCE_NOT_FOUND';

export interface SpanAttributeMap {
  [key: string]: unknown;
}

export interface RootCauseDiagnosis {
  failureType: ToolFailureType;
  rootCause: string;
  culprit: string;
  recommendation: string;
  recoveryStrategy: 'exponential_retry' | 'fallback_tool' | 'analytical_derivation' | 'human_escalation';
  autoRecovered: boolean;
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  kind: SpanKind;
  status: SpanStatus;
  startTime: number; // Unix timestamp in ms
  endTime?: number;
  durationMs?: number;
  attributes: SpanAttributeMap;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, unknown>;
  }>;
  promptData?: {
    model: string;
    temperature?: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    systemPrompt?: string;
    userPrompt: string;
    modelOutput?: string;
  };
  decisionData?: {
    decisionType: string;
    chosenOption: string;
    consideredAlternatives: string[];
    rationale: string;
    confidenceScore: number;
  };
  toolData?: {
    toolName: string;
    inputParams: Record<string, unknown>;
    outputResult?: Record<string, unknown> | string | number | boolean;
    retryCount: number;
    simulatedFailure?: boolean;
    diagnosis?: RootCauseDiagnosis;
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface AgentTrace {
  id: string;
  traceId: string;
  name: string;
  userId: string;
  sessionId?: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  status: 'running' | 'completed' | 'failed' | 'recovered_from_error';
  tags: string[];
  metadata: Record<string, unknown>;
  spans: TraceSpan[];
  totalTokens: number;
  totalCostEstimatedUSD: number;
  agentTaskGoal: string;
  finalOutput?: string;
  failureRecoveryTriggered: boolean;
  rootCauseDiagnosis?: RootCauseDiagnosis;
}

export interface BeforeAfterTelemetryComparison {
  metric: string;
  beforeUnoptimized: {
    value: number | string;
    unit: string;
    description: string;
  };
  afterOptimizedAndRecovered: {
    value: number | string;
    unit: string;
    description: string;
  };
  deltaPercentage: number;
  impactType: 'positive' | 'neutral' | 'negative';
}

export interface ObservabilitySummary {
  totalTracesCount: number;
  successRatePercentage: number;
  avgLatencyMs: number;
  totalTokensConsumed: number;
  toolFailureRecoveryRatePercentage: number;
  activeSpansCount: number;
  comparisons: BeforeAfterTelemetryComparison[];
}
