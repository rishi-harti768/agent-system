import { Agent } from '@mastra/core/agent';
import { toStandardSchema } from '@mastra/core/schema';
import { z } from 'zod';

import { pythonSandboxTool } from '../tools/python-sandbox-tool';
import { DEFAULT_SUB_AGENT_MODEL } from './schemas';

export const experimentDesignSchema = z.object({
  objective: z.string(),
  variables: z.array(z.string()).optional(),
  methodology: z.string(),
});

export const experimentExecutionResultSchema = z.object({
  success: z.boolean(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().optional(),
  metrics: z.record(z.union([z.string(), z.number()])).optional(),
});

export const experimentPlannerOutputSchema = z.object({
  hypothesis: z.string().min(1, 'Hypothesis cannot be empty'),
  experimentDesign: experimentDesignSchema,
  code: z.string(),
  executionResult: experimentExecutionResultSchema.optional(),
  conclusions: z.array(z.string()).optional(),
});

export type ExperimentPlannerOutput = z.infer<
  typeof experimentPlannerOutputSchema
>;

export const experimentPlannerAgent = new Agent({
  id: 'experiment-planner-agent',
  name: 'Experiment Planner Agent',
  description:
    'Specialized agent that designs verification experiment plans, generates Python code, and runs code via the Python sandbox tool to validate research hypotheses.',
  instructions: `You are an expert Experiment Planner & Sandbox Verification Agent.
Your goal is to formulate verification experiments for testing research hypotheses, write clear executable Python scripts, execute them safely via the Python sandbox tool, and interpret the experimental results.`,
  model: DEFAULT_SUB_AGENT_MODEL,
  tools: {
    python_sandbox: pythonSandboxTool,
  },
  defaultOptions: {
    structuredOutput: {
      schema: toStandardSchema(experimentPlannerOutputSchema),
    },
  },
});
