import { describe, expect, test } from 'bun:test';
import { Agent } from '@mastra/core/agent';

import { agent as supervisorAgent } from './agent';
import {
  paperSearchAgent,
  paperSearchOutputSchema,
} from './paper-search-agent';
import {
  citationAgent,
  citationOutputSchema,
} from './citation-agent';
import {
  summarizationAgent,
  summarizationOutputSchema,
} from './summarization-agent';
import {
  benchmarkAgent,
  benchmarkOutputSchema,
} from './benchmark-agent';
import {
  githubCodeSearchAgent,
  githubCodeSearchOutputSchema,
} from './github-code-search-agent';
import {
  datasetAgent,
  datasetOutputSchema,
} from './dataset-agent';

describe('Literature & Analysis Sub-Agents', () => {
  describe('Supervisor Agent Delegation', () => {
    test('supervisor agent has all 6 sub-agents attached for delegation', async () => {
      expect(supervisorAgent).toBeInstanceOf(Agent);
      const subAgents = await supervisorAgent.listAgents();
      expect(subAgents).toHaveProperty('paperSearchAgent');
      expect(subAgents).toHaveProperty('citationAgent');
      expect(subAgents).toHaveProperty('summarizationAgent');
      expect(subAgents).toHaveProperty('benchmarkAgent');
      expect(subAgents).toHaveProperty('githubCodeSearchAgent');
      expect(subAgents).toHaveProperty('datasetAgent');
    });
  });

  const subAgentCases = [
    {
      name: 'paperSearchAgent',
      agent: paperSearchAgent,
      id: 'paper-search-agent',
      expectedName: 'Paper Search Agent',
      expectedTools: ['arxiv_search', 'semantic_scholar_search'],
      schema: paperSearchOutputSchema,
      validPayload: {
        query: 'transformer attention',
        totalFound: 1,
        papers: [
          {
            title: 'Attention Is All You Need',
            authors: ['Ashish Vaswani', 'Noam Shazeer'],
            abstract: 'The dominant sequence transduction models are based on complex recurrent networks.',
            url: 'https://arxiv.org/abs/1706.03762',
            publishedDate: '2017-06-12',
            citationCount: 100000,
            externalIds: { ArXiv: '1706.03762' },
            source: 'arXiv',
          },
        ],
      },
      invalidPayload: { query: 'test' },
    },
    {
      name: 'citationAgent',
      agent: citationAgent,
      id: 'citation-agent',
      expectedName: 'Citation Agent',
      expectedTools: ['semantic_scholar_search', 'arxiv_search'],
      schema: citationOutputSchema,
      validPayload: {
        targetPaperId: '1706.03762',
        title: 'Attention Is All You Need',
        totalCitations: 100000,
        influentialCitationsCount: 5000,
        citations: [
          {
            paperId: '2005.14165',
            title: 'Language Models are Few-Shot Learners',
            year: 2020,
            citationCount: 20000,
            isInfluential: true,
            relation: 'citing',
          },
        ],
        references: [
          {
            paperId: '1409.0473',
            title: 'Neural Machine Translation',
            year: 2014,
            relation: 'referenced',
          },
        ],
        foundationalPapers: [
          {
            title: 'Sequence to Sequence Learning',
            reason: 'Pioneered seq2seq.',
            influenceScore: 9.5,
          },
        ],
      },
      invalidPayload: { targetPaperId: '123' },
    },
    {
      name: 'summarizationAgent',
      agent: summarizationAgent,
      id: 'summarization-agent',
      expectedName: 'Summarization Agent',
      expectedTools: ['web_fetch', 'arxiv_search', 'semantic_scholar_search'],
      schema: summarizationOutputSchema,
      validPayload: {
        paperTitle: 'Attention Is All You Need',
        summary: 'Proposes Transformer architecture.',
        keyContributions: ['Self-attention'],
        methodology: 'Scaled dot-product attention',
        limitations: ['Quadratic complexity'],
        potentialApplications: ['LLM pre-training'],
      },
      invalidPayload: { paperTitle: 'Test' },
    },
    {
      name: 'benchmarkAgent',
      agent: benchmarkAgent,
      id: 'benchmark-agent',
      expectedName: 'Benchmark Agent',
      expectedTools: ['papers_with_code_search'],
      schema: benchmarkOutputSchema,
      validPayload: {
        query: 'ImageNet',
        benchmarks: [
          {
            taskName: 'Image Classification',
            dataset: 'ImageNet',
            sotaMetric: 'Top-1 Accuracy',
            topModel: 'CoAtNet-7',
            score: '90.88%',
          },
        ],
      },
      invalidPayload: { query: 'test', benchmarks: 'invalid' },
    },
    {
      name: 'githubCodeSearchAgent',
      agent: githubCodeSearchAgent,
      id: 'github-code-search-agent',
      expectedName: 'GitHub Code Search Agent',
      expectedTools: ['github_search'],
      schema: githubCodeSearchOutputSchema,
      validPayload: {
        query: 'transformer pytorch',
        repositories: [
          {
            name: 'transformers',
            fullName: 'huggingface/transformers',
            url: 'https://github.com/huggingface/transformers',
            stars: 130000,
          },
        ],
      },
      invalidPayload: { query: 'test', repositories: [{ stars: 'not-a-number' }] },
    },
    {
      name: 'datasetAgent',
      agent: datasetAgent,
      id: 'dataset-agent',
      expectedName: 'Dataset Agent',
      expectedTools: ['huggingface_search'],
      schema: datasetOutputSchema,
      validPayload: {
        query: 'squad',
        datasets: [{ id: 'rajpurkar/squad', downloads: 500000 }],
        models: [{ id: 'bert-base-uncased', downloads: 10000000 }],
      },
      invalidPayload: { query: 'test' },
    },
  ];

  test.each(subAgentCases)(
    '$name initializes with correct metadata, tools, and structured output schema',
    async ({ agent: subAgent, id, expectedName, expectedTools, schema }) => {
      expect(subAgent).toBeInstanceOf(Agent);
      expect(subAgent.id as string).toBe(id);
      expect(subAgent.name).toBe(expectedName);

      const tools = await subAgent.listTools();
      for (const toolName of expectedTools) {
        expect(tools).toHaveProperty(toolName);
      }

      expect(schema).toBeDefined();
    },
  );

  test.each(subAgentCases)(
    '$name schema validates valid payload and rejects invalid payload',
    ({ schema, validPayload, invalidPayload }) => {
      const validResult = schema.safeParse(validPayload);
      expect(validResult.success).toBe(true);

      const invalidResult = schema.safeParse(invalidPayload);
      expect(invalidResult.success).toBe(false);
    },
  );
});
