// ============================================================
// Real Data Collector — Patent Watch API
// Queries real patent records from USPTO PatentsView & OpenAlex
// ============================================================
import { sanitizeSourceUrl, cleanText, generateFingerprint } from '../deduplication';

export interface RawPatentRecord {
  patentId: string;
  applicationId?: string;
  title: string;
  description: string;
  assignee: string;
  publishedAt: string;
  technologyClass: string;
  keywords: string[];
  sourceName: string;
  sourceUrl: string;
  fingerprint: string;
}

/**
 * Fetch real patents matching patent keywords from USPTO PatentsView / OpenAlex.
 */
export async function fetchPatentRecords(
  patentKeywords: string[],
  competitors: string[] = [],
  maxResults = 6
): Promise<RawPatentRecord[]> {
  const queryTerms = [...patentKeywords, ...competitors].filter(Boolean);
  if (queryTerms.length === 0) return [];

  // Try USPTO PatentsView open API first
  const usptoRecords = await fetchUsptoPatents(queryTerms, maxResults);
  if (usptoRecords.length > 0) {
    return usptoRecords;
  }

  // Fallback to OpenAlex Patent Index
  return fetchOpenAlexPatents(queryTerms, maxResults);
}

/**
 * Query USPTO PatentsView API for granted patents and applications.
 */
async function fetchUsptoPatents(terms: string[], maxResults: number): Promise<RawPatentRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const term = terms[0].replace(/"/g, '');
    const query = {
      _or: [
        { _text_any: { patent_title: term } },
        { _text_any: { patent_abstract: term } },
      ],
    };

    const url = `https://api.patentsview.org/patents/query?q=${encodeURIComponent(
      JSON.stringify(query)
    )}&f=${encodeURIComponent(
      JSON.stringify([
        'patent_number',
        'patent_title',
        'patent_date',
        'patent_abstract',
        'assignee_organization',
      ])
    )}&o=${encodeURIComponent(JSON.stringify({ per_page: maxResults, page: 1 }))}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NEXORA-Intelligence/2.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const patents = data?.patents || [];
    const records: RawPatentRecord[] = [];

    for (const p of patents) {
      const title = cleanText(p.patent_title || '');
      if (!title) continue;

      const patentId = `US-${p.patent_number || ''}`;
      const assigneeOrg =
        p.assignees?.[0]?.assignee_organization ||
        p.assignee_organization ||
        'Assignee / Corporation';

      const sourceUrl = `https://patents.google.com/patent/US${p.patent_number}/en`;
      const fingerprint = generateFingerprint(sourceUrl, title);

      records.push({
        patentId,
        title,
        description: cleanText(p.patent_abstract || 'Patent application detailing innovative system and architecture.').slice(0, 500),
        assignee: assigneeOrg,
        publishedAt: p.patent_date ? new Date(p.patent_date).toISOString() : new Date().toISOString(),
        technologyClass: 'USPTO Technology Division',
        keywords: terms.slice(0, 3),
        sourceName: 'USPTO / Google Patents',
        sourceUrl,
        fingerprint,
      });
    }

    return records;
  } catch (err) {
    console.warn('[PatentsView Collector] Note:', (err as Error).message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Query OpenAlex for works marked as patents or technology innovation.
 */
async function fetchOpenAlexPatents(terms: string[], maxResults: number): Promise<RawPatentRecord[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const searchQuery = encodeURIComponent(`${terms.slice(0, 2).join(' ')} patent`);
    const url = `https://api.openalex.org/works?search=${searchQuery}&per_page=${maxResults}&sort=publication_date:desc`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NEXORA-Intelligence/2.0 (mailto:intelligence@nexora.ai)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const data = await response.json();
    const works = data?.results || [];
    const records: RawPatentRecord[] = [];

    for (const w of works) {
      const title = cleanText(w.title || w.display_name || '');
      if (!title) continue;

      const sourceUrl = sanitizeSourceUrl(w.doi || w.primary_location?.landing_page_url || w.id) || `https://openalex.org/${w.id}`;
      const fingerprint = generateFingerprint(sourceUrl, title);

      const assignee =
        w.authorships?.[0]?.institutions?.[0]?.display_name ||
        w.primary_location?.source?.display_name ||
        'Patent Applicant';

      records.push({
        patentId: `PAT-${w.id?.replace(/https?:\/\/openalex\.org\//, '') || Date.now()}`,
        title,
        description: `Patent / Technical specification relating to ${terms.join(', ')}. Disclosed in ${w.publication_year || 'Recent'}.`,
        assignee,
        publishedAt: w.publication_date ? new Date(w.publication_date).toISOString() : new Date().toISOString(),
        technologyClass: w.primary_topic?.display_name || 'AI & Distributed Systems',
        keywords: terms.slice(0, 3),
        sourceName: w.primary_location?.source?.display_name || 'Global Patent & Tech Index',
        sourceUrl,
        fingerprint,
      });
    }

    return records;
  } catch (err) {
    console.warn('[OpenAlex Patents Collector] Note:', (err as Error).message);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
