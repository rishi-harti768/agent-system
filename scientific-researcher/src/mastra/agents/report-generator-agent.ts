import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { reportWriterTool } from '../tools/report-writer-tool';
import { DEFAULT_SUB_AGENT_MODEL } from './schemas';

export const reportSectionSchema = z.object({
  heading: z.string(),
  body: z.string(),
});

export const reportGeneratorOutputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  executiveSummary: z.string(),
  sections: z.array(reportSectionSchema),
  reportFilePath: z.string().optional(),
  success: z.boolean(),
});

export type ReportGeneratorOutput = z.infer<
  typeof reportGeneratorOutputSchema
>;

export const reportGeneratorAgent = new Agent({
  id: 'report-generator-agent',
  name: 'Report Generator Agent',
  description:
    'Specialized agent that compiles literature review findings, citations, benchmarks, gap analysis, and experimental results into a structured RESEARCH_REPORT.md document.',
  instructions: `You are an expert Report Generator Agent.
Your goal is to transform research synthesis, literature findings, benchmark statistics, and experimental code/results into a comprehensive, highly readable Markdown research report and save it to the output directory using the report_writer tool.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  tools: {
    report_writer: reportWriterTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(reportGeneratorOutputSchema),
    },
  },
});
