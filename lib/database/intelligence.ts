// ============================================================
// Firestore — Intelligence Data Layer (Server-side Only)
// Strict User-Isolation & Real Database Operations
// ============================================================
import { adminDb } from '@/lib/firebase/admin';
import { analyzeProjectWithGemini } from '@/lib/intelligence/gemini-project-analyzer';
import type {
  MonitoringProject,
  CreateProjectInput,
  UpdateProjectInput,
  IntelligenceItem,
  TrendRecord,
  AIInsight,
  IntelligenceAlert,
  IntelligenceReport,
  IntelligenceOverviewStats,
  IntelligenceType,
  AlertStatus,
  AlertPriority,
  GeminiProjectAnalysis,
} from '@/types';

const PROJECTS_COLLECTION = 'monitoring_projects';
const ITEMS_COLLECTION = 'intelligence_items';
const TRENDS_COLLECTION = 'intelligence_trends';
const INSIGHTS_COLLECTION = 'intelligence_insights';
const ALERTS_COLLECTION = 'intelligence_alerts';
const REPORTS_COLLECTION = 'intelligence_reports';

// Resilient Server-Side Memory Cache for projects
const serverProjectsCache: Map<string, Map<string, MonitoringProject>> = new Map();

function getUserProjectsCache(userId: string): Map<string, MonitoringProject> {
  if (!serverProjectsCache.has(userId)) {
    serverProjectsCache.set(userId, new Map());
  }
  return serverProjectsCache.get(userId)!;
}

// ============================================================
// 1. Projects CRUD
// ============================================================

