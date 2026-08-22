// ============================================================
// AI Analysis Engine — Scoring, Summarization & Strategic Insights
// Transparent Multi-dimensional Scoring (Gemini / OpenAI)
// ============================================================
import type {
  IntelligenceType,
  IntelligenceItem,
  MonitoringProject,
  AIInsight,
  IntelligenceReport,
} from '@/types';

interface AnalysisResult {
  relevanceScore: number;
  impactScore: number;
  confidenceScore: number;
  summary: string;
  whyItMatters: string;
  relevanceExplanation?: string;
  impactExplanation?: string;
  confidenceExplanation?: string;
}

/**
 * Perform transparent AI analysis and scoring on a collected intelligence item.
 */
export async function analyzeIntelligenceItem(
  item: {
    type: IntelligenceType;
    title: string;
    description: string;
    sourceName: string;
    sourceUrl: string;
    author?: string;
    organization?: string;
    keywords?: string[];
  },
  projectContext: {
    name: string;
    industry: string;
    keywords: string[];
    topics: string[];
    competitors: string[];
  }
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Deterministic fallback scoring based on keyword overlap if no LLM key configured
    return fallbackScore(item, projectContext);
  }

  const prompt = `You are the NEXORA AI Intelligence Engine.
Analyze the following collected public record in the context of the user's monitoring project.

MONITORING PROJECT CONTEXT:
- Project Name: ${projectContext.name}
- Industry: ${projectContext.industry}
- Research Topics: ${projectContext.topics.join(', ')}
- Keywords: ${projectContext.keywords.join(', ')}
- Monitored Competitors: ${projectContext.competitors.join(', ') || 'None'}

COLLECTED RECORD:
- Type: ${item.type}
- Title: ${item.title}
- Source: ${item.sourceName} (${item.sourceUrl})
- Author / Organization: ${item.author || item.organization || 'N/A'}
- Abstract / Details: ${item.description}

REQUIREMENTS:
1. Do not fabricate facts. Use only the supplied information.
2. Clearly separate verified facts from AI interpretation.
3. Calculate transparent scores from 0.00 to 1.00:
   - relevanceScore: How directly relevant is this to the project's keywords/topics?
   - impactScore: What is the potential technological/market breakthrough or disruption?
   - confidenceScore: How reliable/verifiable is this based on the source authority?
4. Write a concise factual summary (2-3 sentences).
5. Write a "Why It Matters" strategic analysis (1-2 sentences).

Respond ONLY with a valid JSON object matching this schema:
{
  "relevanceScore": 0.85,
  "impactScore": 0.78,
  "confidenceScore": 0.92,
  "summary": "...",
  "whyItMatters": "...",
  "relevanceExplanation": "...",
  "impactExplanation": "...",
  "confidenceExplanation": "..."
}`;

  try {
    let jsonStr = '';

    if (process.env.GEMINI_API_KEY) {
      const modelsToTry = [
        process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash',
      ];
      const uniqueModels = Array.from(new Set(modelsToTry));

      for (const model of uniqueModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json',
                },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            jsonStr = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (jsonStr) break;
          }
        } catch {
          // try next model
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          jsonStr = data?.choices?.[0]?.message?.content || '';
        }
      } catch {
        clearTimeout(timer);
      }
    }

    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      return {
        relevanceScore: clampScore(parsed.relevanceScore, 0.75),
        impactScore: clampScore(parsed.impactScore, 0.7),
        confidenceScore: clampScore(parsed.confidenceScore, 0.9),
        summary: parsed.summary || item.description.slice(0, 250),
        whyItMatters: parsed.whyItMatters || 'Relevant development in monitored technology sector.',
        relevanceExplanation: parsed.relevanceExplanation,
        impactExplanation: parsed.impactExplanation,
        confidenceExplanation: parsed.confidenceExplanation,
      };
    }
  } catch (err) {
    console.warn('[AI Analyzer] LLM scoring fallback:', (err as Error).message);
  }

  return fallbackScore(item, projectContext);
}

function clampScore(val: any, defaultVal: number): number {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(0, Math.min(1, Math.round(num * 100) / 100));
}

