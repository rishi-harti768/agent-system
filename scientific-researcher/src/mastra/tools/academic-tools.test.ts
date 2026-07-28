import { describe, expect, it, afterEach, mock } from 'bun:test';
import { arxivSearchTool } from './arxiv-tool';
import { semanticScholarSearchTool } from './semantic-scholar-tool';
import { papersWithCodeSearchTool } from './papers-with-code-tool';

const originalFetch = globalThis.fetch;

describe('Academic Data Tools', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('arxivSearchTool', () => {
    it('parses arXiv XML response and returns structured paper metadata', async () => {
      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2301.00001v1</id>
    <published>2023-01-01T00:00:00Z</published>
    <title>  Attention Is All You Need  </title>
    <summary>   We propose Transformer model...   </summary>
    <author><name>Ashish Vaswani</name></author>
    <author><name>Noam Shazeer</name></author>
    <link href="http://arxiv.org/abs/2301.00001v1" rel="alternate" type="text/html"/>
    <link title="pdf" href="http://arxiv.org/pdf/2301.00001v1" rel="related" type="application/pdf"/>
  </entry>
</feed>`;

      globalThis.fetch = mock(async () => {
        return new Response(mockXml, {
          status: 200,
          headers: { 'Content-Type': 'application/xml' },
        });
      }) as unknown as typeof fetch;

      const result = await (arxivSearchTool.execute as Function)({
        query: 'Transformer',
        maxResults: 1,
      });

      expect(result.query).toBe('Transformer');
      expect(result.count).toBe(1);
      expect(result.results[0].title).toBe('Attention Is All You Need');
      expect(result.results[0].authors).toEqual(['Ashish Vaswani', 'Noam Shazeer']);
      expect(result.results[0].pdfUrl).toBe('http://arxiv.org/pdf/2301.00001v1');
    });
  });

  describe('semanticScholarSearchTool', () => {
    it('fetches and returns paper details and citations from Semantic Scholar', async () => {
      const mockJsonResponse = {
        data: [
          {
            paperId: 's2-12345',
            title: 'Deep Residual Learning',
            abstract: 'We present a residual learning framework...',
            authors: [{ name: 'Kaiming He' }, { name: 'Xiangyu Zhang' }],
            citationCount: 150000,
            influentialCitationCount: 20000,
            url: 'https://www.semanticscholar.org/paper/s2-12345',
            citations: [{ paperId: 's2-999', title: 'Followup paper' }],
            references: [{ paperId: 's2-000', title: 'Prior paper' }],
          },
        ],
      };

      globalThis.fetch = mock(async () => {
        return new Response(JSON.stringify(mockJsonResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;

      const result = await (semanticScholarSearchTool.execute as Function)({
        query: 'ResNet',
        limit: 1,
      });

      expect(result.query).toBe('ResNet');
      expect(result.count).toBe(1);
      expect(result.results[0].title).toBe('Deep Residual Learning');
      expect(result.results[0].authors).toEqual(['Kaiming He', 'Xiangyu Zhang']);
      expect(result.results[0].citationCount).toBe(150000);
      expect(result.results[0].citations?.[0].title).toBe('Followup paper');
    });
  });

  describe('papersWithCodeSearchTool', () => {
    it('fetches search results, tasks, and benchmark evaluation metrics from Papers with Code', async () => {
      const mockJsonResponse = {
        count: 1,
        results: [
          {
            id: 'paper-pwc-1',
            paper: {
              id: 'paper-pwc-1',
              title: 'GPT-4 Technical Report',
              abstract: 'We report on GPT-4...',
              url_pdf: 'https://arxiv.org/pdf/2303.08774.pdf',
            },
            repository: {
              url: 'https://github.com/openai/gpt-4',
            },
            tasks: [{ name: 'Language Modelling' }],
            methods: [{ name: 'Transformer' }],
            evaluations: [
              {
                task: { name: 'MMLU Benchmark' },
                dataset: 'MMLU',
                metric_name: 'Accuracy',
                metric_value: 86.4,
              },
            ],
          },
        ],
      };

      globalThis.fetch = mock(async () => {
        return new Response(JSON.stringify(mockJsonResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;

      const result = await (papersWithCodeSearchTool.execute as Function)({
        query: 'GPT-4',
        limit: 1,
      });

      expect(result.query).toBe('GPT-4');
      expect(result.count).toBe(1);
      expect(result.results[0].title).toBe('GPT-4 Technical Report');
      expect(result.results[0].repoUrl).toBe('https://github.com/openai/gpt-4');
      expect(result.results[0].tasks).toEqual(['Language Modelling']);
      expect(result.results[0].benchmarks?.[0]).toEqual({
        task: 'MMLU Benchmark',
        dataset: 'MMLU',
        metric: 'Accuracy',
        value: '86.4',
      });
    });
  });
});
