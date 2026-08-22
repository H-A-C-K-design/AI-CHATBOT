// ============================================================
// Monitoring Orchestrator — Autonomous Ingestion Pipeline
// Coordinates Collectors, Deduplication, AI Analysis & Storage
// ============================================================
import {
  getProject,
  saveIntelligenceItem,
  updateProjectLastRun,
  saveAIInsight,
  getIntelligenceItems,
} from '@/lib/database/intelligence';
import { fetchArxivResearch } from './collectors/arxiv';
import { fetchOpenAlexResearch } from './collectors/openalex';
import { fetchPatentRecords } from './collectors/patents';
import { fetchIndustryNews } from './collectors/news';
import { analyzeIntelligenceItem, generateStrategicInsights } from './analyzer';
import { evaluateItemAlerts } from './alerts';
import type { MonitoringProject, IntelligenceItem } from '@/types';

export interface MonitoringRunResult {
  success: boolean;
  projectId: string;
  itemsCollected: number;
  newItemsSaved: number;
  alertsCreated: number;
  insightsCreated: number;
  errors: string[];
}

/**
 * Execute a complete monitoring cycle for a project.
 */
export async function runProjectMonitoring(
  userId: string,
  projectId: string
): Promise<MonitoringRunResult> {
  const project = await getProject(userId, projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found or unauthorized.`);
  }

  const errors: string[] = [];
  const newlySavedItems: IntelligenceItem[] = [];
  let alertsCount = 0;

  const projectContext = {
    name: project.name,
    industry: project.industry,
    keywords: project.keywords,
    topics: project.researchTopics,
    competitors: project.competitors,
  };

  // 1. Dispatch to n8n webhook if configured
  if (process.env.N8N_MONITORING_WEBHOOK_URL) {
    try {
      await dispatchToN8n(project);
    } catch (n8nErr) {
      console.warn('[Orchestrator] n8n dispatch note:', (n8nErr as Error).message);
    }
  }

  // 2. Query Real Sources in Parallel
  const [arxivRecords, openAlexRecords, patentRecords, newsRecords] = await Promise.all([
    fetchArxivResearch(project.keywords, project.researchTopics, 6).catch((err) => {
      errors.push(`arXiv collector: ${(err as Error).message}`);
      return [];
    }),
    fetchOpenAlexResearch(project.keywords, project.researchTopics, 6).catch((err) => {
      errors.push(`OpenAlex collector: ${(err as Error).message}`);
      return [];
    }),
    fetchPatentRecords(project.patentKeywords, project.competitors, 6).catch((err) => {
      errors.push(`Patent collector: ${(err as Error).message}`);
      return [];
    }),
    fetchIndustryNews(project.keywords, project.competitors, project.industry, 8).catch((err) => {
      errors.push(`News collector: ${(err as Error).message}`);
      return [];
    }),
  ]);

  const totalRaw =
    arxivRecords.length +
    openAlexRecords.length +
    patentRecords.length +
    newsRecords.length;

  // 3. Process & Store arXiv Research Records in parallel
  await Promise.all(
    arxivRecords.map(async (raw) => {
      try {
        const analysis = await analyzeIntelligenceItem(
          {
            type: 'research',
            title: raw.title,
            description: raw.description,
            sourceName: raw.sourceName,
            sourceUrl: raw.sourceUrl,
            author: raw.author,
            organization: raw.organization,
            keywords: raw.keywords,
          },
          projectContext
        );

        const saved = await saveIntelligenceItem({
          projectId: project.id,
          userId: project.userId,
          type: 'research',
          title: raw.title,
          description: raw.description,
          sourceName: raw.sourceName,
          sourceUrl: raw.sourceUrl,
          publishedAt: raw.publishedAt,
          retrievedAt: new Date().toISOString(),
          author: raw.author,
          organization: raw.organization,
          keywords: raw.keywords,
          topics: raw.topics,
          relevanceScore: analysis.relevanceScore,
          impactScore: analysis.impactScore,
          confidenceScore: analysis.confidenceScore,
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          status: 'verified',
          metadata: {
            arxivId: raw.arxivId,
            doi: raw.doi,
          },
          fingerprint: raw.fingerprint,
        });

        if (saved) {
          newlySavedItems.push(saved);
          const alert = await evaluateItemAlerts(saved, project);
          if (alert) alertsCount++;
        }
      } catch (itemErr) {
        errors.push(`Error saving arXiv item: ${(itemErr as Error).message}`);
      }
    })
  );

  // 4. Process & Store OpenAlex Records in parallel
  await Promise.all(
    openAlexRecords.map(async (raw) => {
      try {
        const analysis = await analyzeIntelligenceItem(
          {
            type: 'research',
            title: raw.title,
            description: raw.description,
            sourceName: raw.sourceName,
            sourceUrl: raw.sourceUrl,
            author: raw.author,
            organization: raw.organization,
            keywords: raw.keywords,
          },
          projectContext
        );

        const saved = await saveIntelligenceItem({
          projectId: project.id,
          userId: project.userId,
          type: 'research',
          title: raw.title,
          description: raw.description,
          sourceName: raw.sourceName,
          sourceUrl: raw.sourceUrl,
          publishedAt: raw.publishedAt,
          retrievedAt: new Date().toISOString(),
          author: raw.author,
          organization: raw.organization,
          keywords: raw.keywords,
          topics: raw.topics,
          relevanceScore: analysis.relevanceScore,
          impactScore: analysis.impactScore,
          confidenceScore: analysis.confidenceScore,
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          status: 'verified',
          metadata: {
            doi: raw.doi,
            citationCount: raw.citationCount,
          },
          fingerprint: raw.fingerprint,
        });

        if (saved) {
          newlySavedItems.push(saved);
          const alert = await evaluateItemAlerts(saved, project);
          if (alert) alertsCount++;
        }
      } catch (itemErr) {
        errors.push(`Error saving OpenAlex item: ${(itemErr as Error).message}`);
      }
    })
  );

  // 5. Process & Store Patent Records in parallel
  await Promise.all(
    patentRecords.map(async (raw) => {
      try {
        const analysis = await analyzeIntelligenceItem(
          {
            type: 'patent',
            title: raw.title,
            description: raw.description,
            sourceName: raw.sourceName,
            sourceUrl: raw.sourceUrl,
            organization: raw.assignee,
            keywords: raw.keywords,
          },
          projectContext
        );

        const saved = await saveIntelligenceItem({
          projectId: project.id,
          userId: project.userId,
          type: 'patent',
          title: raw.title,
          description: raw.description,
          sourceName: raw.sourceName,
          sourceUrl: raw.sourceUrl,
          publishedAt: raw.publishedAt,
          retrievedAt: new Date().toISOString(),
          organization: raw.assignee,
          keywords: raw.keywords,
          topics: [raw.technologyClass],
          relevanceScore: analysis.relevanceScore,
          impactScore: analysis.impactScore,
          confidenceScore: analysis.confidenceScore,
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          status: 'verified',
          metadata: {
            patentId: raw.patentId,
            applicationId: raw.applicationId,
            assignee: raw.assignee,
            technologyClass: raw.technologyClass,
          },
          fingerprint: raw.fingerprint,
        });

        if (saved) {
          newlySavedItems.push(saved);
          const alert = await evaluateItemAlerts(saved, project);
          if (alert) alertsCount++;
        }
      } catch (itemErr) {
        errors.push(`Error saving patent item: ${(itemErr as Error).message}`);
      }
    })
  );

  // 6. Process & Store News / Competitor Records in parallel
  await Promise.all(
    newsRecords.map(async (raw) => {
      try {
        const itemType = raw.isCompetitor ? 'competitor' : 'news';
        const analysis = await analyzeIntelligenceItem(
          {
            type: itemType,
            title: raw.title,
            description: raw.description,
            sourceName: raw.sourceName,
            sourceUrl: raw.sourceUrl,
            organization: raw.organization,
            author: raw.author,
            keywords: raw.keywords,
          },
          projectContext
        );

        const saved = await saveIntelligenceItem({
          projectId: project.id,
          userId: project.userId,
          type: itemType,
          title: raw.title,
          description: raw.description,
          sourceName: raw.sourceName,
          sourceUrl: raw.sourceUrl,
          publishedAt: raw.publishedAt,
          retrievedAt: new Date().toISOString(),
          organization: raw.organization,
          author: raw.author,
          keywords: raw.keywords,
          topics: [raw.topic],
          relevanceScore: analysis.relevanceScore,
          impactScore: analysis.impactScore,
          confidenceScore: analysis.confidenceScore,
          summary: analysis.summary,
          whyItMatters: analysis.whyItMatters,
          status: 'verified',
          metadata: {
            competitorName: raw.competitorName,
            activityType: raw.isCompetitor ? 'news' : undefined,
          },
          fingerprint: raw.fingerprint,
        });

        if (saved) {
          newlySavedItems.push(saved);
          const alert = await evaluateItemAlerts(saved, project);
          if (alert) alertsCount++;
        }
      } catch (itemErr) {
        errors.push(`Error saving news item: ${(itemErr as Error).message}`);
      }
    })
  );

  // 7. Synthesize Strategic AI Insights from newly saved items
  let insightsCount = 0;
  if (newlySavedItems.length > 0) {
    try {
      const insights = await generateStrategicInsights(newlySavedItems, project);
      for (const ins of insights) {
        await saveAIInsight(ins);
        insightsCount++;
      }
    } catch (insErr) {
      errors.push(`Insights error: ${(insErr as Error).message}`);
    }
  }

  // 8. Update Project Last Run & stats
  await updateProjectLastRun(project.id, newlySavedItems.length);

  return {
    success: true,
    projectId: project.id,
    itemsCollected: totalRaw,
    newItemsSaved: newlySavedItems.length,
    alertsCreated: alertsCount,
    insightsCreated: insightsCount,
    errors,
  };
}

/**
 * Send project monitoring task to n8n webhook if configured.
 */
async function dispatchToN8n(project: MonitoringProject): Promise<void> {
  const url = process.env.N8N_MONITORING_WEBHOOK_URL;
  if (!url) return;

  const secret = process.env.N8N_WEBHOOK_SECRET;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) headers['X-Webhook-Secret'] = secret;

  await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event: 'MONITORING_TRIGGER',
      projectId: project.id,
      userId: project.userId,
      projectName: project.name,
      industry: project.industry,
      keywords: project.keywords,
      competitors: project.competitors,
      patentKeywords: project.patentKeywords,
      researchTopics: project.researchTopics,
    }),
  });
}
