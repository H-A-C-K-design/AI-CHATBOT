'use client';

// ============================================================
// Agent Task Viewer Component
// Visualizes: Understand → Plan/Reason → Collaborate → Use Tools → Manage Context
// ============================================================
import React, { useState } from 'react';
import type { AgentExecutionState, AgentTaskStage } from '@/types/agent';

interface AgentTaskViewerProps {
  executionState: AgentExecutionState;
  isExecuting?: boolean;
}

export function AgentTaskViewer({ executionState, isExecuting = false }: AgentTaskViewerProps) {
  const [activeTab, setActiveTab] = useState<AgentTaskStage | 'all'>('understand');
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    currentStage,
    stageProgress,
    understanding,
    plan,
    collaborationLogs,
    toolCalls,
    workingMemory,
    totalExecutionTimeMs,
  } = executionState;

  const stageOrder: Array<{ id: AgentTaskStage; label: string; icon: string; stepNumber: number }> = [
    { id: 'understand', label: 'Understand', icon: '🔍', stepNumber: 1 },
    { id: 'plan', label: 'Plan & Reason', icon: '📋', stepNumber: 2 },
    { id: 'collaborate', label: 'Collaborate', icon: '🤝', stepNumber: 3 },
    { id: 'use_tools', label: 'Use Tools', icon: '⚙️', stepNumber: 4 },
    { id: 'manage_context', label: 'Manage Context', icon: '🧠', stepNumber: 5 },
  ];

  const getStageStatus = (stageId: AgentTaskStage) => {
    const stageIndex = stageOrder.findIndex((s) => s.id === stageId);
    const currentIndex = stageOrder.findIndex((s) => s.id === currentStage);

    if (currentStage === 'complete') return 'completed';
    if (stageId === currentStage) return 'active';
    if (stageIndex < currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="agent-task-card">
      {/* Top Header */}
      <div className="agent-task-header">
        <div className="agent-task-header-left">
          <div className="agent-glow-badge">
            <span className="agent-pulse-ring" />
            <span className="agent-badge-icon">⚡</span>
            <span className="agent-badge-title">Cognitive Agent Engine</span>
          </div>

          <span className="agent-current-stage-tag">
            {currentStage === 'complete' ? (
              <span className="stage-tag-complete">✓ Execution Verified</span>
            ) : isExecuting ? (
              <span className="stage-tag-running">
                <span className="spinner-mini" /> Stage: {currentStage.toUpperCase()}
              </span>
            ) : (
              <span>Ready</span>
            )}
          </span>

          {totalExecutionTimeMs > 0 && (
            <span className="agent-duration-tag">{(totalExecutionTimeMs / 1000).toFixed(2)}s</span>
          )}
        </div>

        <div className="agent-task-header-right">
          <button
            type="button"
            className="agent-toggle-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse agent insights' : 'Expand agent insights'}
          >
            <span>{isExpanded ? 'Hide Pipeline' : 'Inspect Pipeline'}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className={`agent-chevron ${isExpanded ? 'chevron-rotated' : ''}`}
            >
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="agent-progress-bar-wrap">
        <div
          className="agent-progress-bar-fill"
          style={{ width: `${Math.max(stageProgress, 8)}%` }}
        />
      </div>

      {/* 5-Stage Stepper Tabs */}
      <div className="agent-stepper-bar">
        {stageOrder.map((st) => {
          const status = getStageStatus(st.id);
          const isSelected = activeTab === st.id;

          return (
            <button
              key={st.id}
              type="button"
              className={`agent-step-btn ${status === 'active' ? 'step-active' : ''} ${
                status === 'completed' ? 'step-completed' : ''
              } ${isSelected ? 'step-selected' : ''}`}
              onClick={() => {
                setActiveTab(st.id);
                setIsExpanded(true);
              }}
            >
              <div className="step-btn-badge">
                {status === 'completed' ? (
                  <span className="step-check">✓</span>
                ) : (
                  <span className="step-num">{st.stepNumber}</span>
                )}
              </div>
              <span className="step-btn-label">{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Stage Panels */}
      {isExpanded && (
        <div className="agent-stage-body">
          {/* 1. UNDERSTAND TAB */}
          {activeTab === 'understand' && (
            <div className="agent-panel agent-understand-panel">
              <div className="panel-section-title">
                <span className="panel-title-icon">🔍</span>
                <span>Stage 1: Intent Deconstruction &amp; Task Comprehension</span>
              </div>

              {understanding ? (
                <div className="understand-grid">
                  <div className="understand-card">
                    <span className="card-label">Core Goal</span>
                    <p className="card-value-highlight">{understanding.coreGoal}</p>
                  </div>

                  <div className="understand-meta-row">
                    <div className="meta-pill">
                      <span className="meta-label">Domain:</span>
                      <span className="meta-value">{understanding.domainLabel}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-label">Complexity:</span>
                      <span className={`meta-badge badge-${understanding.complexityLevel.toLowerCase()}`}>
                        {understanding.complexityScore}/10 ({understanding.complexityLevel})
                      </span>
                    </div>
                    <div className="meta-pill">
                      <span className="meta-label">Est. Steps:</span>
                      <span className="meta-value">{understanding.estimatedStepsCount} Milestones</span>
                    </div>
                  </div>

                  <div className="understand-subsections">
                    <div className="sub-block">
                      <span className="sub-block-title">Detected Tech Stack &amp; Tools:</span>
                      <div className="tech-stack-pills">
                        {understanding.detectedTechStack.map((tech, i) => (
                          <span key={i} className="tech-pill">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="sub-block">
                      <span className="sub-block-title">Explicit Requirements:</span>
                      <ul className="req-list">
                        {understanding.explicitRequirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="sub-block">
                      <span className="sub-block-title">Execution Strategy:</span>
                      <p className="strategy-text">{understanding.recommendedStrategy}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel-empty-state">
                  <span className="spinner-mini" />
                  <span>Analyzing prompt &amp; extracting task boundaries...</span>
                </div>
              )}
            </div>
          )}

          {/* 2. PLAN / REASON TAB */}
          {activeTab === 'plan' && (
            <div className="agent-panel agent-plan-panel">
              <div className="panel-section-title">
                <span className="panel-title-icon">📋</span>
                <span>Stage 2: Multi-Step Execution Plan &amp; Chain of Thought</span>
              </div>

              {plan ? (
                <div className="plan-content">
                  {/* Reasoning & Hypotheses Trace */}
                  <div className="plan-reasoning-trace">
                    <div className="reasoning-trace-header">
                      <span>Reasoning Trace &amp; Architectural Trade-offs</span>
                    </div>
                    <ul className="hypotheses-list">
                      {plan.hypothesesAndTradeoffs.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps Checklist */}
                  <div className="plan-steps-list">
                    {plan.steps.map((step) => {
                      const isStepDone = step.status === 'completed';
                      const isStepRunning = step.status === 'in_progress';

                      return (
                        <div
                          key={step.id}
                          className={`plan-step-item ${isStepDone ? 'step-item-done' : ''} ${
                            isStepRunning ? 'step-item-running' : ''
                          }`}
                        >
                          <div className="step-item-status-icon">
                            {isStepDone ? (
                              '✓'
                            ) : isStepRunning ? (
                              <span className="spinner-mini" />
                            ) : (
                              step.order
                            )}
                          </div>

                          <div className="step-item-body">
                            <div className="step-item-top">
                              <span className="step-item-title">{step.title}</span>
                              <span className="step-specialist-badge">
                                Assigned: {step.assignedSpecialist}
                              </span>
                            </div>
                            <p className="step-item-desc">{step.description}</p>
                            <div className="step-item-criteria">
                              <span className="criteria-label">Verification:</span>
                              <span className="criteria-text">{step.verificationCriteria}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="panel-empty-state">
                  <span className="spinner-mini" />
                  <span>Synthesizing multi-step plan &amp; verification criteria...</span>
                </div>
              )}
            </div>
          )}

          {/* 3. COLLABORATE TAB */}
          {activeTab === 'collaborate' && (
            <div className="agent-panel agent-collaborate-panel">
              <div className="panel-section-title">
                <span className="panel-title-icon">🤝</span>
                <span>Stage 3: Multi-Agent Swarm Collaboration &amp; Peer Reviews</span>
              </div>

              {collaborationLogs && collaborationLogs.length > 0 ? (
                <div className="collab-timeline">
                  {collaborationLogs.map((msg) => (
                    <div key={msg.id} className="collab-card">
                      <div className="collab-header">
                        <div className="collab-agent-avatar">{msg.fromAgent.avatar}</div>
                        <div className="collab-agent-info">
                          <span className="collab-agent-name">{msg.fromAgent.name}</span>
                          <span className="collab-agent-role">{msg.fromAgent.role}</span>
                        </div>
                        <span className={`collab-action-badge action-${msg.action}`}>
                          {msg.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="collab-body">
                        <span className="collab-topic">{msg.title}</span>
                        <p className="collab-message">{msg.content}</p>

                        {msg.critiqueNotes && msg.critiqueNotes.length > 0 && (
                          <div className="collab-critiques">
                            <span className="critiques-label">Review Checklist:</span>
                            <ul>
                              {msg.critiqueNotes.map((note, i) => (
                                <li key={i}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty-state">
                  <span className="spinner-mini" />
                  <span>Conducting multi-agent reviews and code audits...</span>
                </div>
              )}
            </div>
          )}

          {/* 4. USE TOOLS TAB */}
          {activeTab === 'use_tools' && (
            <div className="agent-panel agent-tools-panel">
              <div className="panel-section-title">
                <span className="panel-title-icon">⚙️</span>
                <span>Stage 4: Autonomous Tool Execution Suite</span>
              </div>

              {toolCalls && toolCalls.length > 0 ? (
                <div className="tools-grid">
                  {toolCalls.map((tool) => (
                    <div key={tool.id} className="tool-card">
                      <div className="tool-card-header">
                        <div className="tool-name-wrap">
                          <span className="tool-icon">⚡</span>
                          <span className="tool-title">{tool.toolLabel}</span>
                        </div>
                        <div className="tool-meta-tags">
                          <span className={`tool-status-badge status-${tool.status}`}>
                            {tool.status === 'success' ? '✓ Success' : tool.status}
                          </span>
                          <span className="tool-time">{tool.durationMs}ms</span>
                        </div>
                      </div>

                      <div className="tool-reflection-box">
                        <span className="reflection-title">Tool Reflection:</span>
                        <p className="reflection-text">{tool.reflectionNote}</p>
                      </div>

                      {tool.outputResult && (
                        <details className="tool-data-details">
                          <summary>Inspect Tool Output Payload</summary>
                          <pre className="tool-json-viewer">
                            {JSON.stringify(tool.outputResult, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-empty-state">
                  <span className="spinner-mini" />
                  <span>Executing specialized tools (Sandbox, Search, RAG, Calculator)...</span>
                </div>
              )}
            </div>
          )}

          {/* 5. MANAGE CONTEXT TAB */}
          {activeTab === 'manage_context' && (
            <div className="agent-panel agent-context-panel">
              <div className="panel-section-title">
                <span className="panel-title-icon">🧠</span>
                <span>Stage 5: Episodic Working Memory &amp; Context Compaction</span>
              </div>

              {workingMemory ? (
                <div className="memory-content">
                  {/* Token Budget Gauge */}
                  <div className="token-budget-card">
                    <div className="budget-top">
                      <span className="budget-title">Token Budget &amp; Context Compression</span>
                      <span className="budget-ratio">
                        Ratio: {workingMemory.tokenBudget.compressionRatio}
                      </span>
                    </div>
                    <div className="budget-gauge-bar">
                      <div
                        className="budget-gauge-fill"
                        style={{
                          width: `${Math.min(
                            (workingMemory.tokenBudget.usedTokens /
                              workingMemory.tokenBudget.maxTokens) *
                              100 *
                              15,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="budget-stats">
                      <span>Used: ~{workingMemory.tokenBudget.usedTokens} tokens</span>
                      <span>Max Window: {workingMemory.tokenBudget.maxTokens.toLocaleString()} tokens</span>
                    </div>
                  </div>

                  {/* Stored Facts */}
                  {workingMemory.storedFacts.length > 0 && (
                    <div className="memory-facts-section">
                      <span className="facts-header-title">
                        Extracted Working Facts ({workingMemory.storedFacts.length}):
                      </span>
                      <div className="facts-list">
                        {workingMemory.storedFacts.map((fact, idx) => (
                          <div key={idx} className="fact-item">
                            <div className="fact-item-top">
                              <span className="fact-key">{fact.key}</span>
                              <span className="fact-confidence">
                                {Math.round(fact.confidence * 100)}% Confidence
                              </span>
                            </div>
                            <p className="fact-val">{fact.value}</p>
                            <span className="fact-source">Source: {fact.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compact Summary */}
                  {workingMemory.compressedSummary && (
                    <div className="compressed-summary-box">
                      <span className="summary-title">Compacted Memory Snapshot:</span>
                      <p className="summary-code">{workingMemory.compressedSummary}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="panel-empty-state">
                  <span className="spinner-mini" />
                  <span>Compacting memory &amp; state snapshot...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
