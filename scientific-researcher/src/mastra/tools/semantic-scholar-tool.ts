import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createErrorResponse, safeFetchJson } from './http-utils';
import { basePaperMetadataSchema } from '../agents/schemas';

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

export interface PaperReference {
  paperId: string;
  title: string;
}

export function buildCitationGraph(
  paperId: string,
  paperTitle: string,
  citations: PaperReference[],
  references: PaperReference[],
) {
  const nodes = [
    { id: paperId, label: paperTitle, type: 'paper' },
    ...citations.filter((c) => c.paperId).map((c) => ({ id: c.paperId, label: c.title, type: 'citation' })),
    ...references.filter((r) => r.paperId).map((r) => ({ id: r.paperId, label: r.title, type: 'reference' })),
  ];

  const edges = [
    ...citations.filter((c) => c.paperId).map((c) => ({ source: c.paperId, target: paperId, type: 'cites' })),
    ...references.filter((r) => r.paperId).map((r) => ({ source: paperId, target: r.paperId, type: 'references' })),
  ];

  return { nodes, edges };
}

export const semanticScholarPaperSchema = basePaperMetadataSchema.extend({
  paperId: z.string(),
  title: z.string(),
  abstract: z.string().nullable().optional(),
  authors: z.array(z.string()),
  citationCount: z.number().optional(),
  influentialCitationCount: z.number().optional(),
  url: z.string().optional(),
  citations: z.array(z.object({ paperId: z.string(), title: z.string() })).optional(),
  references: z.array(z.object({ paperId: z.string(), title: z.string() })).optional(),
  citationGraph: z.object({
    nodes: z.array(z.object({ id: z.string(), label: z.string(), type: z.string() })),
    edges: z.array(z.object({ source: z.string(), target: z.string(), type: z.string() })),
  }).optional(),
});

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
    error: z.string().optional(),
    results: z.array(semanticScholarPaperSchema),
  }),
  execute: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const fields = 'title,abstract,authors,citationCount,influentialCitationCount,url,citations.title,references.title';
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${formattedQuery}&limit=${limit}&fields=${fields}`;

    try {
      const data = await safeFetchJson<{ data?: SemanticScholarPaper[] }>(url);
      if (!data || !data.data) {
        return {
          query,
          count: 0,
          results: [],
        };
      }

      const rawResults = data.data;

      const results = rawResults.map((paper: SemanticScholarPaper) => {
        const paperId = paper.paperId || '';
        const paperTitle = paper.title || '';
        const citations = Array.isArray(paper.citations)
          ? paper.citations.map((c) => ({ paperId: c.paperId || '', title: c.title || '' }))
          : [];
        const references = Array.isArray(paper.references)
          ? paper.references.map((r) => ({ paperId: r.paperId || '', title: r.title || '' }))
          : [];

        const citationGraph = buildCitationGraph(paperId, paperTitle, citations, references);

        return {
          paperId,
          title: paperTitle,
          abstract: paper.abstract || null,
          authors: Array.isArray(paper.authors) ? paper.authors.map((author) => author.name || '') : [],
          citationCount: typeof paper.citationCount === 'number' ? paper.citationCount : 0,
          influentialCitationCount: typeof paper.influentialCitationCount === 'number' ? paper.influentialCitationCount : 0,
          url: paper.url || `https://www.semanticscholar.org/paper/${paperId}`,
          citations,
          references,
          citationGraph,
        };
      });

      return {
        query,
        count: results.length,
        results,
      };
    } catch (err: unknown) {
      return createErrorResponse(query, err);
    }
  },
});
