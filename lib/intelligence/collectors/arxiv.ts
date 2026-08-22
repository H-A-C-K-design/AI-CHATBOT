// ============================================================
// Real Data Collector — arXiv API
// Queries real academic research papers directly from arXiv
// ============================================================
import { sanitizeSourceUrl, cleanText, generateFingerprint } from '../deduplication';

export interface RawResearchRecord {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  author: string;
  organization?: string;
  keywords: string[];
  topics: string[];
  arxivId?: string;
  doi?: string;
  fingerprint: string;
}

/**
 * Fetch real research publications from arXiv API matching query terms.
 */
export async function fetchArxivResearch(
  keywords: string[],
  topics: string[],
  maxResults = 8
): Promise<RawResearchRecord[]> {
  const terms = [...keywords, ...topics].filter(Boolean);
  if (terms.length === 0) return [];

  // Build arXiv search query
  const queryParts = terms.slice(0, 4).map((t) => `all:"${encodeURIComponent(t.replace(/"/g, ''))}"`);
  const searchQuery = queryParts.join('+OR+');
  const url = `https://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NEXORA-Intelligence/2.0 (Research Intelligence Bot)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[arXiv Collector] HTTP ${response.status} from arXiv`);
      return [];
    }

    const xmlText = await response.text();
    return parseArxivXml(xmlText, terms);
  } catch (error) {
    console.warn('[arXiv Collector] Fetch error:', (error as Error).message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse arXiv XML/Atom feed safely.
 */
function parseArxivXml(xml: string, projectTerms: string[]): RawResearchRecord[] {
  const records: RawResearchRecord[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    // Extract Title
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const rawTitle = titleMatch ? cleanText(titleMatch[1]) : '';
    if (!rawTitle || rawTitle === 'Error') continue;

    // Extract Summary/Abstract
    const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch ? cleanText(summaryMatch[1]) : '';

    // Extract Published Date
    const publishedMatch = entryXml.match(/<published>([\s\S]*?)<\/published>/);
    const publishedAt = publishedMatch
      ? new Date(publishedMatch[1].trim()).toISOString()
      : new Date().toISOString();

    // Extract ID and Links
    const idMatch = entryXml.match(/<id>([\s\S]*?)<\/id>/);
    const rawIdUrl = idMatch ? idMatch[1].trim() : '';
    const arxivId = rawIdUrl.replace(/^https?:\/\/arxiv\.org\/abs\//, '');
    const sourceUrl = sanitizeSourceUrl(rawIdUrl) || `https://arxiv.org/abs/${arxivId}`;

    // Extract Authors
    const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>/g;
    const authors: string[] = [];
    let authorMatch: RegExpExecArray | null;
    while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
      authors.push(cleanText(authorMatch[1]));
    }
    const authorString = authors.slice(0, 3).join(', ') + (authors.length > 3 ? ' et al.' : '');

    // Extract Categories / Primary Category
    const catRegex = /<category[^>]*term="([^"]+)"/g;
    const categories: string[] = [];
    let catMatch: RegExpExecArray | null;
    while ((catMatch = catRegex.exec(entryXml)) !== null) {
      categories.push(catMatch[1]);
    }

    // Extract DOI if available
    const doiMatch = entryXml.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/);
    const doi = doiMatch ? cleanText(doiMatch[1]) : undefined;

    const matchedKeywords = projectTerms.filter((term) =>
      rawTitle.toLowerCase().includes(term.toLowerCase()) ||
      summary.toLowerCase().includes(term.toLowerCase())
    );

    const fingerprint = generateFingerprint(sourceUrl, rawTitle);

    records.push({
      title: rawTitle,
      description: summary.slice(0, 500) + (summary.length > 500 ? '...' : ''),
      sourceName: 'arXiv.org',
      sourceUrl,
      publishedAt,
      author: authorString || 'Research Team',
      organization: categories.length > 0 ? `arXiv: ${categories[0]}` : 'Academic Preprint',
      keywords: matchedKeywords.length > 0 ? matchedKeywords : projectTerms.slice(0, 3),
      topics: categories.length > 0 ? categories.slice(0, 3) : ['Computer Science', 'AI Research'],
      arxivId: arxivId || undefined,
      doi,
      fingerprint,
    });
  }

  return records;
}
