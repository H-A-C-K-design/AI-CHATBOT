// ============================================================
// Master Tool Registry & Autonomous Tool Dispatcher
// Automatically Selects & Executes Tools for the Active Task
// ============================================================
import type { AgentTaskUnderstanding, AgentPlan, AgentToolCallRecord, ToolName } from '@/types/agent';
import { executeWebSearch } from './web-search';
import { executeCodeSandbox } from './code-sandbox';
import { executeKnowledgeRetriever } from './knowledge-retriever';
import { executeCalculator } from './calculator';
import { executeSystemInspector } from './system-inspector';
import { executeWorkflowDispatcher } from './workflow-dispatcher';

export interface ToolDefinition {
  name: ToolName;
  label: string;
  description: string;
  category: 'search' | 'evaluation' | 'data' | 'math' | 'system' | 'automation';
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'web_search',
    label: 'Web & Tech Docs Search',
    description: 'Searches online documentation, latest framework guides, and security advisories.',
    category: 'search',
  },
  {
    name: 'code_sandbox_eval',
    label: 'Code Sandbox & Test Runner',
    description: 'Executes static analysis, syntax validation, and simulated unit tests.',
    category: 'evaluation',
  },
  {
    name: 'knowledge_retriever',
    label: 'Knowledge & RAG Intelligence',
    description: 'Retrieves verified Firestore intelligence items, patent records, and arXiv research.',
    category: 'data',
  },
  {
    name: 'calculator_engine',
    label: 'Calculator & Complexity Engine',
    description: 'Calculates mathematical formulas, time/space Big-O bounds, and sizing throughput.',
    category: 'math',
  },
  {
    name: 'system_inspector',
    label: 'System & Architecture Inspector',
    description: 'Inspects topology models, schema contracts, and defensive middleware guards.',
    category: 'system',
  },
  {
    name: 'workflow_dispatcher',
    label: 'Workflow & n8n Automation Engine',
    description: 'Dispatches background automation workflows and webhook micro-events.',
    category: 'automation',
  },
];

/**
 * Determine which tools should be autonomously invoked based on the task domain and plan
 */
export async function executeAppropriateTools(
  understanding: AgentTaskUnderstanding,
  plan: AgentPlan,
  userId: string = 'anonymous',
  intermediateCode?: string
): Promise<AgentToolCallRecord[]> {
  const toolRecords: AgentToolCallRecord[] = [];
  const domain = understanding.domain;

  // 1. Web Search & Documentation Retrieval (Universal Grounding)
  const searchQuery = `${understanding.coreGoal} ${understanding.detectedTechStack[0] || 'TypeScript'}`;
  const searchRecord = await executeWebSearch(searchQuery, 3);
  toolRecords.push(searchRecord);

  // 2. Domain-Specific Secondary Tool Execution
  if (domain === 'intelligence_research') {
    const ragRecord = await executeKnowledgeRetriever(userId, understanding.coreGoal, 4);
    toolRecords.push(ragRecord);
  } else if (domain === 'algorithm_math') {
    const calcRecord = executeCalculator('Math.pow(2, 16) * Math.log2(10000)', 10000);
    toolRecords.push(calcRecord);
  } else if (domain === 'system_architecture') {
    const sysRecord = executeSystemInspector(
      understanding.detectedTechStack[0] || 'ServiceController',
      understanding.detectedTechStack
    );
    toolRecords.push(sysRecord);
  }

  // 3. Code Sandbox Evaluation (For Coding, Security & Architecture Tasks)
  if (
    domain === 'code_engineering' ||
    domain === 'security_audit' ||
    domain === 'system_architecture' ||
    domain === 'algorithm_math' ||
    domain === 'data_pipeline'
  ) {
    const sampleCode =
      intermediateCode ||
      `// Simulated Verification Block\nexport async function verifyHandler<T>(req: T): Promise<boolean> {\n  if (!req) throw new Error('Invalid payload');\n  return true;\n}`;
    const sandboxRecord = await executeCodeSandbox(
      sampleCode,
      understanding.detectedTechStack.includes('Python') ? 'python' : 'typescript',
      3
    );
    toolRecords.push(sandboxRecord);
  }

  // 4. Workflow Dispatcher (For complex pipeline tasks)
  if (understanding.complexityScore >= 7) {
    const wfRecord = await executeWorkflowDispatcher('AGENT_TASK_EXECUTION_AUDIT', {
      goal: understanding.coreGoal,
      domain: understanding.domain,
      score: understanding.complexityScore,
    });
    toolRecords.push(wfRecord);
  }

  return toolRecords;
}
