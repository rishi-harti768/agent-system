import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { presentationWriterTool } from '../tools/presentation-writer-tool';
import { createSubAgentMemory, DEFAULT_SUB_AGENT_MODEL } from './schemas';

export const presentationSlideSchema = z.object({
  slideNumber: z.number(),
  title: z.string(),
  bulletPoints: z.array(z.string()),
  codeSnippet: z.string().optional(),
});

export const presentationOutputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  slides: z.array(presentationSlideSchema),
  presentationFilePath: z.string().optional(),
  success: z.boolean(),
});

export type PresentationOutput = z.infer<typeof presentationOutputSchema>;

export const presentationAgent = new Agent({
  id: 'presentation-agent',
  name: 'Presentation Agent',
  description:
    'Specialized agent that transforms research findings into an interactive animated PRESENTATION.html slide deck.',
  instructions: `You are an expert Presentation Agent.
Your goal is to synthesize research literature, benchmark leaderboards, and experiment conclusions into a structured presentation deck, and generate an interactive animated HTML presentation stored using the presentation_writer tool.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: createSubAgentMemory(),
  tools: {
    presentation_writer: presentationWriterTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(presentationOutputSchema),
      jsonPromptInjection: 'auto',
    },
  },
});

