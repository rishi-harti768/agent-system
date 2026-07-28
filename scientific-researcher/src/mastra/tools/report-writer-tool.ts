import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

export const reportWriterTool = createTool({
  id: 'report_writer',
  description:
    'Write or update structured Markdown research reports in the scientific-researcher/output/ directory.',
  inputSchema: z.object({
    content: z.string().min(1, 'Report content cannot be empty'),
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
    filename = 'RESEARCH_REPORT.md',
  }: {
    content: string;
    filename?: string;
  }) => {
    const outputDir = path.resolve(
      import.meta.dirname,
      '..',
      '..',
      '..',
      'output',
    );

    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const safeBasename =
        path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_') ||
        'RESEARCH_REPORT.md';
      const filePath = path.resolve(outputDir, safeBasename);

      fs.writeFileSync(filePath, content, 'utf-8');
      const bytesWritten = Buffer.byteLength(content, 'utf-8');

      return {
        success: true,
        filePath,
        bytesWritten,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        filePath: path.join(outputDir, filename),
        bytesWritten: 0,
        error: errorMessage,
      };
    }
  },
});
