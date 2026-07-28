import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const arxivSearchTool = createTool({
  id: 'arxiv_search',
  description: 'Search arXiv for academic papers and return structured titles, abstracts, authors, and PDF URLs.',
  inputSchema: z.object({
    query: z.string().describe('Search query string for arXiv papers.'),
    maxResults: z.number().optional().default(5).describe('Maximum number of paper results to return.'),
  }),
  outputSchema: z.object({
    query: z.string(),
    count: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        abstract: z.string(),
        authors: z.array(z.string()),
        pdfUrl: z.string(),
        published: z.string(),
      })
    ),
  }),
  execute: async ({ query, maxResults = 5 }: { query: string; maxResults?: number }) => {
    const formattedQuery = encodeURIComponent(query);
    const url = `http://export.arxiv.org/api/query?search_query=all:${formattedQuery}&start=0&max_results=${maxResults}`;

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mastra Scientific Researcher Agent/1.0' },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        throw new Error(`arXiv API responded with status ${response.status}`);
      }

      const xmlText = await response.text();
      const results = parseArxivXml(xmlText);

      return {
        query,
        count: results.length,
        results,
      };
    } catch {
      return {
        query,
        count: 0,
        results: [],
      };
    }
  },
});

function parseArxivXml(xml: string) {
  const entries: Array<{
    id: string;
    title: string;
    abstract: string;
    authors: string[];
    pdfUrl: string;
    published: string;
  }> = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const idMatch = /<id>([\s\S]*?)<\/id>/.exec(entryXml);
    const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(entryXml);
    const summaryMatch = /<summary>([\s\S]*?)<\/summary>/.exec(entryXml);
    const publishedMatch = /<published>([\s\S]*?)<\/published>/.exec(entryXml);

    const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g;
    const authors: string[] = [];
    let authorMatch: RegExpExecArray | null;
    while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    let pdfUrl = '';
    const pdfLinkMatch = /<link[^>]*title="pdf"[^>]*href="([^"]+)"/.exec(entryXml);
    if (pdfLinkMatch) {
      pdfUrl = pdfLinkMatch[1];
    } else {
      const fallbackPdfMatch = /<link[^>]*href="([^"]+)"[^>]*type="application\/pdf"/.exec(entryXml);
      if (fallbackPdfMatch) {
        pdfUrl = fallbackPdfMatch[1];
      } else if (idMatch) {
        pdfUrl = idMatch[1].trim().replace('/abs/', '/pdf/');
      }
    }

    entries.push({
      id: idMatch ? idMatch[1].trim() : '',
      title: titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '',
      abstract: summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '',
      authors,
      pdfUrl,
      published: publishedMatch ? publishedMatch[1].trim() : '',
    });
  }

  return entries;
}
