// ============================================================
// Research Paper Analysis — Core Type Definitions & Schemas
// Dual-Model (Gemini + OpenAI) Independent Analysis & Consensus Engine
// ============================================================

export interface PaperMetadata {
  title: string;
  authors: string[];
  publicationYear?: string;
  venueOrJournal?: string;
  arxivId?: string;
  doi?: string;
  totalPages?: number;
  fieldOfStudy?: string;
  fileSizeKb?: number;
  fileName?: string;
}

export interface SectionAnalysis {
  title: string;
  summary: string;
  details: string[];
  keyQuotes?: string[];
  confidenceScore: number; // 0-100
}

export interface QuantitativeResult {
  metricName: string;
  value: string;
  baselineComparison?: string;
  datasetOrBenchmark?: string;
  statisticalSignificance?: string;
}

export interface FactItem {
  id: string;
  category: 'verified_fact' | 'ai_insight' | 'uncertainty_conflict';
  statement: string;
  sourceReference?: string; // e.g. "Section 4.2, Table 1"
  explanation?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ConflictItem {
  field: string;
  geminiStance: string;
  openAIStance: string;
  resolvingEvidence: string;
  finalConclusion: string;
  uncertaintyLevel: 'Low' | 'Moderate' | 'High';
}

export interface ModelIndependentOutput {
  modelName: string;
  executiveSummary: string;
  researchProblem: string;
  objective: string;
  methodology: string;
  keyFindings: string[];
  results: string[];
  innovation: string;
  limitations: string[];
  futureScope: string[];
  references: string[];
  confidenceScore: number;
  processingTimeMs: number;
}

export interface ResearchPaperAnalysis {
  id: string;
  userId: string;
  metadata: PaperMetadata;
  executiveSummary: {
    plainLanguageSummary: string;
    targetAudienceTakeaway: string;
    whyItMatters: string;
    readingTimeMinutes: number;
  };
  researchProblem: {
    coreChallenge: string;
    industryOrScientificGap: string;
    existingShortcomings: string[];
  };
  objective: {
    primaryHypothesis: string;
    targetMilestones: string[];
  };
  methodology: {
    approachOverview: string;
    architectureOrModelDesign: string[];
    datasetsUsed: string[];
    baselineModelsCompared: string[];
    trainingOrExperimentalSetup: string;
  };
  keyFindings: Array<{
    finding: string;
    practicalImpact: string;
    evidence: string;
  }>;
  results: {
    summary: string;
    benchmarks: QuantitativeResult[];
    ablationStudyInsights?: string[];
  };
  innovation: {
    novelContributions: string[];
    keyDifferentiator: string;
  };
  limitations: {
    explicitLimitations: string[];
    practicalConstraints: string[];
  };
  futureScope: {
    recommendedExtensions: string[];
    openResearchQuestions: string[];
  };
  importantReferences: Array<{
    title: string;
    authors?: string;
    year?: string;
    relevanceToThisPaper: string;
  }>;
  classification: {
    verifiedFacts: FactItem[];
    aiInsights: FactItem[];
    uncertainties: FactItem[];
  };
  modelComparison: {
    gemini?: ModelIndependentOutput;
    openAI?: ModelIndependentOutput;
    consensusAgreementPercentage: number;
    discrepancies: ConflictItem[];
    isDualModelVerified: boolean;
  };
  createdAt: string;
}

export interface AnalyzePaperRequest {
  fileBase64?: string;
  fileName?: string;
  fileType?: string;
  rawText?: string;
  samplePaperId?: 'attention' | 'deepseek_r1' | 'lora';
}

export interface PaperHistoryItem {
  id: string;
  title: string;
  authors: string[];
  createdAt: string;
  consensusScore: number;
  fileName?: string;
}
