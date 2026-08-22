// ============================================================
// AI Agent Evaluation & Benchmarking Suite — Type Definitions
// Rigorous Evaluation Framework for Accuracy, Robustness, Groundedness & Failure Recovery
// ============================================================

export type EvaluationScenarioCategory =
  | 'normal'
  | 'ambiguous'
  | 'adversarial'
  | 'contradictory'
  | 'incomplete'
  | 'tool_failure';

export interface EvaluationScenario {
  id: string;
  category: EvaluationScenarioCategory;
  name: string;
  description: string;
  prompt: string;
  context?: string;
  expectedBehavior: {
    shouldSucceed: boolean;
    shouldIdentifyUncertainty: boolean;
    shouldRefuseOrClarify: boolean;
    shouldRecoverFromFailure: boolean;
    keyFactRequirements: string[];
    forbiddenClaims: string[];
  };
}

export interface MetricScore {
  score: number; // 0 to 100
  rating: 'Exceptional' | 'High' | 'Moderate' | 'Low' | 'Critical';
  details: string;
  benchmarkTarget: number;
}

export interface ScenarioExecutionResult {
  scenarioId: string;
  category: EvaluationScenarioCategory;
  name: string;
  prompt: string;
  runIndex: number;
  passed: boolean;
  verdict: 'PASSED' | 'FAILED' | 'DEFENSIVE_REFUSAL_PASSED' | 'RECOVERY_PASSED';
  executionTimeMs: number;
  tokensConsumed: number;
  agentResponse: string;
  metrics: {
    accuracy: number; // 0-100
    taskCompletion: number; // 0-100
    groundedness: number; // 0-100
    hallucinationRate: number; // 0-100 (lower is better)
    uncertaintyIdentified: boolean;
    unsupportedConclusionRefused: boolean;
    failureRecovered: boolean;
    consistencyScore: number; // 0-100
  };
  cognitiveStepsCount: number;
  toolsUsed: string[];
  evaluationNotes: string[];
}

export interface HumanEvaluationRubric {
  clarityAndReadability: number; // 1 to 5
  factualityAndGroundedness: number; // 1 to 5
  helpfulnessAndRelevance: number; // 1 to 5
  contextAwareness: number; // 1 to 5
  failureHandling: number; // 1 to 5
  overallRating: number; // 1 to 5
  evaluatorFeedback?: string;
  evaluatorRole?: string;
}

export interface BaselineComparison {
  dimension: string;
  nexoraScore: number;
  standardBaselineScore: number;
  relativeImprovementPercentage: number;
  significance: 'Statistically Significant' | 'Moderate Advantage' | 'Parity';
}

export interface AgentBenchmarkReport {
  id: string;
  timestamp: string;
  overallScore: number; // 0-100
  overallVerdict: 'EXCELLENT' | 'HIGH_CONFIDENCE' | 'NEEDS_REFINEMENT' | 'FAILED';
  totalScenariosEvaluated: number;
  passedCount: number;
  failedCount: number;
  meanLatencyMs: number;
  totalTokensUsed: number;
  summaryMetrics: {
    accuracy: MetricScore;
    taskCompletion: MetricScore;
    groundedness: MetricScore;
    hallucinationRate: MetricScore;
    reliabilityConsistency: MetricScore;
    robustnessRecovery: MetricScore;
    uncertaintyAwareness: MetricScore;
    resourceEfficiency: MetricScore;
  };
  scenarioResults: ScenarioExecutionResult[];
  baselineComparisons: BaselineComparison[];
  humanScorecard: HumanEvaluationRubric;
}
