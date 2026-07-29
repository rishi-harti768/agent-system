import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const startScheduleTool = createTool({
  id: 'start_schedule',
  description: 'Start a recurring schedule for an agent.',
  inputSchema: z.object({
    schedule: z
      .string()
      .regex(
        /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/[0-9]+)\s+(\*|([0-9]|1[0-9]|2[0-3])|\*\/[0-9]+)\s+(\*|([1-9]|[12][0-9]|3[01])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-2])|\*\/[0-9]+)\s+(\*|([0-6])|\*\/[0-9]+)$/,
        'Invalid cron expression format (expected standard 5-part cron syntax e.g. "0 0 * * *")',
      )
      .describe('Cron expression for when to run.'),
    prompt: z.string().describe('Prompt to run on the schedule.'),
    agentId: z.string().optional().default('chief-research-agent').describe('ID of the target agent.'),
    threadId: z.string().optional().describe('Thread ID for the scheduled execution context.'),
    resourceId: z.string().optional().describe('Resource ID for the scheduled execution context.'),
  }),
  execute: async ({ schedule, prompt, agentId = 'chief-research-agent', threadId, resourceId }, { mastra }) => {
    return mastra!.schedules.create({
      agentId,
      cron: schedule,
      prompt,
      threadId,
      resourceId,
    });
  },
});

export const stopScheduleTool = createTool({
  id: 'stop_schedule',
  description: 'Stop a schedule by pausing it.',
  inputSchema: z.object({
    scheduleId: z.string().describe('Schedule id returned by start_schedule.'),
  }),
  execute: async ({ scheduleId }, { mastra }) => {
    return mastra!.schedules.pause(scheduleId);
  },
});
