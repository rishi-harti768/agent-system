import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export interface PapersWithCodeItem {
  id?: string;
  title?: string;
  abstract?: string;
  url_pdf?: string;
  url?: string;
  repo_url?: string;
  paper?: {
    id?: string;
    title?: string;
    abstract?: string;
    url_pdf?: string;
    url?: string;
  };
  repository?: {
    url?: string;
  };
  tasks?: Array<{ name?: string } | string>;
  methods?: Array<{ name?: string } | string>;
  evaluations?: Array<{
    task?: string | { name?: string };
    dataset?: string | { name?: string };
    metric_name?: string;
    metric_value?: string | number;
  }>;
}

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
        benchmarks: z.array(
          z.object({
            task: z.string().optional(),
            dataset: z.string().optional(),
            metric: z.string().optional(),
            value: z.string().optional(),
          })
        ).optional(),
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

      const data = (await response.json()) as { results?: PapersWithCodeItem[] };
      const rawResults = data.results || [];

      const results = rawResults.slice(0, limit).map((item: PapersWithCodeItem) => {
        const paperObj = item.paper || item;
        const repoObj = item.repository || {};

        const tasks = Array.isArray(item.tasks)
          ? item.tasks.map((taskItem) => (typeof taskItem === 'string' ? taskItem : taskItem.name || ''))
          : [];

        const methods = Array.isArray(item.methods)
          ? item.methods.map((methodItem) => (typeof methodItem === 'string' ? methodItem : methodItem.name || ''))
          : [];

        const benchmarks = Array.isArray(item.evaluations)
          ? item.evaluations.map((evalItem) => ({
              task: typeof evalItem.task === 'object' ? evalItem.task?.name || '' : evalItem.task || '',
              dataset: typeof evalItem.dataset === 'object' ? evalItem.dataset?.name || '' : evalItem.dataset || '',
              metric: evalItem.metric_name || '',
              value: evalItem.metric_value != null ? String(evalItem.metric_value) : '',
            }))
          : [];

        return {
          id: paperObj.id || item.id || '',
          title: paperObj.title || item.title || '',
          abstract: paperObj.abstract || item.abstract || '',
          paperUrl: paperObj.url_pdf || paperObj.url || '',
          repoUrl: repoObj.url || item.repo_url || '',
          tasks,
          methods,
          benchmarks,
        };
      });

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
