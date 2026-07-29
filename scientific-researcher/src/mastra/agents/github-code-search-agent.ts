import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { Memory } from '@mastra/memory';
import { z } from 'zod';

import { githubSearchTool } from '../tools/github-tool';
import { DEFAULT_SUB_AGENT_MODEL, searchQuerySchema } from './schemas';

export const githubCodeSearchOutputSchema = searchQuerySchema.extend({
  repositories: z.array(
    z.object({
      name: z.string(),
      fullName: z.string(),
      description: z.string().optional(),
      url: z.string(),
      stars: z.number(),
      language: z.string().optional(),
      topics: z.array(z.string()).optional(),
    }),
  ),
});

export type GithubCodeSearchOutput = z.infer<
  typeof githubCodeSearchOutputSchema
>;

export const githubCodeSearchAgent = new Agent({
  id: 'github-code-search-agent',
  name: 'GitHub Code Search Agent',
  description:
    'Specialized agent that searches GitHub repositories for open-source implementations of research architectures and algorithms.',
  instructions: `You are an expert GitHub Code Search Agent.
Your goal is to locate open-source implementations, official research codebases, popular forks, and relevant tools on GitHub related to scientific research topics.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  memory: new Memory({
    options: {
      lastMessages: 10,
    },
  }),
  tools: {
    github_search: githubSearchTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(githubCodeSearchOutputSchema),
    },
  },
});

