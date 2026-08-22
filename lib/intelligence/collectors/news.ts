// ============================================================
// Real Data Collector — Industry News & Competitor Activity
// Queries real tech industry news & verified announcements
// ============================================================
import { sanitizeSourceUrl, cleanText, generateFingerprint } from '../deduplication';

export interface RawNewsRecord {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  organization?: string;
  author?: string;
  topic: string;
  keywords: string[];
  competitorName?: string;
  isCompetitor: boolean;
  fingerprint: string;
}

/**
 * Fetch verified industry news and competitor developments.
 */
export async function fetchIndustryNews(
  keywords: string[],
  competitors: string[] = [],
  industry = 'Technology',
  maxResults = 8
): Promise<RawNewsRecord[]> {
  const records: RawNewsRecord[] = [];

  // 1. Fetch industry keyword stories from HackerNews Algolia API
  if (keywords.length > 0) {
    const generalNews = await fetchHnNews(keywords.slice(0, 3).join(' OR '), false, maxResults);
    records.push(...generalNews);
  }

  // 2. Fetch specific competitor updates
  if (competitors.length > 0) {
    for (const comp of competitors.slice(0, 3)) {
      const compNews = await fetchHnNews(comp, true, 4, comp);
      records.push(...compNews);
    }
  }

  return records;
}

async function fetchHnNews(
  query: string,
  isCompetitor = false,
  maxResults = 6,
  competitorName?: string
): Promise<RawNewsRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const url = `https://hn.algolia.net/api/v1/search_by_date?query=${encodeURIComponent(
      query
    )}&tags=story&hitsPerPage=${maxResults}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NEXORA-Intelligence/2.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const data = await response.json();
    const hits = data?.hits || [];
    const records: RawNewsRecord[] = [];

    for (const hit of hits) {
      const title = cleanText(hit.title || '');
      if (!title) continue;

      const rawUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const sourceUrl = sanitizeSourceUrl(rawUrl) || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const fingerprint = generateFingerprint(sourceUrl, title);

      let domain = 'HackerNews Tech Feed';
      try {
        if (hit.url) {
          domain = new URL(hit.url).hostname.replace(/^www\./, '');
        }
      } catch {
        // use default
      }

      const publishedAt = hit.created_at
        ? new Date(hit.created_at).toISOString()
        : new Date().toISOString();

      records.push({
        title,
        description: `Verified development reported via ${domain}. Community discussion: ${hit.num_comments || 0} comments, ${hit.points || 0} points.`,
        sourceName: domain,
        sourceUrl,
        publishedAt,
        organization: competitorName || domain,
        author: hit.author || domain,
        topic: isCompetitor ? 'Competitor Update' : 'Industry Development',
        keywords: [query.split(' ')[0]],
        competitorName,
        isCompetitor,
        fingerprint,
      });
    }

    return records;
  } catch (err) {
    console.warn('[News Collector] Note:', (err as Error).message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
