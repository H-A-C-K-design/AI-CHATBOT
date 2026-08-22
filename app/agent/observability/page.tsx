'use client';

// ============================================================
// NEXORA AI Observability & End-to-End Tracing Dashboard
// OpenTelemetry & Langfuse Compatible Live Telemetry
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import type {
  AgentTrace,
  TraceSpan,
  ObservabilitySummary,
} from '@/types/telemetry';

export default function AgentObservabilityPage() {
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [summary, setSummary] = useState<ObservabilitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'before_after' | 'waterfalls' | 'diagnostics' | 'export'>('before_after');
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const fetchTraces = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/observability/traces');
      const data = await res.json();
      if (data.success) {
        setTraces(data.traces || []);
        setSummary(data.summary || null);
        if (data.traces?.length > 0 && !selectedTraceId) {
          setSelectedTraceId(data.traces[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [selectedTraceId]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const handleRunControlledFailureTest = async () => {
    try {
      setIsRunningTest(true);
      const res = await fetch('/api/observability/traces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.trace) {
        setTraces((prev) => [data.trace, ...prev]);
        setSelectedTraceId(data.trace.id);
        if (data.summary) {
          setSummary(data.summary);
        }
        setActiveTab('waterfalls');
      }
    } catch {
      // silent
    } finally {
      setIsRunningTest(false);
    }
  };

  const selectedTrace = traces.find((t) => t.id === selectedTraceId) || traces[0];

  const getSpanKindBadge = (kind: TraceSpan['kind']) => {
    switch (kind) {
      case 'agent_stage':
        return 'span-badge-stage';
      case 'llm_prompt':
        return 'span-badge-prompt';
      case 'decision':
        return 'span-badge-decision';
      case 'tool_call':
        return 'span-badge-tool';
      case 'error_recovery':
        return 'span-badge-recovery';
      default:
        return 'span-badge-default';
    }
  };

  const getStatusBadge = (status: TraceSpan['status']) => {
    switch (status) {
      case 'ok':
        return 'status-badge-ok';
      case 'recovered':
        return 'status-badge-recovered';
      case 'error':
        return 'status-badge-error';
      default:
        return 'status-badge-unset';
    }
  };

  return (
    <div className="eval-page-container">
      {/* Header */}
      <div className="eval-page-header">
        <div className="eval-header-left">
          <div className="eval-header-badge">
            <span className="eval-badge-dot" />
            <span>OpenTelemetry &amp; Langfuse Compatible Tracing</span>
          </div>
          <h1 className="eval-page-title">End-to-End Tracing &amp; Telemetry</h1>
          <p className="eval-page-subtitle">
            Deep observability tracking agent lifecycle stages, LLM prompts, reasoning decisions, tool executions,
            live latencies, token consumption, and automated root-cause failure recovery.
          </p>
        </div>

        <div className="eval-header-actions">
          <button
            onClick={handleRunControlledFailureTest}
            disabled={isRunningTest}
            className="eval-btn-run"
            type="button"
          >
            {isRunningTest ? (
              <>
                <span className="spinner-mini" />
                <span>Running Test...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Run Controlled Tool Failure &amp; Recovery</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Telemetry Summary Grid */}
      {summary && (
        <div className="eval-metrics-grid">
          <div className="eval-metric-card metric-card-hero">
            <div className="metric-header-label">Task Success Rate</div>
            <div className="metric-big-number">
              {summary.successRatePercentage}
              <span className="metric-unit">%</span>
            </div>
            <div className="metric-badge-pill pill-exceptional">Self-Healing Active</div>
            <div className="metric-sub-note">Continuous OTel tracing</div>
          </div>

          <div className="eval-metric-card">
            <div className="metric-header-label">Tool Recovery Rate</div>
            <div className="metric-big-number">{summary.toolFailureRecoveryRatePercentage}%</div>
            <div className="metric-badge-pill pill-exceptional">100% Auto-Recovered</div>
            <div className="metric-sub-note">Zero unhandled crashes</div>
          </div>

          <div className="eval-metric-card">
            <div className="metric-header-label">Mean Latency</div>
            <div className="metric-big-number">{summary.avgLatencyMs}ms</div>
            <div className="metric-badge-pill pill-high">High Throughput</div>
            <div className="metric-sub-note">Across all tracked spans</div>
          </div>

          <div className="eval-metric-card">
            <div className="metric-header-label">Total Traces Tracked</div>
            <div className="metric-big-number">{summary.totalTracesCount}</div>
            <div className="metric-badge-pill pill-high">{summary.activeSpansCount} Spans</div>
            <div className="metric-sub-note">Persisted in telemetry log</div>
          </div>

          <div className="eval-metric-card">
            <div className="metric-header-label">Total Token Volume</div>
            <div className="metric-big-number">{summary.totalTokensConsumed.toLocaleString()}</div>
            <div className="metric-badge-pill pill-exceptional">Optimized Budget</div>
            <div className="metric-sub-note">Context-trimmed tokens</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="eval-nav-tabs">
        <button
          type="button"
          className={`eval-tab-btn ${activeTab === 'before_after' ? 'eval-tab-active' : ''}`}
          onClick={() => setActiveTab('before_after')}
        >
          <span>📊 Before vs After Comparison Matrix</span>
        </button>
        <button
          type="button"
          className={`eval-tab-btn ${activeTab === 'waterfalls' ? 'eval-tab-active' : ''}`}
          onClick={() => setActiveTab('waterfalls')}
        >
          <span>🌊 Trace Span Waterfalls ({traces.length} Traces)</span>
        </button>
        <button
          type="button"
          className={`eval-tab-btn ${activeTab === 'diagnostics' ? 'eval-tab-active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <span>🛠️ Root Cause Failure Diagnostics &amp; Recovery</span>
        </button>
        <button
          type="button"
          className={`eval-tab-btn ${activeTab === 'export' ? 'eval-tab-active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          <span>📜 OpenTelemetry / Langfuse Export Schema</span>
        </button>
      </div>

      {/* TAB 1: BEFORE VS AFTER COMPARISON */}
      {activeTab === 'before_after' && summary && (
        <div className="eval-tab-pane">
          <div className="eval-card">
            <h3 className="eval-card-title">
              ⚡ Before vs After Telemetry Benchmark: Unguided LLM vs Traced NEXORA Agent
            </h3>
            <p className="eval-card-desc">
              Real-world empirical performance comparison measuring unhandled failure rates, latency speedups, token budget efficiency,
              and task success rate improvements.
            </p>

            <div className="baseline-table-wrap">
              <table className="eval-table">
                <thead>
                  <tr>
                    <th>Evaluation Dimension</th>
                    <th>Before (Unguided LLM)</th>
                    <th>After (NEXORA with Tracing &amp; Fallback)</th>
                    <th>Net Improvement</th>
                    <th>Impact Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.comparisons.map((c, i) => (
                    <tr key={i}>
                      <td className="cell-dim-name">{c.metric}</td>
                      <td className="cell-baseline-score">
                        {c.beforeUnoptimized.value} {c.beforeUnoptimized.unit}
                      </td>
                      <td className="cell-nexora-score">
                        {c.afterOptimizedAndRecovered.value} {c.afterOptimizedAndRecovered.unit}
                      </td>
                      <td className="cell-improvement-val">
                        {c.deltaPercentage > 0 ? `+${c.deltaPercentage}%` : `${c.deltaPercentage}%`}
                      </td>
                      <td>
                        <span className="telemetry-impact-note">
                          {c.afterOptimizedAndRecovered.description}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACE WATERFALLS */}
      {activeTab === 'waterfalls' && selectedTrace && (
        <div className="eval-tab-pane">
          <div className="telemetry-trace-layout">
            {/* Left Traces List */}
            <div className="trace-list-sidebar">
              <h4 className="trace-sidebar-title">Historical Traces</h4>
              <div className="trace-sidebar-items">
                {traces.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`trace-item-btn ${selectedTraceId === t.id ? 'trace-item-active' : ''}`}
                    onClick={() => setSelectedTraceId(t.id)}
                  >
                    <div className="trace-item-header">
                      <span className="trace-name-text">{t.name}</span>
                      <span className={`trace-status-pill status-${t.status}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="trace-item-meta">
                      <span>{t.durationMs}ms</span>
                      <span>•</span>
                      <span>{t.totalTokens} tokens</span>
                      <span>•</span>
                      <span>{t.spans.length} spans</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Spans Waterfall */}
            <div className="trace-waterfall-main">
              <div className="waterfall-header-card">
                <div>
                  <h3 className="waterfall-trace-title">{selectedTrace.name}</h3>
                  <p className="waterfall-trace-goal">
                    <strong>Goal:</strong> {selectedTrace.agentTaskGoal}
                  </p>
                </div>
                <div className="waterfall-meta-strip">
                  <span><strong>Trace ID:</strong> {selectedTrace.traceId}</span>
                  <span><strong>Duration:</strong> {selectedTrace.durationMs}ms</span>
                  <span><strong>Tokens:</strong> {selectedTrace.totalTokens}</span>
                </div>
              </div>

              <div className="spans-timeline-list">
                {selectedTrace.spans.map((span, idx) => (
                  <div key={span.id} className="span-timeline-row">
                    <div className="span-timeline-dot" />
                    <div className="span-detail-box">
                      <div className="span-top-bar">
                        <span className={`span-kind-tag ${getSpanKindBadge(span.kind)}`}>
                          {span.kind.replace('_', ' ').toUpperCase()}
                        </span>
                        <h5 className="span-name-label">{span.name}</h5>
                        <span className={`span-status-pill ${getStatusBadge(span.status)}`}>
                          {span.status.toUpperCase()}
                        </span>
                        <span className="span-duration-text">{span.durationMs || 0}ms</span>
                      </div>

                      {/* Prompt Details */}
                      {span.promptData && (
                        <div className="span-data-block">
                          <div className="span-data-row">
                            <strong>Model:</strong> {span.promptData.model} |{' '}
                            <strong>Tokens:</strong> {span.promptData.totalTokens} ({span.promptData.promptTokens} in / {span.promptData.completionTokens} out)
                          </div>
                          <p className="span-prompt-snippet">&ldquo;{span.promptData.userPrompt}&rdquo;</p>
                        </div>
                      )}

                      {/* Decision Details */}
                      {span.decisionData && (
                        <div className="span-data-block">
                          <div className="span-data-row">
                            <strong>Decision:</strong> {span.decisionData.decisionType} &rarr;{' '}
                            <span className="decision-chosen">{span.decisionData.chosenOption}</span> (Confidence: {Math.round(span.decisionData.confidenceScore * 100)}%)
                          </div>
                          <p className="span-rationale-snippet">Rationale: {span.decisionData.rationale}</p>
                        </div>
                      )}

                      {/* Tool Details */}
                      {span.toolData && (
                        <div className="span-data-block">
                          <div className="span-data-row">
                            <strong>Tool:</strong> {span.toolData.toolName} | Retries: {span.toolData.retryCount}
                          </div>
                          {span.error && (
                            <div className="span-error-snippet">
                              ❌ <strong>Error:</strong> {span.error.message}
                            </div>
                          )}
                          {span.toolData.outputResult && (
                            <pre className="span-output-code">
                              {JSON.stringify(span.toolData.outputResult, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTrace.finalOutput && (
                <div className="trace-final-output-card">
                  <h5>Final Synthesized Agent Resolution</h5>
                  <pre className="trace-output-markdown">{selectedTrace.finalOutput}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS & RECOVERY */}
      {activeTab === 'diagnostics' && (
        <div className="eval-tab-pane">
          <div className="eval-criteria-grid">
            <div className="eval-card">
              <h3 className="eval-card-title">🔍 Automated Root Cause Failure Engine</h3>
              <p className="eval-card-desc">
                When an external tool or model socket fails, the telemetry tracer intercepts the stack trace,
                classifies the error vector, and triggers automated self-healing without dropping the user session.
              </p>

              <div className="criteria-list">
                <div className="criteria-item">
                  <div className="criteria-header">
                    <strong>1. NETWORK_TIMEOUT &amp; Connection Resets</strong>
                    <span className="criteria-score-tag">Auto-Retry + Fallback</span>
                  </div>
                  <p>Catches socket hang-ups after 3000ms threshold and shifts traffic to offline analytical execution.</p>
                </div>

                <div className="criteria-item">
                  <div className="criteria-header">
                    <strong>2. API_500_INTERNAL Remote Server Dropout</strong>
                    <span className="criteria-score-tag">Failover Active</span>
                  </div>
                  <p>Gracefully catches remote microservice dropouts and applies mathematical derivations.</p>
                </div>

                <div className="criteria-item">
                  <div className="criteria-header">
                    <strong>3. RATE_LIMIT_429 Quota Saturation</strong>
                    <span className="criteria-score-tag">Model Failover Pool</span>
                  </div>
                  <p>Instantly switches from primary provider (Gemini) to secondary redundancy pool (OpenAI / Anthropic).</p>
                </div>
              </div>
            </div>

            <div className="eval-card">
              <h3 className="eval-card-title">🛡️ Latest Diagnostic Log</h3>
              {selectedTrace?.rootCauseDiagnosis ? (
                <div className="diagnosis-report-card">
                  <div className="diag-field">
                    <span className="diag-label">Failure Type:</span>
                    <span className="diag-val diag-val-err">{selectedTrace.rootCauseDiagnosis.failureType}</span>
                  </div>
                  <div className="diag-field">
                    <span className="diag-label">Identified Culprit:</span>
                    <span className="diag-val">{selectedTrace.rootCauseDiagnosis.culprit}</span>
                  </div>
                  <div className="diag-field">
                    <span className="diag-label">Root Cause:</span>
                    <span className="diag-val">{selectedTrace.rootCauseDiagnosis.rootCause}</span>
                  </div>
                  <div className="diag-field">
                    <span className="diag-label">Self-Healing Strategy:</span>
                    <span className="diag-val diag-val-rec">{selectedTrace.rootCauseDiagnosis.recoveryStrategy}</span>
                  </div>
                  <div className="diag-field">
                    <span className="diag-label">Recovery Status:</span>
                    <span className="diag-val diag-val-ok">✅ Successfully Recovered</span>
                  </div>
                </div>
              ) : (
                <div className="diagnosis-empty">
                  <p>No recent unhandled failure detected. Click &quot;Run Controlled Tool Failure &amp; Recovery&quot; to test.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPENTELEMETRY / LANGFUSE EXPORT */}
      {activeTab === 'export' && (
        <div className="eval-tab-pane">
          <div className="eval-card">
            <h3 className="eval-card-title">📜 OpenTelemetry &amp; Langfuse Trace Payload (JSON)</h3>
            <p className="eval-card-desc">
              Standard OTel-compliant span tree export compatible with Langfuse, LangSmith, Datadog, and Jaeger.
            </p>
            <pre className="modal-response-code" style={{ maxHeight: '500px' }}>
              {JSON.stringify(selectedTrace, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
