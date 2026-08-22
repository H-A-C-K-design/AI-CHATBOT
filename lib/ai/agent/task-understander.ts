// ============================================================
// Stage 1: UNDERSTAND — Intent Deconstruction & Task Comprehension
// Extracts Goal, Domain, Tech Stack, Constraints & Ambiguities
// ============================================================
import type { AgentTaskUnderstanding, TaskDomain } from '@/types/agent';

/**
 * Perform deep understanding analysis on the user's task prompt.
 */
export function analyzeAndUnderstandTask(
  prompt: string,
  contextHistory: Array<{ role: string; content: string }> = []
): AgentTaskUnderstanding {
  const text = prompt.trim();
  const lower = text.toLowerCase();

  // 1. Detect Domain
  let domain: TaskDomain = 'general_problem_solving';
  let domainLabel = 'General Problem Solving';

  if (
    lower.includes('security') ||
    lower.includes('vulnerability') ||
    lower.includes('owasp') ||
    lower.includes('audit') ||
    lower.includes('xss') ||
    lower.includes('injection') ||
    lower.includes('sanitize') ||
    lower.includes('jwt') ||
    lower.includes('auth') ||
    lower.includes('csrf')
  ) {
    domain = 'security_audit';
    domainLabel = 'Security & AppSec Audit';
  } else if (
    lower.includes('architecture') ||
    lower.includes('microservice') ||
    lower.includes('distributed') ||
    lower.includes('system design') ||
    lower.includes('database schema') ||
    lower.includes('kafka') ||
    lower.includes('redis') ||
    lower.includes('scalab')
  ) {
    domain = 'system_architecture';
    domainLabel = 'System Architecture & Infrastructure';
  } else if (
    lower.includes('algorithm') ||
    lower.includes('proof') ||
    lower.includes('complexity') ||
    lower.includes('dynamic programming') ||
    lower.includes('graph') ||
    lower.includes('math') ||
    lower.includes('tree') ||
    lower.includes('big o') ||
    lower.includes('matrix')
  ) {
    domain = 'algorithm_math';
    domainLabel = 'Algorithms & Mathematical Reasoning';
  } else if (
    lower.includes('patent') ||
    lower.includes('paper') ||
    lower.includes('research') ||
    lower.includes('arxiv') ||
    lower.includes('trend') ||
    lower.includes('competitor') ||
    lower.includes('market') ||
    lower.includes('intelligence')
  ) {
    domain = 'intelligence_research';
    domainLabel = 'Market & Deep Research Intelligence';
  } else if (
    lower.includes('etl') ||
    lower.includes('pipeline') ||
    lower.includes('spark') ||
    lower.includes('sql') ||
    lower.includes('postgres') ||
    lower.includes('transform') ||
    lower.includes('dataset')
  ) {
    domain = 'data_pipeline';
    domainLabel = 'Data Pipeline & Analytics';
  } else if (
    lower.includes('design') ||
    lower.includes('ux') ||
    lower.includes('ui') ||
    lower.includes('product') ||
    lower.includes('landing') ||
    lower.includes('feature idea') ||
    lower.includes('marketing')
  ) {
    domain = 'creative_strategy';
    domainLabel = 'Product & UX Strategy';
  } else if (
    lower.includes('code') ||
    lower.includes('function') ||
    lower.includes('component') ||
    lower.includes('class') ||
    lower.includes('typescript') ||
    lower.includes('python') ||
    lower.includes('react') ||
    lower.includes('api') ||
    lower.includes('refactor') ||
    lower.includes('implement') ||
    lower.includes('bug') ||
    lower.includes('error')
  ) {
    domain = 'code_engineering';
    domainLabel = 'Full-Stack Code Engineering';
  }

  // 2. Extract Tech Stack
  const techStack: string[] = [];
  const techKeywords: Record<string, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    react: 'React.js',
    'next.js': 'Next.js',
    nextjs: 'Next.js',
    node: 'Node.js',
    fastapi: 'FastAPI',
    flask: 'Flask',
    django: 'Django',
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    mongodb: 'MongoDB',
    redis: 'Redis',
    docker: 'Docker',
    graphql: 'GraphQL',
    rest: 'REST API',
    tailwind: 'Tailwind CSS',
    firebase: 'Firebase',
    prisma: 'Prisma ORM',
  };

  for (const [kw, label] of Object.entries(techKeywords)) {
    if (lower.includes(kw)) {
      techStack.push(label);
    }
  }
  if (techStack.length === 0) {
    techStack.push('TypeScript / Python (Idiomatic)');
  }

  // 3. Determine Complexity Score (1-10)
  let score = 3;
  if (text.length > 200) score += 2;
  if (text.length > 500) score += 2;
  if (domain === 'system_architecture' || domain === 'security_audit') score += 2;
  if (domain === 'algorithm_math' || domain === 'intelligence_research') score += 2;
  if (lower.includes('test') || lower.includes('benchmark')) score += 1;
  if (lower.includes('scale') || lower.includes('concurrency')) score += 1;
  score = Math.min(Math.max(score, 2), 10);

  let complexityLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (score >= 8) complexityLevel = 'Critical';
  else if (score >= 6) complexityLevel = 'High';
  else if (score >= 4) complexityLevel = 'Medium';

  // 4. Derive Core Goal
  const firstSentence = text.split(/[.\n]/)[0].trim();
  const coreGoal =
    firstSentence.length > 10
      ? firstSentence.replace(/^(please|can you|help me|i want to|i need to)\s+/i, '')
      : text.substring(0, 100);

  // 5. Explicit Requirements
  const explicitRequirements: string[] = [];
  if (text.includes('1.') || text.includes('- ')) {
    const lines = text.split('\n').filter((l) => /^\s*(\d+\.|-|\*)\s+/.test(l));
    lines.slice(0, 5).forEach((l) => {
      explicitRequirements.push(l.replace(/^\s*(\d+\.|-|\*)\s+/, '').trim());
    });
  }
  if (explicitRequirements.length === 0) {
    explicitRequirements.push(`Synthesize a comprehensive solution for: "${coreGoal}"`);
    explicitRequirements.push('Ensure complete type safety, defensive validation, and modular structure.');
    if (domain === 'security_audit' || domain === 'code_engineering') {
      explicitRequirements.push('Include unit test assertions and edge case mitigation.');
    }
  }

  // 6. Implicit Assumptions & Constraints
  const implicitAssumptions = [
    'Solution must adhere to modern production-grade design patterns.',
    'Zero-hallucination policy with verifiable algorithmic correctness.',
    'Asynchronous, non-blocking execution where I/O is involved.',
  ];

  const constraints = [
    'Memory and time complexity should be optimized for scale.',
    'Security-first architecture preventing common injection & leak vectors.',
    'Clean markdown output with typed syntax blocks for instant copyability.',
  ];

  // 7. Ambiguities Identified
  const ambiguitiesIdentified: string[] = [];
  if (!text.includes('version') && !text.includes('v1') && !text.includes('v2')) {
    ambiguitiesIdentified.push('Target runtime environment / framework version (assumed latest stable).');
  }
  if (!text.includes('database') && (lower.includes('store') || lower.includes('save') || lower.includes('persist'))) {
    ambiguitiesIdentified.push('Persistence tier unspecified (assumed transactional cloud database).');
  }
  if (ambiguitiesIdentified.length === 0) {
    ambiguitiesIdentified.push('None critical — problem boundary is well-defined.');
  }

  // 8. Recommended Strategy
  let recommendedStrategy = 'Step-by-step modular decomposition with automated code verification.';
  if (domain === 'security_audit') {
    recommendedStrategy = 'Threat modeling → OWASP Top 10 checklist → Code remediation → Secure pattern synthesis.';
  } else if (domain === 'intelligence_research') {
    recommendedStrategy = 'Multi-source RAG query → Citation cross-verification → Strategic synthesis & trend impact mapping.';
  } else if (domain === 'algorithm_math') {
    recommendedStrategy = 'Mathematical invariants formulation → Complexity analysis → Idiomatic implementation with proof assertions.';
  } else if (domain === 'system_architecture') {
    recommendedStrategy = 'Component topology mapping → Failure mode analysis → High-availability async implementation.';
  }

  const estimatedStepsCount = score >= 7 ? 5 : score >= 4 ? 4 : 3;

  return {
    coreGoal: coreGoal.charAt(0).toUpperCase() + coreGoal.slice(1),
    domain,
    domainLabel,
    complexityScore: score,
    complexityLevel,
    explicitRequirements,
    implicitAssumptions,
    constraints,
    detectedTechStack: techStack,
    ambiguitiesIdentified,
    recommendedStrategy,
    estimatedStepsCount,
  };
}
