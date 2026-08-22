// ============================================================
// Real Data Collector — OpenAlex API
// Queries real peer-reviewed papers & scientific records
// ============================================================
import { sanitizeSourceUrl, cleanText, generateFingerprint } from '../deduplication';

export interface RawOpenAlexRecord {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  author: string;
  organization?: string;
  keywords: string[];
  topics: string[];
  doi?: string;
  citationCount?: number;
  fingerprint: string;
}

/**
 * Fetch peer-reviewed papers from OpenAlex open API.
 */
export async function fetchOpenAlexResearch(
  keywords: string[],
  topics: string[],
  maxResults = 8
): Promise<RawOpenAlexRecord[]> {
  const terms = [...keywords, ...topics].filter(Boolean);
  if (terms.length === 0) return [];

  const searchQuery = encodeURIComponent(terms.slice(0, 3).join(' '));
  const url = `https://api.openalex.org/works?search=${searchQuery}&per_page=${maxResults}&sort=publication_date:desc`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NEXORA-Intelligence/2.0 (mailto:intelligence@nexora.ai)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[OpenAlex Collector] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results = data?.results || [];

    const records: RawOpenAlexRecord[] = [];

    for (const work of results) {
      const title = cleanText(work.title || work.display_name || '');
      if (!title) continue;

      // Extract authors
      const authorships = work.authorships || [];
      const authorNames = authorships
        .map((a: any) => a?.author?.display_name)
        .filter(Boolean);
      const author = authorNames.slice(0, 3).join(', ') + (authorNames.length > 3 ? ' et al.' : '');

      // Extract institution
      const institution =
        authorships[0]?.institutions?.[0]?.display_name ||
        work.primary_location?.source?.display_name ||
        'Research Institution';

      // Extract URL
      const sourceUrl =
        sanitizeSourceUrl(work.doi || work.primary_location?.landing_page_url || work.id) ||
        `https://openalex.org/${work.id}`;

      // Extract abstract / description
      // OpenAlex stores abstract as inverted index
      let description = '';
      if (work.abstract_inverted_index) {
        const words: Array<[string, number]> = [];
        for (const [word, positions] of Object.entries(work.abstract_inverted_index as Record<string, number[]>)) {
          for (const pos of positions) {
            words.push([word, pos]);
          }
        }
        words.sort((a, b) => a[1] - b[1]);
        description = words.map((w) => w[0]).join(' ');
      }
      if (!description) {
        description = `Published in ${work.primary_location?.source?.display_name || 'peer-reviewed venue'} (${work.publication_year || 'Recent'}). Topic: ${work.primary_topic?.display_name || 'AI/Tech'}.`;
      }
      description = cleanText(description).slice(0, 500);

      const publishedAt = work.publication_date
        ? new Date(work.publication_date).toISOString()
        : new Date().toISOString();

      const workTopics = [
        work.primary_topic?.display_name,
        ...(work.topics?.map((t: any) => t.display_name) || []),
      ]
        .filter(Boolean)
        .slice(0, 3);

      const fingerprint = generateFingerprint(sourceUrl, title);

      records.push({
        title,
        description,
        sourceName: work.primary_location?.source?.display_name || 'OpenAlex Scientific Index',
        sourceUrl,
        publishedAt,
        author: author || 'Academic Researchers',
        organization: institution,
        keywords: terms.slice(0, 3),
        topics: workTopics.length > 0 ? workTopics : ['Computer Science', 'AI'],
        doi: work.doi || undefined,
        citationCount: work.cited_by_count ?? 0,
        fingerprint,
      });
    }

    return records;
  } catch (error) {
    console.warn('[OpenAlex Collector] Fetch error:', (error as Error).message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
