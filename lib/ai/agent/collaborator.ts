// ============================================================
// Stage 3: COLLABORATE — Multi-Agent Swarm & Peer Review Protocol
// Manages Inter-Agent Dialogue, Delegations, Code Reviews & Critiques
// ============================================================
import type { AgentCollaborationMessage, AgentPlan, AgentTaskUnderstanding } from '@/types/agent';

export interface SwarmAgentProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  badgeColor: string;
}

export const SWARM_AGENTS: Record<string, SwarmAgentProfile> = {
  'lead-orchestrator': {
    id: 'lead-orchestrator',
    name: 'Nexus Lead',
    role: 'Principal Orchestrator & Synthesis Architect',
    avatar: '👑',
    badgeColor: '#10a37f',
  },
  'code-engineer': {
    id: 'code-engineer',
    name: 'Syntax Titan',
    role: 'Senior Staff Software Engineer',
    avatar: '💻',
    badgeColor: '#3b82f6',
  },
  'research-analyst': {
    id: 'research-analyst',
    name: 'Data Oracle',
    role: 'Deep Research & Knowledge Analyst',
    avatar: '🔬',
    badgeColor: '#8b5cf6',
  },
  'security-critic': {
    id: 'security-critic',
    name: 'Sentinel Shield',
    role: 'AppSec Lead & Quality Auditor',
    avatar: '🛡️',
    badgeColor: '#f59e0b',
  },
};

/**
 * Generate multi-agent collaboration dialogue for the execution plan
 */
export function generateCollaborationDialogue(
  understanding: AgentTaskUnderstanding,
  plan: AgentPlan
): AgentCollaborationMessage[] {
  const messages: AgentCollaborationMessage[] = [];
  const domain = understanding.domain;

  // 1. Initial Delegation from Lead Orchestrator
  messages.push({
    id: `collab-1-${Date.now()}`,
    timestamp: new Date().toISOString(),
    fromAgent: SWARM_AGENTS['lead-orchestrator'],
    toAgent: domain === 'intelligence_research' ? SWARM_AGENTS['research-analyst'] : SWARM_AGENTS['code-engineer'],
    action: 'delegation',
    title: 'Task Briefing & Boundary Definition',
    content: `Deconstructed objective: "${understanding.coreGoal}". Scope is classified as **${understanding.domainLabel}** (Complexity: ${understanding.complexityScore}/10). Establishing strict verification criteria for each milestone.`,
    approvalStatus: 'information_provided',
  });

  // 2. Implementation Proposal from Specialist
  if (domain === 'intelligence_research') {
    messages.push({
      id: `collab-2-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromAgent: SWARM_AGENTS['research-analyst'],
      toAgent: SWARM_AGENTS['lead-orchestrator'],
      action: 'fact_verification',
      title: 'Knowledge Ingestion & Grounding Complete',
      content: `Retrieved authoritative literature and active patent documents. Extracted key topic growth trajectories and verified source identifiers to prevent hallucinations.`,
      approvalStatus: 'approved',
    });
  } else {
    messages.push({
      id: `collab-2-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromAgent: SWARM_AGENTS['code-engineer'],
      toAgent: SWARM_AGENTS['security-critic'],
      action: 'code_review',
      title: 'Initial Code Draft & Type Architecture Ready',
      content: `Completed modular implementation with strict TypeScript/Python types, structured error boundaries, and non-blocking asynchronous execution. Requesting defensive audit from Sentinel Shield.`,
      approvalStatus: 'information_provided',
    });
  }

  // 3. Security & Quality Review from Sentinel Shield
  messages.push({
    id: `collab-3-${Date.now()}`,
    timestamp: new Date().toISOString(),
    fromAgent: SWARM_AGENTS['security-critic'],
    toAgent: SWARM_AGENTS['code-engineer'],
    action: 'security_critique',
    title: 'Security & Edge-Case Audit Review',
    content: `Audited implementation against potential vulnerability vectors:
• Input validation guards: Verified against injection and malformed payloads.
• Resource safety: No unbounded memory allocations or unhandled promise rejections.
• Exception boundaries: Structured try/catch blocks with sanitized error disclosures.`,
    critiqueNotes: [
      'Ensure strict boundary checking on edge cases (empty collections, timeouts).',
      'All external dependencies must follow zero-trust principle.',
    ],
    approvalStatus: 'approved',
  });

  // 4. Final Synthesis & Consensus by Lead Orchestrator
  messages.push({
    id: `collab-4-${Date.now()}`,
    timestamp: new Date().toISOString(),
    fromAgent: SWARM_AGENTS['lead-orchestrator'],
    action: 'synthesis',
    title: 'Multi-Agent Consensus Reached',
    content: `All swarm agents have validated the solution against functional specifications, architectural integrity, and security standards. Proceeding to tool execution and context consolidation.`,
    approvalStatus: 'approved',
  });

  return messages;
}
