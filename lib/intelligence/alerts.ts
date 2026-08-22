// ============================================================
// Intelligence Alert Engine — Rule & Threshold Evaluation
// Generates Real Database Alerts (No Fake Alerts)
// ============================================================
import { createAlert } from '@/lib/database/intelligence';
import type {
  IntelligenceItem,
  MonitoringProject,
  IntelligenceAlert,
  AlertPriority,
} from '@/types';

/**
 * Evaluate intelligence items against project alert criteria and create alerts.
 */
export async function evaluateItemAlerts(
  item: IntelligenceItem,
  project: MonitoringProject
): Promise<IntelligenceAlert | null> {
  let shouldAlert = false;
  let alertType: IntelligenceAlert['type'] = 'keyword_match';
  let priority: AlertPriority = 'medium';
  let reason = '';

  // 1. High-Impact Research Check
  if (item.type === 'research' && item.impactScore >= (project.priorityThreshold || 0.75)) {
    shouldAlert = true;
    alertType = 'high_impact_research';
    priority = item.impactScore >= 0.88 ? 'critical' : 'high';
    reason = `High-impact publication detected (Impact Score: ${(item.impactScore * 100).toFixed(0)}%). "${item.title}" from ${item.sourceName}.`;
  }
  // 2. New Patent Filing Check
  else if (item.type === 'patent') {
    shouldAlert = true;
    alertType = 'new_patent';
    priority = item.relevanceScore >= 0.85 ? 'high' : 'medium';
    reason = `New patent record identified for monitored keywords [Assignee: ${item.organization || 'Applicant'}].`;
  }
  // 3. Competitor Activity Check
  else if (item.type === 'competitor') {
    shouldAlert = true;
    alertType = 'competitor_activity';
    priority = 'high';
    reason = `Monitored competitor development reported: "${item.title}".`;
  }
  // 4. High-Impact News Check
  else if (item.type === 'news' && item.impactScore >= 0.8) {
    shouldAlert = true;
    alertType = 'industry_news';
    priority = item.impactScore >= 0.9 ? 'critical' : 'high';
    reason = `Significant industry development with high impact score (${(item.impactScore * 100).toFixed(0)}%).`;
  }
  // 5. Very High Keyword Relevance Match
  else if (item.relevanceScore >= 0.92) {
    shouldAlert = true;
    alertType = 'keyword_match';
    priority = 'medium';
    reason = `Exact keyword match with ${(item.relevanceScore * 100).toFixed(0)}% relevance score.`;
  }

  if (!shouldAlert) return null;

  // Verify against user notification preference threshold
  const thresholdOrder: Record<AlertPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const minThreshold = project.notificationPreferences?.priorityThreshold || 'medium';
  if (thresholdOrder[priority] < thresholdOrder[minThreshold]) {
    // If lower than user's preferred alert threshold, skip creating alert
    return null;
  }

  return createAlert({
    projectId: project.id,
    userId: project.userId,
    type: alertType,
    title: item.title,
    reason,
    priority,
    relatedIntelligenceId: item.id,
    sourceUrl: item.sourceUrl,
    sourceName: item.sourceName,
    status: 'unread',
  });
}
