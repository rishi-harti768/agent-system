import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import { webFetchTool } from '../tools/web-fetch-tool';
import { createSubAgentMemory, DEFAULT_SUB_AGENT_MODEL } from './schemas';

export const similarWorkSchema = z.object({
  title: z.string(),
  similarityAspect: z.string(),
  keyDifference: z.string(),
  url: z.string().optional(),
});

export const noveltyCheckerOutputSchema = z.object({
  proposedIdea: z.string().min(1, 'Proposed idea cannot be empty'),
  noveltyScore: z
    .number()
    .min(0, 'Novelty score must be between 0 and 10')
    .max(10, 'Novelty score must be between 0 and 10'),
  isNovel: z.boolean(),
  similarWork: z.array(similarWorkSchema),
  differentiationPoints: z.array(z.string()),
  recommendations: z.array(z.string()).optional(),
});

export type NoveltyCheckerOutput = z.infer<typeof noveltyCheckerOutputSchema>;

export const noveltyCheckerAgent = new Agent({
  id: 'novelty-checker-agent',
  name: 'Novelty Checker Agent',
  description:
    'Specialized agent that evaluates proposed research ideas against existing literature to determine novelty, similarity, and differentiation.',
  instructions: `You are an expert Research Novelty & Prior Art Checker Agent.
Your goal is to evaluate proposed research hypotheses or architectural ideas against academic databases, calculate a novelty score (0-10), highlight similar existing work, and summarize key differentiation points.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: createSubAgentMemory(),
  tools: {
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
    web_fetch: webFetchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(noveltyCheckerOutputSchema),
      jsonPromptInjection: 'auto',
    },
  },
});

