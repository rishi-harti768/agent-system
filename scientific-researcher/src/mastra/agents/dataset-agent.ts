import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { huggingfaceSearchTool } from '../tools/huggingface-tool';
import { DEFAULT_SUB_AGENT_MODEL, searchQuerySchema } from './schemas';

export const datasetOutputSchema = searchQuerySchema.extend({
  datasets: z.array(
    z.object({
      id: z.string(),
      description: z.string().optional(),
      downloads: z.number().optional(),
      tags: z.array(z.string()).optional(),
      likes: z.number().optional(),
    }),
  ),
  models: z.array(
    z.object({
      id: z.string(),
      pipeline_tag: z.string().optional(),
      downloads: z.number().optional(),
      likes: z.number().optional(),
    }),
  ),
});

export type DatasetOutput = z.infer<typeof datasetOutputSchema>;

export const datasetAgent = new Agent({
  id: 'dataset-agent',
  name: 'Dataset Agent',
  description:
    'Specialized agent that queries Hugging Face Hub to catalog open-source datasets and pre-trained models.',
  instructions: `You are an expert Dataset & Model Catalog Agent.
Your goal is to search Hugging Face Hub to identify available datasets, pre-trained model checkpoints, modality tags, and popularity metrics for empirical research workflows.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  tools: {
    huggingface_search: huggingfaceSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(datasetOutputSchema),
    },
  },
});

