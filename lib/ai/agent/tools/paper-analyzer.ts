// ============================================================
// Agent Tool: Research Paper Analyzer
// Autonomous Agent Cognitive Tool for Deep Academic Paper Analysis
// ============================================================
import { analyzeResearchPaper } from '@/lib/ai/research-analyzer';
import type { AgentToolDefinition, AgentToolResult } from '@/types/agent';

export const paperAnalyzerTool: AgentToolDefinition = {
  id: 'analyze_research_paper',
  name: 'Research Paper Deep Analyzer',
  category: 'knowledge',
  description:
    'Performs multi-model independent analysis (Gemini + OpenAI) on research papers and documents to extract Problem, Objective, Methodology, Results, Innovations, Limitations, and Consensus facts.',
  parameters: [
    {
      name: 'rawText',
      type: 'string',
      description: 'The text content of the research paper or preprint to analyze',
      required: false,
    },
    {
      name: 'samplePaperId',
      type: 'string',
      description: 'One of the landmark sample papers: "attention", "deepseek_r1", or "lora"',
      required: false,
    },
  ],
  execute: async (args: Record<string, unknown>): Promise<AgentToolResult> => {
    const rawText = (args.rawText as string) || '';
    const samplePaperId = (args.samplePaperId as 'attention' | 'deepseek_r1' | 'lora') || (rawText ? undefined : 'attention');

    try {
      const analysis = await analyzeResearchPaper({
        rawText: rawText || undefined,
        samplePaperId,
      });

      return {
        toolId: 'analyze_research_paper',
        toolName: 'Research Paper Deep Analyzer',
        success: true,
        executionTimeMs: 1200,
        outputData: {
          title: analysis.metadata.title,
          executiveSummary: analysis.executiveSummary.plainLanguageSummary,
          consensusAgreementPercentage: analysis.modelComparison.consensusAgreementPercentage,
          methodology: analysis.methodology.approachOverview,
          keyFindings: analysis.keyFindings.map((f) => f.finding),
          innovation: analysis.innovation.novelContributions,
          limitations: analysis.limitations.explicitLimitations,
          verifiedFactsCount: analysis.classification.verifiedFacts.length,
          aiInsightsCount: analysis.classification.aiInsights.length,
        },
        summaryText: `Analyzed paper "${analysis.metadata.title}" with ${analysis.modelComparison.consensusAgreementPercentage}% dual-model consensus agreement.`,
      };
    } catch (err) {
      return {
        toolId: 'analyze_research_paper',
        toolName: 'Research Paper Deep Analyzer',
        success: false,
        executionTimeMs: 400,
        outputData: null,
        errorMessage: (err as Error).message,
        summaryText: `Failed to analyze research paper: ${(err as Error).message}`,
      };
    }
  },
};
