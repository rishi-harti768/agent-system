import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { papersWithCodeSearchTool } from '../tools/papers-with-code-tool';
import {
  createSubAgentMemory,
  DEFAULT_SUB_AGENT_MODEL,
  searchQuerySchema,
} from './schemas';

export const benchmarkMetricSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
});

export const benchmarkOutputSchema = searchQuerySchema.extend({
  benchmarks: z.array(
    z.object({
      taskName: z.string(),
      dataset: z.string().optional(),
      sotaMetric: z.union([z.string(), benchmarkMetricSchema]).optional(),
      topModel: z.string().optional(),
      score: z.union([z.string(), z.number()]).optional(),
      evaluationLeaderboard: z
        .array(
          z.object({
            modelName: z.string(),
            score: z.union([z.string(), z.number()]),
            rank: z.number().optional(),
          }),
        )
        .optional(),
    }),
  ),
});

export type BenchmarkOutput = z.infer<typeof benchmarkOutputSchema>;

export const benchmarkAgent = new Agent({
  id: 'benchmark-agent',
  name: 'Benchmark Agent',
  description:
    'Specialized agent that searches Papers with Code for evaluation metrics, SOTA model leaderboards, tasks, and datasets.',
  instructions: `You are an expert Benchmark & SOTA Evaluation Agent.
Your goal is to query Papers with Code to discover official benchmark evaluation metrics, leaderboards, top-performing models, and standardized datasets across machine learning domains.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: createSubAgentMemory(),
  tools: {
    papers_with_code_search: papersWithCodeSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(benchmarkOutputSchema),
    },
  },
});

