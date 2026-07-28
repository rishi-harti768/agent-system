import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';

export const paperSearchOutputSchema = z.object({
  query: z.string(),
  totalFound: z.number(),
  papers: z.array(
    z.object({
      title: z.string(),
      authors: z.array(z.string()),
      abstract: z.string(),
      url: z.string().optional(),
      publishedDate: z.string().optional(),
      citationCount: z.number().optional(),
      externalIds: z.record(z.string()).optional(),
      source: z.string(),
    }),
  ),
});

export type PaperSearchOutput = z.infer<typeof paperSearchOutputSchema>;

export const paperSearchAgent = new Agent({
  id: 'paper-search-agent',
  name: 'Paper Search Agent',
  description:
    'Specialized agent that queries arXiv and Semantic Scholar to discover academic papers, abstracts, authors, and citation counts.',
  instructions: `You are an expert Literature Search Agent.
Your goal is to search academic repositories (arXiv and Semantic Scholar) for high-quality research papers matching user topics or queries.
Always return structured responses adhering to the required schema, organizing papers by relevance, citation count, and publication freshness.`,
  model: 'google/gemini-3.5-flash',
  tools: {
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
  },
});
