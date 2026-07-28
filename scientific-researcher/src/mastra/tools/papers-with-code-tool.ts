import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const papersWithCodeSearchTool = createTool({
  id: 'papers_with_code_search',
  description: 'Search Papers with Code for evaluation metrics, SOTA benchmarks, and code repository links.',
  inputSchema: z.object({
    query: z.string().describe('Search query for Papers with Code.'),
    limit: z.number().optional().default(5).describe('Number of paper/benchmark results to return.'),
  }),
  outputSchema: z.object({
    query: z.string(),
    count: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        abstract: z.string().optional(),
        paperUrl: z.string().optional(),
        repoUrl: z.string().optional(),
        tasks: z.array(z.string()).optional(),
        methods: z.array(z.string()).optional(),
      })
    ),
  }),
  execute: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const url = `https://paperswithcode.com/api/v1/search/?q=${formattedQuery}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mastra Scientific Researcher Agent/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`Papers with Code API responded with status ${response.status}`);
      }

      const data: any = await response.json();
      const rawResults = data?.results || [];

      const results = rawResults.slice(0, limit).map((item: any) => {
        const paperObj = item.paper || item;
        const repoObj = item.repository || {};
        return {
          id: paperObj.id || item.id || '',
          title: paperObj.title || item.title || '',
          abstract: paperObj.abstract || item.abstract || '',
          paperUrl: paperObj.url_pdf || paperObj.url || '',
          repoUrl: repoObj.url || item.repo_url || '',
          tasks: Array.isArray(item.tasks) ? item.tasks.map((t: any) => t.name || t) : [],
          methods: Array.isArray(item.methods) ? item.methods.map((m: any) => m.name || m) : [],
        };
      });

      return {
        query,
        count: results.length,
        results,
      };
    } catch (err: any) {
      return {
        query,
        count: 0,
        results: [],
      };
    }
  },
});
