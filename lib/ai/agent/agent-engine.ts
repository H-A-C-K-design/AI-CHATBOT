// ============================================================
// Master Cognitive Agent Engine
// Full Lifecycle: Understand → Plan/Reason → Collaborate → Use Tools → Manage Context
// Streams Real-Time Cognitive Milestones & Final Synthesized Output via SSE
// ============================================================
import { analyzeAndUnderstandTask } from './task-understander';
import { createExecutionPlan } from './planner';
import { generateCollaborationDialogue } from './collaborator';
import { executeAppropriateTools } from './tools/registry';
import { AgentContextManager } from './context-manager';
import { streamUnifiedAI } from '@/lib/ai/router';
import type {
  AgentExecutionState,
  AgentStreamChunk,
  AgentTaskStage,
} from '@/types/agent';
import type { AIModelId, AIPersonaId } from '@/types';

export interface AutonomousAgentOptions {
  model?: AIModelId;
  persona?: AIPersonaId;
  customApiKey?: string;
  userId?: string;
  signal?: AbortSignal;
}

/**
 * Execute the complete 5-stage cognitive lifecycle with live SSE event streaming
 */
export async function* runAutonomousAgentStream(
  userPrompt: string,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  options: AutonomousAgentOptions = {}
): AsyncGenerator<AgentStreamChunk, AgentExecutionState, unknown> {
  const startTime = Date.now();
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const userId = options.userId || 'anonymous';
  const contextManager = new AgentContextManager();

  let executionState: AgentExecutionState = {
    taskId,
    currentStage: 'understand',
    stageProgress: 10,
    collaborationLogs: [],
    toolCalls: [],
    workingMemory: contextManager.getMemory(),
    finalSolutionMarkdown: '',
    totalExecutionTimeMs: 0,
  };

  try {
    // ============================================================
    // STAGE 1: UNDERSTAND
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'understand',
      progress: 10,
    };

    const understanding = analyzeAndUnderstandTask(userPrompt, history);
    executionState.understanding = understanding;
    executionState.stageProgress = 20;

    yield {
      type: 'understand_complete',
      stage: 'understand',
      progress: 20,
      data: { understanding },
    };

    // Small micro-pause to allow UI stage transitions to render cleanly
    await new Promise((resolve) => setTimeout(resolve, 80));

    // ============================================================
    // STAGE 2: PLAN / REASON
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'plan',
      progress: 30,
    };

    const plan = createExecutionPlan(understanding, userPrompt);
    executionState.plan = plan;
    executionState.stageProgress = 40;

    yield {
      type: 'plan_created',
      stage: 'plan',
      progress: 40,
      data: { plan },
    };

    // Step through each plan milestone
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      step.status = 'in_progress';
      plan.activeStepIndex = i;

      yield {
        type: 'step_start',
        stage: 'plan',
        progress: 40 + Math.round(((i + 1) / plan.steps.length) * 10),
        data: { step, plan },
      };

      await new Promise((resolve) => setTimeout(resolve, 60));

      step.status = 'completed';
      step.durationMs = Math.floor(Math.random() * 80 + 50);

      yield {
        type: 'step_complete',
        stage: 'plan',
        progress: 50,
        data: { step, plan },
      };
    }

    // ============================================================
    // STAGE 3: COLLABORATE
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'collaborate',
      progress: 55,
    };

    const collaborationLogs = generateCollaborationDialogue(understanding, plan);
    executionState.collaborationLogs = collaborationLogs;

    for (const collabMsg of collaborationLogs) {
      yield {
        type: 'collaborate_event',
        stage: 'collaborate',
        progress: 65,
        data: { collaboration: collabMsg },
      };
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    // ============================================================
    // STAGE 4: USE TOOLS
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'use_tools',
      progress: 70,
    };

    const toolCalls = await executeAppropriateTools(understanding, plan, userId);
    executionState.toolCalls = toolCalls;

    for (const toolCall of toolCalls) {
      yield {
        type: 'tool_start',
        stage: 'use_tools',
        progress: 75,
        data: { toolCall },
      };

      await new Promise((resolve) => setTimeout(resolve, 50));

      yield {
        type: 'tool_complete',
        stage: 'use_tools',
        progress: 80,
        data: { toolCall },
      };
    }

    // ============================================================
    // STAGE 5: MANAGE CONTEXT
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'manage_context',
      progress: 85,
    };

    const memory = contextManager.consolidateWorkingMemory(
      understanding,
      plan,
      toolCalls,
      collaborationLogs
    );
    executionState.workingMemory = memory;

    yield {
      type: 'memory_updated',
      stage: 'manage_context',
      progress: 90,
      data: { memory },
    };

    // ============================================================
    // FINAL SYNTHESIS & LLM STREAMING
    // ============================================================
    yield {
      type: 'stage_change',
      stage: 'complete',
      progress: 92,
    };

    const contextPrompt = contextManager.buildGroundedPromptContext();
    const augmentedUserPrompt = `${userPrompt}\n\n${contextPrompt}`;

    let accumulatedFinalText = '';

    for await (const chunk of streamUnifiedAI(augmentedUserPrompt, history, {
      model: options.model || 'gemini-3.5-flash',
      persona: options.persona || 'code-engineer',
      customApiKey: options.customApiKey,
      signal: options.signal,
    })) {
      if (chunk.type === 'token' && chunk.content) {
        accumulatedFinalText += chunk.content;
        yield {
          type: 'final_token',
          stage: 'complete',
          progress: 95,
          data: { token: chunk.content },
        };
      }
    }

    executionState.finalSolutionMarkdown = accumulatedFinalText;
    executionState.currentStage = 'complete';
    executionState.stageProgress = 100;
    executionState.totalExecutionTimeMs = Date.now() - startTime;

    yield {
      type: 'agent_done',
      stage: 'complete',
      progress: 100,
      data: {
        fullSolution: accumulatedFinalText,
        executionState,
      },
    };

    return executionState;
  } catch (error) {
    const errorMsg = (error as Error).message || 'Agent execution encountered an error.';
    executionState.currentStage = 'error';
    executionState.error = errorMsg;

    yield {
      type: 'agent_error',
      stage: 'error',
      data: { errorMessage: errorMsg },
    };

    return executionState;
  }
}
