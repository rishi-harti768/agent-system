import { describe, expect, test } from 'bun:test';
import { Agent } from '@mastra/core/agent';

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
  describe('paperSearchAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(paperSearchAgent).toBeInstanceOf(Agent);
      expect(paperSearchAgent.id).toBe('paper-search-agent');
      expect(paperSearchAgent.name).toBe('Paper Search Agent');
      expect(paperSearchAgent.getDescription()).toContain('arXiv');

      const tools = await paperSearchAgent.listTools();
      expect(tools).toHaveProperty('arxiv_search');
      expect(tools).toHaveProperty('semantic_scholar_search');
    });

    test('validates paperSearchOutputSchema with valid payload', () => {
      const validPayload = {
        query: 'transformer attention',
        totalFound: 1,
        papers: [
          {
            title: 'Attention Is All You Need',
            authors: ['Ashish Vaswani', 'Noam Shazeer'],
            abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.',
            url: 'https://arxiv.org/abs/1706.03762',
            publishedDate: '2017-06-12',
            citationCount: 100000,
            externalIds: { ArXiv: '1706.03762' },
            source: 'arXiv',
          },
        ],
      };

      const result = paperSearchOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid paperSearchOutputSchema payload', () => {
      const invalidPayload = {
        query: 'test',
        // missing totalFound and papers
      };

      const result = paperSearchOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('citationAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(citationAgent).toBeInstanceOf(Agent);
      expect(citationAgent.id).toBe('citation-agent');
      expect(citationAgent.name).toBe('Citation Agent');

      const tools = await citationAgent.listTools();
      expect(tools).toHaveProperty('semantic_scholar_search');
      expect(tools).toHaveProperty('arxiv_search');
    });

    test('validates citationOutputSchema with valid payload', () => {
      const validPayload = {
        targetPaperId: '1706.03762',
        title: 'Attention Is All You Need',
        citations: [
          {
            paperId: '2005.14165',
            title: 'Language Models are Few-Shot Learners',
            year: 2020,
            citationCount: 20000,
          },
        ],
        references: [
          {
            paperId: '1409.0473',
            title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
            year: 2014,
          },
        ],
        foundationalPapers: [
          {
            title: 'Sequence to Sequence Learning with Neural Networks',
            reason: 'Pioneered encoder-decoder seq2seq architectures.',
            influenceScore: 9.5,
          },
        ],
      };

      const result = citationOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid citationOutputSchema payload', () => {
      const invalidPayload = {
        targetPaperId: '123',
        // missing foundationalPapers
      };

      const result = citationOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('summarizationAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(summarizationAgent).toBeInstanceOf(Agent);
      expect(summarizationAgent.id).toBe('summarization-agent');
      expect(summarizationAgent.name).toBe('Summarization Agent');

      const tools = await summarizationAgent.listTools();
      expect(tools).toHaveProperty('web_fetch');
      expect(tools).toHaveProperty('arxiv_search');
      expect(tools).toHaveProperty('semantic_scholar_search');
    });

    test('validates summarizationOutputSchema with valid payload', () => {
      const validPayload = {
        paperTitle: 'Attention Is All You Need',
        summary: 'Proposes the Transformer architecture based solely on attention mechanisms.',
        keyContributions: ['Self-attention mechanism', 'Multi-head attention', 'Positional encoding'],
        methodology: 'Replaces recurrence with scaled dot-product self-attention layers.',
        limitations: ['High quadratic memory complexity with sequence length'],
        potentialApplications: ['Machine Translation', 'LLM pre-training'],
      };

      const result = summarizationOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid summarizationOutputSchema payload', () => {
      const invalidPayload = {
        paperTitle: 'Test Paper',
        summary: 'Short summary',
        // missing keyContributions
      };

      const result = summarizationOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('benchmarkAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(benchmarkAgent).toBeInstanceOf(Agent);
      expect(benchmarkAgent.id).toBe('benchmark-agent');
      expect(benchmarkAgent.name).toBe('Benchmark Agent');

      const tools = await benchmarkAgent.listTools();
      expect(tools).toHaveProperty('papers_with_code_search');
    });

    test('validates benchmarkOutputSchema with valid payload', () => {
      const validPayload = {
        query: 'ImageNet classification',
        benchmarks: [
          {
            taskName: 'Image Classification',
            dataset: 'ImageNet',
            sotaMetric: 'Top-1 Accuracy',
            topModel: 'CoAtNet-7',
            score: '90.88%',
            evaluationLeaderboard: [
              {
                modelName: 'CoAtNet-7',
                score: '90.88%',
                rank: 1,
              },
            ],
          },
        ],
      };

      const result = benchmarkOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid benchmarkOutputSchema payload', () => {
      const invalidPayload = {
        query: 'ImageNet',
        benchmarks: 'not-an-array',
      };

      const result = benchmarkOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('githubCodeSearchAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(githubCodeSearchAgent).toBeInstanceOf(Agent);
      expect(githubCodeSearchAgent.id).toBe('github-code-search-agent');
      expect(githubCodeSearchAgent.name).toBe('GitHub Code Search Agent');

      const tools = await githubCodeSearchAgent.listTools();
      expect(tools).toHaveProperty('github_search');
    });

    test('validates githubCodeSearchOutputSchema with valid payload', () => {
      const validPayload = {
        query: 'transformer pytorch',
        repositories: [
          {
            name: 'transformers',
            fullName: 'huggingface/transformers',
            description: 'State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.',
            url: 'https://github.com/huggingface/transformers',
            stars: 130000,
            language: 'Python',
            topics: ['deep-learning', 'pytorch', 'transformers'],
          },
        ],
      };

      const result = githubCodeSearchOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid githubCodeSearchOutputSchema payload', () => {
      const invalidPayload = {
        query: 'test',
        repositories: [{ stars: 'many' }], // stars must be a number
      };

      const result = githubCodeSearchOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('datasetAgent', () => {
    test('initializes correctly with attached tools', async () => {
      expect(datasetAgent).toBeInstanceOf(Agent);
      expect(datasetAgent.id).toBe('dataset-agent');
      expect(datasetAgent.name).toBe('Dataset Agent');

      const tools = await datasetAgent.listTools();
      expect(tools).toHaveProperty('huggingface_search');
    });

    test('validates datasetOutputSchema with valid payload', () => {
      const validPayload = {
        query: 'squad',
        datasets: [
          {
            id: 'rajpurkar/squad',
            description: 'Stanford Question Answering Dataset',
            downloads: 500000,
            tags: ['question-answering'],
            likes: 1200,
          },
        ],
        models: [
          {
            id: 'bert-base-uncased',
            pipeline_tag: 'fill-mask',
            downloads: 10000000,
            likes: 5000,
          },
        ],
      };

      const result = datasetOutputSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    test('rejects invalid datasetOutputSchema payload', () => {
      const invalidPayload = {
        query: 'test',
        // missing datasets and models
      };

      const result = datasetOutputSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
