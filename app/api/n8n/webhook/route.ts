// ============================================================
// POST /api/n8n/webhook — Inbound Webhook for n8n Workflow Ingestion
// Authenticated with X-Webhook-Secret
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { saveIntelligenceItem, getProject } from '@/lib/database/intelligence';
import { generateFingerprint, sanitizeSourceUrl } from '@/lib/intelligence/deduplication';
import { evaluateItemAlerts } from '@/lib/intelligence/alerts';
import type { IntelligenceItem } from '@/types';

export async function POST(request: NextRequest) {
  // 1. Verify Secret Header
  const secretHeader = request.headers.get('X-Webhook-Secret');
  const configuredSecret = process.env.N8N_WEBHOOK_SECRET;

  if (configuredSecret && secretHeader !== configuredSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid X-Webhook-Secret.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [body];

    const savedRecords: IntelligenceItem[] = [];

    for (const raw of items) {
      if (!raw.userId || !raw.projectId || !raw.title || !raw.sourceUrl) {
        continue; // Skip invalid records
      }

      const project = await getProject(raw.userId, raw.projectId);
      if (!project) continue;

      const sourceUrl = sanitizeSourceUrl(raw.sourceUrl);
      if (!sourceUrl) continue;

      const fingerprint = generateFingerprint(sourceUrl, raw.title);

      const saved = await saveIntelligenceItem({
        projectId: raw.projectId,
        userId: raw.userId,
        type: raw.type || 'research',
        title: raw.title,
        description: raw.description || '',
        sourceName: raw.sourceName || 'External Public Source',
        sourceUrl,
        publishedAt: raw.publishedAt || new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        author: raw.author,
        organization: raw.organization,
        keywords: raw.keywords || [],
        topics: raw.topics || [],
        relevanceScore: typeof raw.relevanceScore === 'number' ? raw.relevanceScore : 0.8,
        impactScore: typeof raw.impactScore === 'number' ? raw.impactScore : 0.75,
        confidenceScore: typeof raw.confidenceScore === 'number' ? raw.confidenceScore : 0.9,
        summary: raw.summary || raw.description || '',
        whyItMatters: raw.whyItMatters,
        status: 'verified',
        metadata: raw.metadata,
        fingerprint,
      });

      if (saved) {
        savedRecords.push(saved);
        await evaluateItemAlerts(saved, project);
      }
    }

    return NextResponse.json({
      success: true,
      processed: items.length,
      saved: savedRecords.length,
    });
  } catch (error) {
    console.error('[/api/n8n/webhook] Error:', (error as Error).message);
    return NextResponse.json(
      { success: false, error: 'Failed to process n8n webhook payload.' },
      { status: 500 }
    );
  }
}
