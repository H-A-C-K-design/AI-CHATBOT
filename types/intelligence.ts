// ============================================================
// NEXORA AI — Intelligence Module Type Definitions
// ============================================================

export type MonitoringFrequency = 'hourly' | 'six_hourly' | 'daily' | 'weekly';
export type ProjectStatus = 'active' | 'paused';
export type IntelligenceType = 'research' | 'patent' | 'competitor' | 'news' | 'trend' | 'insight';
export type IntelligenceStatus = 'verified' | 'flagged' | 'archived';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'unread' | 'read' | 'archived';
export type TrendStatus = 'emerging' | 'growing' | 'stable' | 'declining';

// --- Monitoring Project ---
export interface MonitoringProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  industry: string;
  keywords: string[];
  competitors: string[];
  patentKeywords: string[];
  researchTopics: string[];
  frequency: MonitoringFrequency;
  priorityThreshold: number; // 0.0 to 1.0 (e.g. 0.7)
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    priorityThreshold: AlertPriority;
  };
  status: ProjectStatus;
  lastRunAt?: string | null;
  itemCount?: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface CreateProjectInput {
  name: string;
  description: string;
  industry: string;
  keywords: string[];
  competitors: string[];
  patentKeywords: string[];
  researchTopics: string[];
  frequency?: MonitoringFrequency;
  priorityThreshold?: number;
  notificationPreferences?: {
    email?: boolean;
    inApp?: boolean;
    priorityThreshold?: AlertPriority;
  };
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  industry?: string;
  keywords?: string[];
  competitors?: string[];
  patentKeywords?: string[];
  researchTopics?: string[];
  frequency?: MonitoringFrequency;
  priorityThreshold?: number;
  notificationPreferences?: {
    email?: boolean;
    inApp?: boolean;
    priorityThreshold?: AlertPriority;
  };
  status?: ProjectStatus;
}

// --- Intelligence Item ---
export interface IntelligenceItem {
  id: string;
  projectId: string;
  userId: string;
  type: IntelligenceType;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string; // ISO string
  retrievedAt: string; // ISO string
  author?: string;
  organization?: string;
  keywords: string[];
  topics: string[];
  relevanceScore: number; // 0.0 to 1.0
  impactScore: number; // 0.0 to 1.0
  confidenceScore: number; // 0.0 to 1.0
  summary: string;
  whyItMatters?: string;
  status: IntelligenceStatus;
  metadata?: {
    patentId?: string;
    applicationId?: string;
    assignee?: string;
    technologyClass?: string;
    arxivId?: string;
    doi?: string;
    competitorName?: string;
    activityType?: 'product' | 'research' | 'patent' | 'news' | 'leadership';
    citationCount?: number;
    scoreDetails?: {
      relevanceExplanation?: string;
      impactExplanation?: string;
      confidenceExplanation?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// --- Historical Trend Record (Computed from real records) ---
export interface TrendRecord {
  id: string;
  projectId: string;
  userId: string;
  topic: string;
  category: string;
  status: TrendStatus;
  growthRate: number; // Percentage, e.g., +45.2%
  itemCount: number;
  publicationCount: number;
  patentCount: number;
  newsCount: number;
  competitorCount: number;
  sampleItemIds: string[];
  calculatedAt: string;
  period: string; // e.g. "Last 30 Days"
}

// --- AI Insight ---
export interface AIInsight {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  whatHappened: string;
  whyItMatters: string;
  potentialOpportunity: string;
  potentialRisk: string;
  recommendedAction: string;
  confidenceScore: number; // 0.0 to 1.0
  supportingSourceIds: string[];
  supportingSources: Array<{
    title: string;
    url: string;
    sourceName: string;
    type?: IntelligenceType;
  }>;
  createdAt: string;
}

// --- Intelligence Alert ---
export interface IntelligenceAlert {
  id: string;
  projectId: string;
  userId: string;
  type:
    | 'high_impact_research'
    | 'new_patent'
    | 'competitor_activity'
    | 'industry_news'
    | 'emerging_trend'
    | 'major_activity_change'
    | 'keyword_match';
  title: string;
  reason: string;
  priority: AlertPriority;
  relatedIntelligenceId?: string;
  sourceUrl?: string;
  sourceName?: string;
  status: AlertStatus;
  createdAt: string;
}

// --- Intelligence Report ---
export interface IntelligenceReport {
  id: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  title: string;
  period: string;
  executiveSummary: string;
  keyResearchDevelopments: string[];
  patentDevelopments: string[];
  competitorActivity: string[];
  industryNews: string[];
  emergingTrends: string[];
  risks: string[];
  opportunities: string[];
  recommendedActions: string[];
  sources: Array<{
    title: string;
    url: string;
    sourceName: string;
  }>;
  createdAt: string;
}

// --- Dashboard Summary Stats ---
export interface IntelligenceOverviewStats {
  projects: {
    total: number;
    active: number;
    paused: number;
  };
  activity: {
    totalItems: number;
    researchCount: number;
    patentCount: number;
    competitorCount: number;
    newsCount: number;
    insightsCount: number;
  };
  alerts: {
    totalUnread: number;
    criticalCount: number;
    highCount: number;
  };
  recentItems: IntelligenceItem[];
  highPriorityAlerts: IntelligenceAlert[];
  topTrends: TrendRecord[];
}