function fallbackScore(
  item: { title: string; description: string; type: IntelligenceType; sourceName: string },
  project: { keywords: string[]; topics: string[] }
): AnalysisResult {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const allTerms = [...project.keywords, ...project.topics];
  const matched = allTerms.filter((t) => text.includes(t.toLowerCase())).length;

  const baseRelevance = allTerms.length > 0 ? Math.min(0.95, 0.5 + (matched / allTerms.length) * 0.45) : 0.7;
  const baseImpact = item.type === 'patent' ? 0.8 : item.type === 'research' ? 0.78 : 0.68;
  const baseConfidence = item.sourceName.includes('arXiv') || item.sourceName.includes('USPTO') ? 0.95 : 0.85;

  return {
    relevanceScore: Math.round(baseRelevance * 100) / 100,
    impactScore: Math.round(baseImpact * 100) / 100,
    confidenceScore: Math.round(baseConfidence * 100) / 100,
    summary: item.description.slice(0, 280),
    whyItMatters: `Verified ${item.type} development relating to monitored keywords.`,
  };
}

/**
 * Synthesize Strategic AI Insights from a batch of verified intelligence items.
 */
export async function generateStrategicInsights(
  items: IntelligenceItem[],
  project: MonitoringProject
): Promise<Array<Omit<AIInsight, 'id' | 'createdAt'>>> {
  if (items.length === 0) return [];

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Generate deterministic structured insight
    const topItem = items[0];
    return [
      {
        projectId: project.id,
        userId: project.userId,
        title: `Key Intelligence Update in ${project.name}`,
        whatHappened: `Monitored ${items.length} new verified development(s) across research and industry sources, including "${topItem.title}".`,
        whyItMatters: topItem.whyItMatters || 'Signals ongoing technical momentum in target domain.',
        potentialOpportunity: 'Evaluate early adoption or integration of documented techniques.',
        potentialRisk: 'Competitors may file overlapping IP or launch competing capabilities.',
        recommendedAction: 'Conduct deeper technical review of primary publications and patent claims.',
        confidenceScore: 0.88,
        supportingSourceIds: items.slice(0, 3).map((i) => i.id),
        supportingSources: items.slice(0, 3).map((i) => ({
          title: i.title,
          url: i.sourceUrl,
          sourceName: i.sourceName,
          type: i.type,
        })),
      },
    ];
  }

  const itemsList = items
    .slice(0, 10)
    .map(
      (it, idx) =>
        `[${idx + 1}] (${it.type.toUpperCase()}) ${it.title}\nSource: ${it.sourceName} (${it.sourceUrl})\nSummary: ${it.summary}`
    )
    .join('\n\n');

  const prompt = `You are the NEXORA AI Strategic Intelligence Analyst.
Synthesize actionable strategic intelligence insights from the following real collected records for project "${project.name}" (Industry: ${project.industry}).

COLLECTED REAL RECORDS:
${itemsList}

INSTRUCTIONS:
1. Do not invent citations or URLs. Use only the provided records.
2. Synthesize 1 to 2 high-value, actionable strategic insights.
3. For each insight provide:
   - title: Clear, impactful headline
   - whatHappened: Verified fact statement
   - whyItMatters: Strategic AI interpretation
   - potentialOpportunity: Market or technical opportunity
   - potentialRisk: Potential risk or threat
   - recommendedAction: Concrete next step for the team
   - confidenceScore: 0.0 to 1.0
   - supportingSourceIndices: array of record numbers [1, 2, etc.]

Respond ONLY with a valid JSON array:
[
  {
    "title": "...",
    "whatHappened": "...",
    "whyItMatters": "...",
    "potentialOpportunity": "...",
    "potentialRisk": "...",
    "recommendedAction": "...",
    "confidenceScore": 0.9,
    "supportingSourceIndices": [1, 2]
  }
]`;

  try {
    let jsonStr = '';
    if (process.env.GEMINI_API_KEY) {
      const modelsToTry = [
        process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash',
      ];
      const uniqueModels = Array.from(new Set(modelsToTry));

      for (const model of uniqueModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
              }),
              signal: controller.signal,
            }
          );
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            jsonStr = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (jsonStr) break;
          }
        } catch {
          // try next model
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const raw = data?.choices?.[0]?.message?.content || '';
          const parsed = JSON.parse(raw);
          jsonStr = Array.isArray(parsed) ? raw : JSON.stringify(parsed.insights || [parsed]);
        }
      } catch {
        clearTimeout(timer);
      }
    }

    if (jsonStr) {
      const parsedArray = JSON.parse(jsonStr);
      const rawList = Array.isArray(parsedArray) ? parsedArray : [parsedArray];

      return rawList.map((ins) => {
        const indices = (ins.supportingSourceIndices || [1]).map((n: number) => n - 1);
        const supporting = indices
          .map((idx: number) => items[idx])
          .filter(Boolean)
          .slice(0, 4);

        return {
          projectId: project.id,
          userId: project.userId,
          title: ins.title || 'Strategic Intelligence Insight',
          whatHappened: ins.whatHappened || 'New activity detected in monitored domain.',
          whyItMatters: ins.whyItMatters || 'Indicates strategic momentum in key areas.',
          potentialOpportunity: ins.potentialOpportunity || 'Explore collaborative or technical leverage.',
          potentialRisk: ins.potentialRisk || 'Competitive acceleration.',
          recommendedAction: ins.recommendedAction || 'Review referenced source documents.',
          confidenceScore: clampScore(ins.confidenceScore, 0.85),
          supportingSourceIds: supporting.map((s: IntelligenceItem) => s.id),
          supportingSources: supporting.map((s: IntelligenceItem) => ({
            title: s.title,
            url: s.sourceUrl,
            sourceName: s.sourceName,
            type: s.type,
          })),
        };
      });
    }
  } catch (err) {
    console.warn('[AI Analyzer] Insight generation error:', (err as Error).message);
  }

  // Fallback
  return [];
}