export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<MonitoringProject> {
  const now = new Date().toISOString();
  const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Autonomously run Gemini project intelligence analysis
  const geminiAnalysis = await analyzeProjectWithGemini(input);

  const project: MonitoringProject = {
    id,
    userId,
    name: input.name.trim(),
    description: input.description.trim(),
    industry: input.industry.trim(),
    keywords: (input.keywords || []).map((k) => k.trim()).filter(Boolean),
    competitors: (input.competitors || []).map((c) => c.trim()).filter(Boolean),
    patentKeywords: (input.patentKeywords || []).map((p) => p.trim()).filter(Boolean),
    researchTopics: (input.researchTopics || []).map((t) => t.trim()).filter(Boolean),
    frequency: input.frequency || 'daily',
    priorityThreshold: input.priorityThreshold ?? 0.7,
    notificationPreferences: {
      email: input.notificationPreferences?.email ?? true,
      inApp: input.notificationPreferences?.inApp ?? true,
      priorityThreshold: input.notificationPreferences?.priorityThreshold ?? 'high',
    },
    status: 'active',
    geminiAnalysis,
    lastRunAt: null,
    itemCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Store in server-side cache
  const cache = getUserProjectsCache(userId);
  cache.set(id, project);

  // 2. Persist to Firestore DB
  try {
    await adminDb.collection(PROJECTS_COLLECTION).doc(id).set(project);
  } catch (error) {
    console.warn('[Firestore] createProject warning:', (error as Error).message);
  }

  return project;
}

export async function getProjects(userId: string): Promise<MonitoringProject[]> {
  const cache = getUserProjectsCache(userId);
  const cachedProjects = Array.from(cache.values());

  try {
    const snapshot = await adminDb
      .collection(PROJECTS_COLLECTION)
      .where('userId', '==', userId)
      .get();

    const dbProjects = snapshot.docs.map((doc) => doc.data() as MonitoringProject);

    // Sync DB projects into cache
    dbProjects.forEach((p) => cache.set(p.id, p));

    const allProjectsMap = new Map<string, MonitoringProject>();
    cachedProjects.forEach((p) => allProjectsMap.set(p.id, p));
    dbProjects.forEach((p) => allProjectsMap.set(p.id, p));

    const combined = Array.from(allProjectsMap.values());

    return combined.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[Firestore] getProjects error (returning cache):', (error as Error).message);
    return cachedProjects.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }
}

export async function getProject(
  userId: string,
  projectId: string
): Promise<MonitoringProject | null> {
  const cache = getUserProjectsCache(userId);
  const cached = cache.get(projectId);
  if (cached) return cached;

  try {
    const doc = await adminDb.collection(PROJECTS_COLLECTION).doc(projectId).get();
    if (!doc.exists) return null;

    const project = doc.data() as MonitoringProject;
    if (project.userId !== userId) return null;

    cache.set(projectId, project);
    return project;
  } catch (error) {
    console.warn('[Firestore] getProject error:', (error as Error).message);
    return null;
  }
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<MonitoringProject | null> {
  const existing = await getProject(userId, projectId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const mergedNotificationPreferences = input.notificationPreferences
    ? {
        ...existing.notificationPreferences,
        ...input.notificationPreferences,
      }
    : existing.notificationPreferences;

  const updates: Partial<MonitoringProject> = {
    ...input,
    notificationPreferences: mergedNotificationPreferences,
    updatedAt: now,
  };

  try {
    await adminDb.collection(PROJECTS_COLLECTION).doc(projectId).update(updates);
  } catch (error) {
    console.warn('[Firestore] updateProject error:', (error as Error).message);
  }

  return {
    ...existing,
    ...updates,
    notificationPreferences: mergedNotificationPreferences,
  };
}

export async function updateProjectLastRun(
  projectId: string,
  itemCountIncrement = 0
): Promise<void> {
  try {
    const docRef = adminDb.collection(PROJECTS_COLLECTION).doc(projectId);
    const doc = await docRef.get();
    if (!doc.exists) return;

    const currentCount = doc.data()?.itemCount || 0;
    await docRef.update({
      lastRunAt: new Date().toISOString(),
      itemCount: currentCount + itemCountIncrement,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Firestore] updateProjectLastRun error:', (error as Error).message);
  }
}

export async function deleteProject(userId: string, projectId: string): Promise<boolean> {
  const existing = await getProject(userId, projectId);
  if (!existing) return false;

  try {
    const batch = adminDb.batch();

    // Delete project doc
    batch.delete(adminDb.collection(PROJECTS_COLLECTION).doc(projectId));

    // Delete associated intelligence items
    const itemsSnapshot = await adminDb
      .collection(ITEMS_COLLECTION)
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .get();
    itemsSnapshot.docs.forEach((d) => batch.delete(d.ref));

    // Delete associated alerts
    const alertsSnapshot = await adminDb
      .collection(ALERTS_COLLECTION)
      .where('projectId', '==', projectId)
      .where('userId', '==', userId)
      .get();
    alertsSnapshot.docs.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return true;
  } catch (error) {
    console.error('[Firestore] deleteProject error:', (error as Error).message);
    return false;
  }
}

// ============================================================
// 2. Intelligence Items CRUD & Deduplication
// ============================================================

export async function checkItemExists(
  userId: string,
  sourceUrl: string,
  fingerprint?: string
): Promise<boolean> {
  try {
    // Check by sourceUrl
    const urlQuery = await adminDb
      .collection(ITEMS_COLLECTION)
      .where('userId', '==', userId)
      .where('sourceUrl', '==', sourceUrl)
      .limit(1)
      .get();

    if (!urlQuery.empty) return true;

    // Check by fingerprint if provided
    if (fingerprint) {
      const fpQuery = await adminDb
        .collection(ITEMS_COLLECTION)
        .where('userId', '==', userId)
        .where('fingerprint', '==', fingerprint)
        .limit(1)
        .get();

      if (!fpQuery.empty) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function saveIntelligenceItem(
  item: Omit<IntelligenceItem, 'id' | 'createdAt' | 'updatedAt'> & {
    fingerprint?: string;
  }
): Promise<IntelligenceItem | null> {
  const isDuplicate = await checkItemExists(item.userId, item.sourceUrl, item.fingerprint);
  if (isDuplicate) {
    return null; // Skip duplicate record
  }

  const now = new Date().toISOString();
  const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const fullItem: IntelligenceItem & { fingerprint?: string } = {
    ...item,
    id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await adminDb.collection(ITEMS_COLLECTION).doc(id).set(fullItem);
    return fullItem;
  } catch (error) {
    console.warn('[Firestore] saveIntelligenceItem error:', (error as Error).message);
    return fullItem;
  }
}

export async function getIntelligenceItems(
  userId: string,
  options?: {
    projectId?: string;
    type?: IntelligenceType;
    topic?: string;
    keyword?: string;
    minRelevance?: number;
    searchQuery?: string;
    limit?: number;
  }
): Promise<IntelligenceItem[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection(ITEMS_COLLECTION)
      .where('userId', '==', userId);

    if (options?.projectId) {
      query = query.where('projectId', '==', options.projectId);
    }
    if (options?.type) {
      query = query.where('type', '==', options.type);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((doc) => doc.data() as IntelligenceItem);

    // Apply in-memory filtering for topic, relevance, and search query to avoid compound index requirements
    if (options?.topic) {
      const lowerTopic = options.topic.toLowerCase();
      items = items.filter((item) =>
        item.topics.some((t) => t.toLowerCase().includes(lowerTopic))
      );
    }

    if (options?.keyword) {
      const lowerKw = options.keyword.toLowerCase();
      items = items.filter((item) =>
        item.keywords.some((k) => k.toLowerCase().includes(lowerKw))
      );
    }

    if (options?.minRelevance !== undefined) {
      items = items.filter((item) => item.relevanceScore >= options.minRelevance!);
    }

    if (options?.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.organization?.toLowerCase().includes(q) ||
          item.author?.toLowerCase().includes(q)
      );
    }

    // Sort by publishedAt or createdAt descending
    items.sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.createdAt).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

    if (options?.limit && options.limit > 0) {
      items = items.slice(0, options.limit);
    }

    return items;
  } catch (error) {
    console.warn('[Firestore] getIntelligenceItems error:', (error as Error).message);
    return [];
  }
}

export async function getIntelligenceItem(
  userId: string,
  itemId: string
): Promise<IntelligenceItem | null> {
  try {
    const doc = await adminDb.collection(ITEMS_COLLECTION).doc(itemId).get();
    if (!doc.exists) return null;

    const item = doc.data() as IntelligenceItem;
    if (item.userId !== userId) return null;

    return item;
  } catch (error) {
    console.warn('[Firestore] getIntelligenceItem error:', (error as Error).message);
    return null;
  }
}

// ============================================================
// 3. Dynamic Trend Calculation (Derived from Real DB Records)
// ============================================================

export async function calculateAndGetTrends(
  userId: string,
  projectId?: string
): Promise<TrendRecord[]> {
  const items = await getIntelligenceItems(userId, { projectId, limit: 500 });
  if (items.length === 0) return [];

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Group items by topic
  const topicMap: Record<
    string,
    {
      topic: string;
      category: string;
      recentCount: number;
      previousCount: number;
      totalCount: number;
      publicationCount: number;
      patentCount: number;
      newsCount: number;
      competitorCount: number;
      sampleItemIds: string[];
    }
  > = {};

  for (const item of items) {
    const itemDate = new Date(item.publishedAt || item.createdAt);
    const itemTopics = item.topics && item.topics.length > 0 ? item.topics : ['General Technology'];

    for (const t of itemTopics) {
      const key = t.trim();
      if (!key) continue;

      if (!topicMap[key]) {
        topicMap[key] = {
          topic: key,
          category: item.type === 'patent' ? 'Patents' : item.type === 'research' ? 'Research' : 'Industry',
          recentCount: 0,
          previousCount: 0,
          totalCount: 0,
          publicationCount: 0,
          patentCount: 0,
          newsCount: 0,
          competitorCount: 0,
          sampleItemIds: [],
        };
      }

      topicMap[key].totalCount += 1;
      if (topicMap[key].sampleItemIds.length < 5) {
        topicMap[key].sampleItemIds.push(item.id);
      }

      if (item.type === 'research') topicMap[key].publicationCount += 1;
      if (item.type === 'patent') topicMap[key].patentCount += 1;
      if (item.type === 'news') topicMap[key].newsCount += 1;
      if (item.type === 'competitor') topicMap[key].competitorCount += 1;

      if (itemDate >= fourteenDaysAgo) {
        topicMap[key].recentCount += 1;
      } else if (itemDate >= twentyEightDaysAgo) {
        topicMap[key].previousCount += 1;
      }
    }
  }

  // Calculate trends
  const trends: TrendRecord[] = Object.values(topicMap).map((entry) => {
    let growthRate = 0;
    if (entry.previousCount > 0) {
      growthRate = Math.round(((entry.recentCount - entry.previousCount) / entry.previousCount) * 100);
    } else if (entry.recentCount > 0) {
      growthRate = 100; // New topic
    }

    let status: 'emerging' | 'growing' | 'stable' | 'declining' = 'stable';
    if (entry.previousCount === 0 && entry.recentCount >= 2) {
      status = 'emerging';
    } else if (growthRate >= 30) {
      status = 'growing';
    } else if (growthRate <= -30) {
      status = 'declining';
    }

    return {
      id: `trend-${encodeURIComponent(entry.topic.toLowerCase().replace(/\s+/g, '-'))}`,
      projectId: projectId || 'all',
      userId,
      topic: entry.topic,
      category: entry.category,
      status,
      growthRate,
      itemCount: entry.totalCount,
      publicationCount: entry.publicationCount,
      patentCount: entry.patentCount,
      newsCount: entry.newsCount,
      competitorCount: entry.competitorCount,
      sampleItemIds: entry.sampleItemIds,
      calculatedAt: now.toISOString(),
      period: 'Last 30 Days',
    };
  });

  return trends.sort((a, b) => b.itemCount - a.itemCount);
}

// ============================================================
// 4. AI Insights CRUD
// ============================================================

export async function saveAIInsight(
  insight: Omit<AIInsight, 'id' | 'createdAt'>
): Promise<AIInsight> {
  const now = new Date().toISOString();
  const id = `insight-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const fullInsight: AIInsight = {
    ...insight,
    id,
    createdAt: now,
  };

  try {
    await adminDb.collection(INSIGHTS_COLLECTION).doc(id).set(fullInsight);
  } catch (error) {
    console.warn('[Firestore] saveAIInsight error:', (error as Error).message);
  }

  return fullInsight;
}

export async function getAIInsights(
  userId: string,
  projectId?: string
): Promise<AIInsight[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection(INSIGHTS_COLLECTION)
      .where('userId', '==', userId);

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    const snapshot = await query.get();
    const insights = snapshot.docs.map((doc) => doc.data() as AIInsight);

    return insights.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[Firestore] getAIInsights error:', (error as Error).message);
    return [];
  }
}

// ============================================================
// 5. Intelligence Alerts CRUD
// ============================================================

export async function createAlert(
  alert: Omit<IntelligenceAlert, 'id' | 'createdAt' | 'status'> & {
    status?: AlertStatus;
  }
): Promise<IntelligenceAlert> {
  const now = new Date().toISOString();
  const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const fullAlert: IntelligenceAlert = {
    ...alert,
    id,
    status: alert.status || 'unread',
    createdAt: now,
  };

  try {
    await adminDb.collection(ALERTS_COLLECTION).doc(id).set(fullAlert);
  } catch (error) {
    console.warn('[Firestore] createAlert error:', (error as Error).message);
  }

  return fullAlert;
}

export async function getAlerts(
  userId: string,
  options?: {
    projectId?: string;
    status?: AlertStatus;
    priority?: AlertPriority;
    limit?: number;
  }
): Promise<IntelligenceAlert[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection(ALERTS_COLLECTION)
      .where('userId', '==', userId);

    if (options?.projectId) {
      query = query.where('projectId', '==', options.projectId);
    }
    if (options?.status) {
      query = query.where('status', '==', options.status);
    }

    const snapshot = await query.get();
    let alerts = snapshot.docs.map((doc) => doc.data() as IntelligenceAlert);

    if (options?.priority) {
      alerts = alerts.filter((a) => a.priority === options.priority);
    }

    alerts.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    if (options?.limit && options.limit > 0) {
      alerts = alerts.slice(0, options.limit);
    }

    return alerts;
  } catch (error) {
    console.warn('[Firestore] getAlerts error:', (error as Error).message);
    return [];
  }
}

export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: AlertStatus
): Promise<boolean> {
  try {
    const docRef = adminDb.collection(ALERTS_COLLECTION).doc(alertId);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const alert = doc.data() as IntelligenceAlert;
    if (alert.userId !== userId) return false;

    await docRef.update({ status });
    return true;
  } catch (error) {
    console.warn('[Firestore] updateAlertStatus error:', (error as Error).message);
    return false;
  }
}

// ============================================================
// 6. Intelligence Reports CRUD
// ============================================================

export async function saveReport(
  report: Omit<IntelligenceReport, 'id' | 'createdAt'>
): Promise<IntelligenceReport> {
  const now = new Date().toISOString();
  const id = `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const fullReport: IntelligenceReport = {
    ...report,
    id,
    createdAt: now,
  };

  try {
    await adminDb.collection(REPORTS_COLLECTION).doc(id).set(fullReport);
  } catch (error) {
    console.warn('[Firestore] saveReport error:', (error as Error).message);
  }

  return fullReport;
}

export async function getReports(
  userId: string,
  projectId?: string
): Promise<IntelligenceReport[]> {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collection(REPORTS_COLLECTION)
      .where('userId', '==', userId);

    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    const snapshot = await query.get();
    const reports = snapshot.docs.map((doc) => doc.data() as IntelligenceReport);

    return reports.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.warn('[Firestore] getReports error:', (error as Error).message);
    return [];
  }
}

export async function getReportById(
  userId: string,
  reportId: string
): Promise<IntelligenceReport | null> {
  try {
    const doc = await adminDb.collection(REPORTS_COLLECTION).doc(reportId).get();
    if (!doc.exists) return null;

    const report = doc.data() as IntelligenceReport;
    if (report.userId !== userId) return null;

    return report;
  } catch (error) {
    console.warn('[Firestore] getReportById error:', (error as Error).message);
    return null;
  }
}

// ============================================================
// 7. Dashboard Overview Aggregator
// ============================================================

export async function getIntelligenceOverviewStats(
  userId: string,
  projectId?: string
): Promise<IntelligenceOverviewStats> {
  const projects = await getProjects(userId);
  const items = await getIntelligenceItems(userId, { projectId, limit: 100 });
  const alerts = await getAlerts(userId, { projectId });
  const insights = await getAIInsights(userId, projectId);
  const trends = await calculateAndGetTrends(userId, projectId);

  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const pausedProjects = projects.filter((p) => p.status === 'paused').length;

  const researchCount = items.filter((i) => i.type === 'research').length;
  const patentCount = items.filter((i) => i.type === 'patent').length;
  const competitorCount = items.filter((i) => i.type === 'competitor').length;
  const newsCount = items.filter((i) => i.type === 'news').length;

  const unreadAlerts = alerts.filter((a) => a.status === 'unread');
  const criticalAlerts = unreadAlerts.filter((a) => a.priority === 'critical').length;
  const highAlerts = unreadAlerts.filter((a) => a.priority === 'high').length;

  const highPriorityAlerts = alerts
    .filter((a) => a.priority === 'high' || a.priority === 'critical')
    .slice(0, 5);

  return {
    projects: {
      total: projects.length,
      active: activeProjects,
      paused: pausedProjects,
    },
    activity: {
      totalItems: items.length,
      researchCount,
      patentCount,
      competitorCount,
      newsCount,
      insightsCount: insights.length,
    },
    alerts: {
      totalUnread: unreadAlerts.length,
      criticalCount: criticalAlerts,
      highCount: highAlerts,
    },
    recentItems: items.slice(0, 10),
    highPriorityAlerts,
    topTrends: trends.slice(0, 5),
  };
}
