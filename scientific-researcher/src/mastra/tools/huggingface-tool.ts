import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const huggingfaceSearchTool = createTool({
  id: 'huggingface_search',
  description: 'Search Hugging Face Hub for open-source machine learning models and datasets.',
  inputSchema: z.object({
    query: z.string().describe('Search query string for Hugging Face models or datasets.'),
    type: z.enum(['models', 'datasets']).optional().default('models').describe('Type of resource to search: models or datasets.'),
    maxResults: z.number().optional().default(5).describe('Maximum number of items to return.'),
  }),
  outputSchema: z.object({
    query: z.string(),
    type: z.string(),
    count: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        downloads: z.number(),
        likes: z.number(),
        url: z.string(),
        tags: z.array(z.string()),
      })
    ),
  }),
  execute: async ({ query, type = 'models', maxResults = 5 }: { query: string; type?: 'models' | 'datasets'; maxResults?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const endpoint = type === 'datasets' ? 'datasets' : 'models';
    const url = `https://huggingface.co/api/${endpoint}?search=${formattedQuery}&limit=${maxResults}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mastra Scientific Researcher Agent/1.0',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API responded with status ${response.status}`);
      }

      const items = (await response.json()) as Array<{
        id?: string;
        modelId?: string;
        downloads?: number;
        likes?: number;
        tags?: string[];
      }>;

      const rawItems = Array.isArray(items) ? items : [];
      const results = rawItems.slice(0, maxResults).map((item) => {
        const itemId = item.id || item.modelId || '';
        const baseUrl = type === 'datasets' ? 'https://huggingface.co/datasets' : 'https://huggingface.co';
        return {
          id: itemId,
          name: itemId,
          downloads: item.downloads ?? 0,
          likes: item.likes ?? 0,
          url: `${baseUrl}/${itemId}`,
          tags: Array.isArray(item.tags) ? item.tags : [],
        };
      });

      return {
        query,
        type,
        count: results.length,
        results,
      };
    } catch {
      return {
        query,
        type,
        count: 0,
        results: [],
      };
    }
  },
});
