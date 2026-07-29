import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from '@mastra/duckdb';
import { MastraCompositeStore } from '@mastra/core/storage';
import {
  MastraStorageExporter,
  MastraPlatformExporter,
  Observability,
  SensitiveDataFilter,
} from '@mastra/observability';
import { askUserTool } from '@mastra/core/tools';
import {
  chiefResearchAgent,
  paperSearchAgent,
  citationAgent,
  summarizationAgent,
  benchmarkAgent,
  githubCodeSearchAgent,
  datasetAgent,
  gapDetectionAgent,
  noveltyCheckerAgent,
  experimentPlannerAgent,
  reportGeneratorAgent,
  presentationAgent,
} from './agents';
import { startScheduleTool, stopScheduleTool } from './tools/schedule-tools';
import { webFetchTool } from './tools/web-fetch-tool';
import { arxivSearchTool } from './tools/arxiv-tool';
import { semanticScholarSearchTool } from './tools/semantic-scholar-tool';
import { papersWithCodeSearchTool } from './tools/papers-with-code-tool';
import { githubSearchTool } from './tools/github-tool';
import { huggingfaceSearchTool } from './tools/huggingface-tool';
import { pythonSandboxTool } from './tools/python-sandbox-tool';
import { reportWriterTool } from './tools/report-writer-tool';
import { presentationWriterTool } from './tools/presentation-writer-tool';
import { MastraEditor } from "@mastra/editor";

export const mastra = new Mastra({
  editor: new MastraEditor(),
  agents: {
    chiefResearchAgent,
    paperSearchAgent,
    citationAgent,
    summarizationAgent,
    benchmarkAgent,
    githubCodeSearchAgent,
    datasetAgent,
    gapDetectionAgent,
    noveltyCheckerAgent,
    experimentPlannerAgent,
    reportGeneratorAgent,
    presentationAgent,
  },
  tools: {
    askUserTool,
    startScheduleTool,
    stopScheduleTool,
    webFetchTool,
    arxivSearchTool,
    semanticScholarSearchTool,
    papersWithCodeSearchTool,
    githubSearchTool,
    huggingfaceSearchTool,
    pythonSandboxTool,
    reportWriterTool,
    presentationWriterTool,
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: process.env.TURSO_DATABASE_URL || 'file:./mastra.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [new MastraStorageExporter(), new MastraPlatformExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
