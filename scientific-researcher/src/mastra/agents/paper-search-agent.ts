import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import {
  basePaperMetadataSchema,
  createSubAgentMemory,
  DEFAULT_SUB_AGENT_MODEL,
  paperSourceSchema,
  searchQuerySchema,
} from './schemas';

export const paperSearchOutputSchema = searchQuerySchema.extend({
  totalFound: z.number(),
  papers: z.array(
    basePaperMetadataSchema.extend({
      authors: z.array(z.string()),
      abstract: z.string(),
      source: paperSourceSchema,
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
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: createSubAgentMemory(),
  tools: {
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(paperSearchOutputSchema),
    },
  },
});


