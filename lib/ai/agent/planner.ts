// ============================================================
// Stage 2: PLAN / REASON — Multi-Step Execution Planning
// Generates Discrete Steps, Chain-of-Thought & Verification Criteria
// ============================================================
import type { AgentTaskUnderstanding, AgentPlan, AgentPlanStep } from '@/types/agent';

export function createExecutionPlan(
  understanding: AgentTaskUnderstanding,
  userPrompt: string
): AgentPlan {
  const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const domain = understanding.domain;

  const hypothesesAndTradeoffs: string[] = [
    `Hypothesis 1: Modular architecture minimizes coupling and enables independent unit verification.`,
    `Trade-off: Prioritizing strict type safety & defense in depth adds minimal code verbosity but guarantees zero runtime exceptions.`,
  ];

  let steps: AgentPlanStep[] = [];

  if (domain === 'security_audit') {
    hypothesesAndTradeoffs.push(
      'Threat Model: Untrusted user input presents potential injection & authorization bypass risks.'
    );
    steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'Vulnerability Surface Analysis',
        description: 'Scan code and architectural inputs for OWASP Top 10 vulnerabilities, auth bypass, and data leaks.',
        assignedSpecialist: 'Sentinel Shield',
        specialistId: 'security-critic',
        expectedOutput: 'Categorized threat matrix with severity rankings.',
        verificationCriteria: 'Zero unaddressed high-risk CVE/OWASP vectors.',
        riskOrFallback: 'Fallback to defensive parameter validation and strict schema enforcement.',
        status: 'pending',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Remediation & Hardened Implementation',
        description: 'Synthesize secure, production-hardened code snippets addressing each identified vulnerability.',
        assignedSpecialist: 'Syntax Titan',
        specialistId: 'code-engineer',
        expectedOutput: 'Full typed source code with defensive guards.',
        verificationCriteria: 'All inputs sanitized and validated via Zod/Pydantic schemas.',
        status: 'pending',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Security Unit Testing & Policy Verification',
        description: 'Formulate exploit test cases to verify the fix holds against malicious payload variations.',
        assignedSpecialist: 'Sentinel Shield',
        specialistId: 'security-critic',
        expectedOutput: 'Executable test suite asserting exploit rejections.',
        verificationCriteria: '100% exploit simulation rejection rate.',
        status: 'pending',
      },
    ];
  } else if (domain === 'intelligence_research') {
    hypothesesAndTradeoffs.push(
      'Information Grounding: Multi-source aggregation from arXiv, OpenAlex, and patents provides highest factual confidence.'
    );
    steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'Multi-Source Knowledge & Patent Retrieval',
        description: 'Execute targeted search across scientific literature, patent databases, and real-time intelligence feeds.',
        assignedSpecialist: 'Data Oracle',
        specialistId: 'research-analyst',
        expectedOutput: 'Curated list of verified papers, patent citations, and trends.',
        verificationCriteria: 'Every cited claim backed by a real identifier / URL.',
        status: 'pending',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Comparative Trend & Anomaly Synthesis',
        description: 'Analyze publication velocity, technological differentiators, and competitive movements.',
        assignedSpecialist: 'Lead Orchestrator',
        specialistId: 'lead-orchestrator',
        expectedOutput: 'Structured comparative analysis with actionable strategic takeaways.',
        verificationCriteria: 'Clear distinction between verified facts and future projections.',
        status: 'pending',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Executive Report & Source Citation Assembly',
        description: 'Format the intelligence brief with executive summary, impact scores, and clickable reference links.',
        assignedSpecialist: 'Data Oracle',
        specialistId: 'research-analyst',
        expectedOutput: 'Markdown intelligence dossier with clickable source links.',
        verificationCriteria: 'Clean markdown structure adhering to enterprise research standards.',
        status: 'pending',
      },
    ];
  } else if (domain === 'algorithm_math') {
    hypothesesAndTradeoffs.push(
      'Algorithmic Correctness: Establishing loop invariants and boundary preconditions prevents off-by-one errors.'
    );
    steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'Mathematical Formalization & Complexity Bounds',
        description: 'Derive theoretical upper bounds (Big-O time and space) and formulate algorithm invariants.',
        assignedSpecialist: 'Lead Orchestrator',
        specialistId: 'lead-orchestrator',
        expectedOutput: 'Formal complexity bounds and inductive correctness proof.',
        verificationCriteria: 'Optimal time/space asymptotic bound verified.',
        status: 'pending',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Optimal Implementation with Edge Guarding',
        description: 'Implement the algorithm in clean, idiomatic code with typed interfaces and zero memory leaks.',
        assignedSpecialist: 'Syntax Titan',
        specialistId: 'code-engineer',
        expectedOutput: 'Complete algorithm code with inline invariant annotations.',
        verificationCriteria: 'Handles empty collections, negative bounds, and overflow cases.',
        status: 'pending',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Execution Simulation & Property-Based Verification',
        description: 'Run unit test simulations with diverse test fixtures and benchmark assertions.',
        assignedSpecialist: 'Sentinel Shield',
        specialistId: 'security-critic',
        expectedOutput: 'Automated test suite with property assertions.',
        verificationCriteria: 'All assertion cases evaluate true.',
        status: 'pending',
      },
    ];
  } else if (domain === 'system_architecture') {
    hypothesesAndTradeoffs.push(
      'System Resilience: Decoupling state through event streaming enables horizontal scalability.'
    );
    steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'System Boundary & Component Topology Design',
        description: 'Model service components, API contracts, persistence layers, and inter-service communication protocols.',
        assignedSpecialist: 'Lead Orchestrator',
        specialistId: 'lead-orchestrator',
        expectedOutput: 'System topology diagram and component responsibility matrix.',
        verificationCriteria: 'No single point of failure (SPOF) in the primary request path.',
        status: 'pending',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Production Component Implementation',
        description: 'Implement the core service classes, database connections, and middleware with resilient error recovery.',
        assignedSpecialist: 'Syntax Titan',
        specialistId: 'code-engineer',
        expectedOutput: 'Production-ready backend service implementation.',
        verificationCriteria: 'Async non-blocking I/O with circuit breaker patterns.',
        status: 'pending',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Reliability & Fault-Tolerance Audit',
        description: 'Evaluate rate limiting, backpressure, failover recovery, and latency degradation paths.',
        assignedSpecialist: 'Sentinel Shield',
        specialistId: 'security-critic',
        expectedOutput: 'Resilience assessment and configuration defaults.',
        verificationCriteria: 'Graceful degradation tested for upstream outage scenarios.',
        status: 'pending',
      },
    ];
  } else {
    // Default Code Engineering & Problem Solving Plan
    steps = [
      {
        id: 'step-1',
        order: 1,
        title: 'Technical Design & Interface Specification',
        description: 'Establish type interfaces, function signatures, and algorithmic strategy.',
        assignedSpecialist: 'Lead Orchestrator',
        specialistId: 'lead-orchestrator',
        expectedOutput: 'TypeScript / Python interfaces and state contract.',
        verificationCriteria: 'Clean contracts with zero missing parameter types.',
        status: 'pending',
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Modular Code Synthesis',
        description: 'Implement production-grade solution with clean separation of concerns and robust error handling.',
        assignedSpecialist: 'Syntax Titan',
        specialistId: 'code-engineer',
        expectedOutput: 'Fully functional, syntax-valid source code.',
        verificationCriteria: 'Executable, idiomatic, and documented with comments.',
        status: 'pending',
      },
      {
        id: 'step-3',
        order: 3,
        title: 'Edge Case Auditing & Test Validation',
        description: 'Validate against boundary inputs, null checks, and provide usage demonstrations.',
        assignedSpecialist: 'Sentinel Shield',
        specialistId: 'security-critic',
        expectedOutput: 'Comprehensive unit tests and practical usage example.',
        verificationCriteria: 'Demonstrates working end-to-end execution without exceptions.',
        status: 'pending',
      },
    ];
  }

  const reasoningSummary = `Structured a ${steps.length}-stage verifiable execution plan tailored for ${understanding.domainLabel}. Each milestone assigns a dedicated specialist agent with strict verification criteria.`;

  return {
    planId,
    goalSummary: understanding.coreGoal,
    hypothesesAndTradeoffs,
    steps,
    activeStepIndex: 0,
    totalEstimatedDurationMs: steps.length * 800,
    reasoningSummary,
  };
}
