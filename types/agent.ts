// ============================================================
// AI Agent Architecture — Cognitive Engine Type Definitions
// Lifecycle: Understand → Plan/Reason → Collaborate → Use Tools → Manage Context
// ============================================================

export type AgentTaskStage =
  | 'idle'
  | 'understand'
  | 'plan'
  | 'collaborate'
  | 'use_tools'
  | 'manage_context'
  | 'complete'
  | 'error';

// ------------------------------------------------------------
// Stage 1: UNDERSTAND
// ------------------------------------------------------------
export type TaskDomain =
  | 'code_engineering'
  | 'system_architecture'
  | 'security_audit'
  | 'intelligence_research'
  | 'algorithm_math'
  | 'data_pipeline'
  | 'creative_strategy'
  | 'general_problem_solving';

export interface AgentTaskUnderstanding {
  coreGoal: string;
  domain: TaskDomain;
  domainLabel: string;
  complexityScore: number; // 1 to 10
  complexityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  explicitRequirements: string[];
  implicitAssumptions: string[];
  constraints: string[];
  detectedTechStack: string[];
  ambiguitiesIdentified: string[];
  recommendedStrategy: string;
  estimatedStepsCount: number;
}

// ------------------------------------------------------------
// Stage 2: PLAN / REASON
// ------------------------------------------------------------
export type PlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface AgentPlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  assignedSpecialist: string; // 'Lead Orchestrator' | 'Code Architect' | 'Data Oracle' | 'Security Sentinel'
  specialistId: string;
  expectedOutput: string;
  verificationCriteria: string;
  riskOrFallback?: string;
  status: PlanStepStatus;
  outputSummary?: string;
  durationMs?: number;
}

export interface AgentPlan {
  planId: string;
  goalSummary: string;
  hypothesesAndTradeoffs: string[];
  steps: AgentPlanStep[];
  activeStepIndex: number;
  totalEstimatedDurationMs: number;
  actualDurationMs?: number;
  reasoningSummary: string;
}

// ------------------------------------------------------------
// Stage 3: COLLABORATE
// ------------------------------------------------------------
export type CollaborationAction =
  | 'delegation'
  | 'code_review'
  | 'security_critique'
  | 'fact_verification'
  | 'synthesis'
  | 'human_clarification';

export interface AgentCollaborationMessage {
  id: string;
  timestamp: string;
  fromAgent: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    badgeColor: string;
  };
  toAgent?: {
    id: string;
    name: string;
    role: string;
  };
  action: CollaborationAction;
  title: string;
  content: string;
  critiqueNotes?: string[];
  approvalStatus?: 'approved' | 'changes_requested' | 'information_provided';
}

// ------------------------------------------------------------
// Stage 4: USE TOOLS
// ------------------------------------------------------------
export type ToolName =
  | 'web_search'
  | 'code_sandbox_eval'
  | 'knowledge_retriever'
  | 'calculator_engine'
  | 'system_inspector'
  | 'workflow_dispatcher'
  | 'analyze_research_paper';

export type ToolStatus = 'running' | 'success' | 'failed';

export interface AgentToolDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  execute: (args: Record<string, unknown>) => Promise<AgentToolResult>;
}

export interface AgentToolResult {
  toolId: string;
  toolName: string;
  success: boolean;
  executionTimeMs: number;
  outputData: Record<string, unknown> | null;
  errorMessage?: string;
  summaryText: string;
}

export interface AgentToolCallRecord {
  id: string;
  toolName: ToolName;
  toolLabel: string;
  inputParams: Record<string, unknown>;
  outputResult?: Record<string, unknown> | string | number | boolean;
  status: ToolStatus;
  durationMs: number;
  errorMessage?: string;
  reflectionNote: string; // Agent's evaluation of how this tool output helps the task
}

// ------------------------------------------------------------
// Stage 5: MANAGE CONTEXT
// ------------------------------------------------------------
export interface ExtractedFact {
  key: string;
  value: string;
  confidence: number;
  source: string;
}

export interface GeneratedArtifact {
  id: string;
  name: string;
  type: 'code' | 'schema' | 'document' | 'diff' | 'config';
  language?: string;
  content: string;
  description: string;
}

export interface AgentWorkingMemory {
  storedFacts: ExtractedFact[];
  artifacts: GeneratedArtifact[];
  stateVariables: Record<string, unknown>;
  activeHypotheses: string[];
  compressedSummary: string;
  tokenBudget: {
    maxTokens: number;
    usedTokens: number;
    compressionRatio: string;
  };
}

// ------------------------------------------------------------
// Unified Agent Execution State & SSE Stream Schema
// ------------------------------------------------------------
export interface AgentExecutionState {
  taskId: string;
  currentStage: AgentTaskStage;
  stageProgress: number; // 0 to 100
  understanding?: AgentTaskUnderstanding;
  plan?: AgentPlan;
  collaborationLogs: AgentCollaborationMessage[];
  toolCalls: AgentToolCallRecord[];
  workingMemory: AgentWorkingMemory;
  finalSolutionMarkdown: string;
  totalExecutionTimeMs: number;
  error?: string;
}

export type AgentStreamEventType =
  | 'stage_change'
  | 'understand_complete'
  | 'plan_created'
  | 'step_start'
  | 'step_complete'
  | 'collaborate_event'
  | 'tool_start'
  | 'tool_complete'
  | 'memory_updated'
  | 'final_token'
  | 'agent_done'
  | 'agent_error';

export interface AgentStreamChunk {
  type: AgentStreamEventType;
  stage?: AgentTaskStage;
  progress?: number;
  data?: {
    understanding?: AgentTaskUnderstanding;
    plan?: AgentPlan;
    step?: AgentPlanStep;
    collaboration?: AgentCollaborationMessage;
    toolCall?: AgentToolCallRecord;
    memory?: AgentWorkingMemory;
    token?: string;
    fullSolution?: string;
    executionState?: AgentExecutionState;
    errorMessage?: string;
  };
}
