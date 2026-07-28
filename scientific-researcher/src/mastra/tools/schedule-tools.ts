import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const startScheduleTool = createTool({
  id: 'start_schedule',
  description: 'Start a recurring schedule for an agent.',
  inputSchema: z.object({
    schedule: z.string().describe('Cron expression for when to run.'),
    prompt: z.string().describe('Prompt to run on the schedule.'),
    threadId: z.string().describe('Thread ID for the scheduled execution context.'),
    resourceId: z.string().describe('Resource ID for the scheduled execution context.'),
  }),
  execute: async ({ schedule, prompt, threadId, resourceId }, { mastra }) => {
    return mastra!.schedules.create({
      agentId: 'agent',
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
