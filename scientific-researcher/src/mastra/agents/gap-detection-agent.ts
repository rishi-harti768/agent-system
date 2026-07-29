import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { Memory } from '@mastra/memory';
import { z } from 'zod';

import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import { papersWithCodeSearchTool } from '../tools/papers-with-code-tool';
import { DEFAULT_SUB_AGENT_MODEL } from './schemas';

export const gapSeveritySchema = z.enum(['high', 'medium', 'low']);

export const gapDetectionOutputSchema = z.object({
  topic: z.string().min(1, 'Topic cannot be empty'),
  identifiedGaps: z.array(
    z.object({
      gapTitle: z.string(),
      description: z.string(),
      severity: gapSeveritySchema.optional(),
      affectedDomains: z.array(z.string()).optional(),
      potentialApproach: z.string().optional(),
    }),
  ),
  benchmarkDiscrepancies: z
    .array(
      z.object({
        benchmarkName: z.string(),
        observedLimitation: z.string(),
        missingMetricOrTask: z.string().optional(),
      }),
    )
    .optional(),
  promisingDirections: z.array(z.string()),
});

export type GapDetectionOutput = z.infer<typeof gapDetectionOutputSchema>;

export const gapDetectionAgent = new Agent({
  id: 'gap-detection-agent',
  name: 'Gap Detection Agent',
  description:
    'Specialized agent that compares retrieved research literature and benchmark results to identify unaddressed research gaps, limitations, and future directions.',
  instructions: `You are an expert Research Gap & Limitation Synthesis Agent.
Your goal is to synthesize findings from literature searches and benchmark leaderboards, identify unaddressed research gaps, evaluate limitations in existing methods, and highlight promising research directions.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: new Memory({
    options: {
      lastMessages: 10,
    },
  }),
  tools: {
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
    papers_with_code_search: papersWithCodeSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(gapDetectionOutputSchema),
    },
  },
});
