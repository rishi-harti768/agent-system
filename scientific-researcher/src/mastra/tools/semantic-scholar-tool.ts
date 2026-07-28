import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export interface SemanticScholarPaper {
  paperId?: string;
  title?: string;
  abstract?: string | null;
  authors?: Array<{ name?: string }>;
  citationCount?: number;
  influentialCitationCount?: number;
  url?: string;
  citations?: Array<{ paperId?: string; title?: string }>;
  references?: Array<{ paperId?: string; title?: string }>;
}

export const semanticScholarSearchTool = createTool({
  id: 'semantic_scholar_search',
  description: 'Search Semantic Scholar for academic paper details, citation graphs, and citation metrics.',
  inputSchema: z.object({
    query: z.string().describe('Search query for Semantic Scholar papers.'),
    limit: z.number().optional().default(5).describe('Number of results to return.'),
  }),
  outputSchema: z.object({
    query: z.string(),
    count: z.number(),
    results: z.array(
      z.object({
        paperId: z.string(),
        title: z.string(),
        abstract: z.string().nullable().optional(),
        authors: z.array(z.string()),
        citationCount: z.number().optional(),
        influentialCitationCount: z.number().optional(),
        url: z.string().optional(),
        citations: z.array(z.object({ paperId: z.string(), title: z.string() })).optional(),
        references: z.array(z.object({ paperId: z.string(), title: z.string() })).optional(),
      })
    ),
  }),
  execute: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const fields = 'title,abstract,authors,citationCount,influentialCitationCount,url,citations.title,references.title';
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formattedQuery}&limit=${limit}&fields=${fields}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mastra Scientific Researcher Agent/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`Semantic Scholar API responded with status ${response.status}`);
      }

      const data = (await response.json()) as { data?: SemanticScholarPaper[] };
      const rawResults = data.data || [];

      const results = rawResults.map((paper: SemanticScholarPaper) => ({
        paperId: paper.paperId || '',
        title: paper.title || '',
        abstract: paper.abstract || null,
        authors: Array.isArray(paper.authors) ? paper.authors.map((author) => author.name || '') : [],
        citationCount: typeof paper.citationCount === 'number' ? paper.citationCount : 0,
        influentialCitationCount: typeof paper.influentialCitationCount === 'number' ? paper.influentialCitationCount : 0,
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        citations: Array.isArray(paper.citations)
          ? paper.citations.map((citation) => ({ paperId: citation.paperId || '', title: citation.title || '' }))
          : [],
        references: Array.isArray(paper.references)
          ? paper.references.map((reference) => ({ paperId: reference.paperId || '', title: reference.title || '' }))
          : [],
      }));

      return {
        query,
        count: results.length,
        results,
      };
    } catch {
      return {
        query,
        count: 0,
        results: [],
      };
    }
  },
});
