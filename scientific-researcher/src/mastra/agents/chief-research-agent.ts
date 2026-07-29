import { pathToFileURL } from 'node:url';

import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { askUserTool } from '@mastra/core/tools';
import { LocalFilesystem, LocalSandbox, WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';

import { webFetchTool } from '../tools/web-fetch-tool';
import { startScheduleTool, stopScheduleTool } from '../tools/schedule-tools';
import { arxivSearchTool } from '../tools/arxiv-tool';
import { semanticScholarSearchTool } from '../tools/semantic-scholar-tool';
import { papersWithCodeSearchTool } from '../tools/papers-with-code-tool';
import { githubSearchTool } from '../tools/github-tool';
import { huggingfaceSearchTool } from '../tools/huggingface-tool';
import { pythonSandboxTool } from '../tools/python-sandbox-tool';
import { reportWriterTool } from '../tools/report-writer-tool';
import { presentationWriterTool } from '../tools/presentation-writer-tool';

import { paperSearchAgent } from './paper-search-agent';
import { citationAgent } from './citation-agent';
import { summarizationAgent } from './summarization-agent';
import { benchmarkAgent } from './benchmark-agent';
import { githubCodeSearchAgent } from './github-code-search-agent';
import { datasetAgent } from './dataset-agent';
import { gapDetectionAgent } from './gap-detection-agent';
import { noveltyCheckerAgent } from './novelty-checker-agent';
import { experimentPlannerAgent } from './experiment-planner-agent';
import { reportGeneratorAgent } from './report-generator-agent';
import { presentationAgent } from './presentation-agent';

const workspacePath = 'workspace';

const workspace = new Workspace({
  id: 'agent-workspace',
  name: 'Agent Workspace',
  filesystem: new LocalFilesystem({
    basePath: workspacePath,
  }),
  sandbox: new LocalSandbox({
    workingDirectory: workspacePath,
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true,
    },
  },
});

export const chiefResearchAgent = new Agent({
  id: 'chief-research-agent',
  name: 'Chief Research Agent',
  description:
    'Central Supervisor Agent orchestrating autonomous scientific research workflows across 11 specialized sub-agents.',
  instructions: `You are the Chief Research Agent, the central supervisor of an Autonomous Scientific Researcher system.
Your mission is to execute end-to-end scientific literature discovery, citation analysis, benchmark comparison, open-source code & dataset mapping, research gap identification, novelty checking, verification experiment execution, and report/presentation generation.

Follow this 4-phase research execution plan when given a research topic or query:

1. **Phase 1: Literature Search, Citations & Benchmarks**
   - Delegate to \`paperSearchAgent\` to search arXiv and Semantic Scholar for literature.
   - Delegate to \`citationAgent\` to build citation trees and identify foundational papers.
   - Delegate to \`summarizationAgent\` to condense paper abstracts, contributions, and limitations.
   - Delegate to \`benchmarkAgent\` to extract SOTA metrics and leaderboards from Papers with Code.

2. **Phase 2: Code & Dataset Discovery**
   - Delegate to \`githubCodeSearchAgent\` to locate open-source PyTorch/TensorFlow repositories.
   - Delegate to \`datasetAgent\` to map Hugging Face Hub datasets and pretrained models.

3. **Phase 3: Synthesis, Novelty & Verification**
   - Delegate to \`gapDetectionAgent\` to synthesize retrieved literature and pinpoint unaddressed gaps.
   - Delegate to \`noveltyCheckerAgent\` to score proposed ideas against prior art.
   - Delegate to \`experimentPlannerAgent\` to design verification code and execute it in the Python sandbox (\`python_sandbox\`).

4. **Phase 4: Output Artifact Generation**
   - Delegate to \`reportGeneratorAgent\` and execute \`report_writer\` to generate \`RESEARCH_REPORT.md\`.
   - Delegate to \`presentationAgent\` and execute \`presentation_writer\` to build interactive \`PRESENTATION.html\`.

Ask concise clarifying questions when needed. Provide clear summaries of generated artifacts.
For local workspace changes, end with a plain-text URL using ${pathToFileURL(`${workspacePath}/`).href}.
`,
  model: 'google/gemini-3.5-flash',
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
  agents: {
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
  memory: new Memory({
    options: {
      generateTitle: true,
      observationalMemory: {
        model: 'google/gemini-3.5-flash',
      },
    },
  }),
  workspace,
  tools: {
    ask_user: askUserTool,
    start_schedule: startScheduleTool,
    stop_schedule: stopScheduleTool,
    web_fetch: webFetchTool,
    ...(process.env.GOOGLE_SEARCH_API_KEY ? { web_search: google.tools.googleSearch({}) } : {}),
    arxiv_search: arxivSearchTool,
    semantic_scholar_search: semanticScholarSearchTool,
    papers_with_code_search: papersWithCodeSearchTool,
    github_search: githubSearchTool,
    huggingface_search: huggingfaceSearchTool,
    python_sandbox: pythonSandboxTool,
    report_writer: reportWriterTool,
    presentation_writer: presentationWriterTool,
  },
  signals: [new TaskSignalProvider()],
});