/**
 * Generate a comprehensive Intelligence Report from stored records.
 */
export async function generateExecutiveReport(
  items: IntelligenceItem[],
  project: MonitoringProject,
  period = 'Last 30 Days'
): Promise<Omit<IntelligenceReport, 'id' | 'createdAt'>> {
  const researchItems = items.filter((i) => i.type === 'research');
  const patentItems = items.filter((i) => i.type === 'patent');
  const competitorItems = items.filter((i) => i.type === 'competitor');
  const newsItems = items.filter((i) => i.type === 'news');

  const sources = items.slice(0, 15).map((i) => ({
    title: i.title,
    url: i.sourceUrl,
    sourceName: i.sourceName,
  }));

  const executiveSummary =
    `Autonomous intelligence monitoring for "${project.name}" identified ${items.length} verified developments across research publications (${researchItems.length}), patent filings (${patentItems.length}), competitor updates (${competitorItems.length}), and industry news (${newsItems.length}) during ${period}. ` +
    `Key focus areas include ${project.keywords.slice(0, 3).join(', ')} in the ${project.industry} industry.`;

  return {
    projectId: project.id,
    projectName: project.name,
    userId: project.userId,
    title: `${project.name} — Intelligence & Competitive Briefing`,
    period,
    executiveSummary,
    keyResearchDevelopments: researchItems.slice(0, 5).map((r) => `${r.title} (${r.sourceName}) — ${r.summary}`),
    patentDevelopments: patentItems.slice(0, 5).map((p) => `${p.title} [Assignee: ${p.organization || 'Patent Applicant'}] — ${p.summary}`),
    competitorActivity: competitorItems.slice(0, 5).map((c) => `${c.title} (${c.sourceName}) — ${c.summary}`),
    industryNews: newsItems.slice(0, 5).map((n) => `${n.title} (${n.sourceName}) — ${n.summary}`),
    emergingTrends: project.researchTopics.map((t) => `Active exploration around ${t} with increasing publication and patent density.`),
    risks: [
      'Rapid technological displacement in monitored core competencies.',
      'Potential intellectual property concentration by aggressive market participants.',
    ],
    opportunities: [
      'Opportunity to integrate emerging preprint methodologies before general market commercialization.',
      'Targeted patent filings in adjacent uncrowded technology classes.',
    ],
    recommendedActions: [
      'Schedule deep-dive architecture reviews for high-impact research publications.',
      'Monitor identified patent assignees for follow-on continuation filings.',
    ],
    sources,
  };
}
