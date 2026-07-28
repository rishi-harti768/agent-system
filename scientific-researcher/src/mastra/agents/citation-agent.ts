import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import { arxivSearchTool } from '../tools/arxiv-tool';

export const citationOutputSchema = z.object({
  targetPaperId: z.string(),
  title: z.string(),
  citations: z.array(
    z.object({
      paperId: z.string().optional(),
      title: z.string(),
      year: z.number().nullable().optional(),
      citationCount: z.number().nullable().optional(),
    }),
  ),
  references: z.array(
    z.object({
      paperId: z.string().optional(),
      title: z.string(),
      year: z.number().nullable().optional(),
    }),
  ),
  foundationalPapers: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      influenceScore: z.number().optional(),
    }),
  ),
});

export type CitationOutput = z.infer<typeof citationOutputSchema>;

export const citationAgent = new Agent({
  id: 'citation-agent',
  name: 'Citation Agent',
  description:
    'Specialized agent that constructs citation trees and analyzes paper influence network using Semantic Scholar and arXiv.',
  instructions: `You are an expert Citation Analysis Agent.
Your goal is to inspect citations and references of target papers to identify foundational works, key influential predecessors, and downstream derivative literature.
Provide a clear analysis of citation graphs and highlight foundational papers shaping the field.`,
  model: 'google/gemini-3.5-flash',
  tools: {
    semantic_scholar_search: semanticScholarSearchTool,
    arxiv_search: arxivSearchTool,
  },
});
