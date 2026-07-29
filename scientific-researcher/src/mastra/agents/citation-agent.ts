import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { Memory } from '@mastra/memory';
import { z } from 'zod';

import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import { arxivSearchTool } from '../tools/arxiv-tool';
import { basePaperMetadataSchema, DEFAULT_SUB_AGENT_MODEL } from './schemas';

export type CitationTreeNode = z.infer<typeof basePaperMetadataSchema> & {
  isInfluential?: boolean;
  depth?: number;
  relation?: 'citing' | 'referenced' | 'foundational' | 'derivative';
  children?: CitationTreeNode[];
};

export const citationTreeNodeSchema: z.ZodType<CitationTreeNode> = basePaperMetadataSchema.extend({
  isInfluential: z.boolean().optional(),
  depth: z.number().optional(),
  relation: z.enum(['citing', 'referenced', 'foundational', 'derivative']).optional(),
  children: z.array(z.lazy(() => citationTreeNodeSchema)).optional(),
});

export const citationOutputSchema = z.object({
  targetPaperId: z.string(),
  title: z.string(),
  totalCitations: z.number().optional(),
  influentialCitationsCount: z.number().optional(),
  citations: z.array(citationTreeNodeSchema),
  references: z.array(citationTreeNodeSchema),
  foundationalPapers: z.array(
    z.object({
      title: z.string(),
      reason: z.string(),
      influenceScore: z.number().optional(),
      citationCount: z.number().optional(),
    }),
  ),
  citationTree: z.array(citationTreeNodeSchema).optional(),
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
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: new Memory({
    options: {
      lastMessages: 10,
    },
  }),
  tools: {
    semantic_scholar_search: semanticScholarSearchTool,
    arxiv_search: arxivSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(citationOutputSchema),
    },
  },
});

