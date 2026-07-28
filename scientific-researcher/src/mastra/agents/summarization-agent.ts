import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import { webFetchTool } from '../tools/web-fetch-tool';
import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';

export const summarizationOutputSchema = z.object({
  paperTitle: z.string(),
  summary: z.string(),
  keyContributions: z.array(z.string()),
  methodology: z.string(),
  limitations: z.array(z.string()),
  potentialApplications: z.array(z.string()),
});

export type SummarizationOutput = z.infer<typeof summarizationOutputSchema>;

export const summarizationAgent = new Agent({
  id: 'summarization-agent',
  name: 'Summarization Agent',
  description:
    'Specialized agent that condenses paper abstracts, methodologies, and core technical contributions into detailed summaries.',
  instructions: `You are an expert Scientific Summarization Agent.
Your goal is to digest complex academic papers, abstracts, and web resources to produce concise, technical summaries.
Highlight key methodological innovations, core empirical results, known limitations, and potential real-world applications.`,
  model: 'google/gemini-3.5-flash',
  tools: {
    web_fetch: webFetchTool,
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
  },
});
