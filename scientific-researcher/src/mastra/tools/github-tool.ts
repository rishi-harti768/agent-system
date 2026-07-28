import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { safeFetchJson } from './http-utils';

interface GitHubSearchResponse {
  items?: Array<{
    name?: string;
    full_name?: string;
    description?: string | null;
    html_url?: string;
    stargazers_count?: number;
    forks_count?: number;
    language?: string | null;
    repository?: {
      name?: string;
      full_name?: string;
      description?: string | null;
      html_url?: string;
      stargazers_count?: number;
      forks_count?: number;
      language?: string | null;
    };
  }>;
}

export const githubSearchTool = createTool({
  id: 'github_search',
  description: 'Search GitHub repositories and code implementations for open-source research code.',
  inputSchema: z.object({
    query: z.string().describe('Search query string for GitHub repositories or code.'),
    type: z.enum(['repositories', 'code']).optional().default('repositories').describe('Type of search: repositories or code.'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return.'),
  }),
  outputSchema: z.object({
    query: z.string(),
    type: z.string(),
    count: z.number(),
    results: z.array(
      z.object({
        name: z.string(),
        fullName: z.string(),
        description: z.string(),
        url: z.string(),
        stars: z.number(),
        forks: z.number(),
        language: z.string(),
      })
    ),
  }),
  execute: async ({ query, type = 'repositories', maxResults = 5 }: { query: string; type?: 'repositories' | 'code'; maxResults?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const endpoint = type === 'code' ? 'code' : 'repositories';
    const url = `https://api.github.com/search/${endpoint}?q=${formattedQuery}&per_page=${maxResults}`;

    const data = await safeFetchJson<GitHubSearchResponse>(url, {
      Accept: 'application/vnd.github.v3+json',
    });

    if (!data || !data.items) {
      return {
        query,
        type,
        count: 0,
        results: [],
      };
    }

    const results = data.items.map((item) => {
      const repo = item.repository || item;
      return {
        name: item.name || repo.name || '',
        fullName: repo.full_name || item.full_name || '',
        description: repo.description || item.description || '',
        url: item.html_url || repo.html_url || '',
        stars: repo.stargazers_count ?? 0,
        forks: repo.forks_count ?? 0,
        language: repo.language || 'Unknown',
      };
    });

    return {
      query,
      type,
      count: results.length,
      results,
    };
  },
});
