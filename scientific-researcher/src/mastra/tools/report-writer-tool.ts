import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs';
import { getSafeOutputPath } from './output-utils';
import { reportSectionSchema } from '../agents/schemas';

export interface ReportSectionInput {
  heading: string;
  body: string;
}

export function formatReportMarkdown(
  title?: string,
  executiveSummary?: string,
  sections?: ReportSectionInput[],
): string {
  const parts: string[] = [];
  if (title) parts.push(`# ${title}\n`);
  if (executiveSummary) parts.push(`## Executive Summary\n${executiveSummary}\n`);
  if (sections && sections.length > 0) {
    sections.forEach((sec) => {
      parts.push(`## ${sec.heading}\n${sec.body}\n`);
    });
  }
  return parts.join('\n');
}

export const reportWriterTool = createTool({
  id: 'report_writer',
  description:
    'Write or update structured Markdown research reports in the scientific-researcher/output/ directory.',
  inputSchema: z.object({
    content: z.string().optional().describe('Raw Markdown report content.'),
    title: z.string().optional().describe('Title of the research report.'),
    executiveSummary: z
      .string()
      .optional()
      .describe('Executive summary paragraph.'),
    sections: z
      .array(reportSectionSchema)
      .optional()
      .describe('Structured sections for the report.'),
    filename: z.string().optional().default('RESEARCH_REPORT.md'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
    bytesWritten: z.number(),
    error: z.string().optional(),
  }),
  execute: async ({
    content,
    title,
    executiveSummary,
    sections,
    filename = 'RESEARCH_REPORT.md',
  }: {
    content?: string;
    title?: string;
    executiveSummary?: string;
    sections?: ReportSectionInput[];
    filename?: string;
  }) => {
    try {
      let finalMarkdown = content || '';

      if (!finalMarkdown && (title || executiveSummary || (sections && sections.length > 0))) {
        finalMarkdown = formatReportMarkdown(title, executiveSummary, sections);
      }

      if (!finalMarkdown) {
        return {
          success: false,
          filePath: '',
          bytesWritten: 0,
          error: 'Either raw content or structured report sections must be provided.',
        };
      }

      const { filePath } = getSafeOutputPath(filename, 'RESEARCH_REPORT.md');
      fs.writeFileSync(filePath, finalMarkdown, 'utf-8');
      const bytesWritten = Buffer.byteLength(finalMarkdown, 'utf-8');

      return {
        success: true,
        filePath,
        bytesWritten,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        filePath: '',
        bytesWritten: 0,
        error: errorMessage,
      };
    }
  },
});
