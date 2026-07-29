import { describe, expect, test } from 'bun:test';
import { Agent } from '@mastra/core/agent';

import { chiefResearchAgent as supervisorAgent } from './chief-research-agent';
import {
  reportGeneratorAgent,
  reportGeneratorOutputSchema,
} from './report-generator-agent';
import {
  presentationAgent,
  presentationOutputSchema,
} from './presentation-agent';

describe('Report & Presentation Output Artifact Agents', () => {
  describe('Supervisor Agent Delegation', () => {
    test('supervisor agent has reportGeneratorAgent and presentationAgent attached for delegation', async () => {
      expect(supervisorAgent).toBeInstanceOf(Agent);
      const subAgents = await supervisorAgent.listAgents();
      expect(subAgents).toHaveProperty('reportGeneratorAgent');
      expect(subAgents).toHaveProperty('presentationAgent');
    });
  });

  describe('reportGeneratorAgent', () => {
    test('initializes with correct id, name, tools, and structured output schema', () => {
      expect(reportGeneratorAgent).toBeInstanceOf(Agent);
      expect(reportGeneratorAgent.id).toBe('report-generator-agent');
      expect(reportGeneratorAgent.name).toBe('Report Generator Agent');

      const tools = reportGeneratorAgent.listTools();
      expect(tools).toHaveProperty('report_writer');
    });

    test('schema validates valid payload and rejects invalid payload', () => {
      const validPayload = {
        title: 'Autonomous Multi-Agent Systems Report',
        executiveSummary: 'Comprehensive synthesis of literature and experimental findings.',
        sections: [
          {
            heading: '1. Introduction',
            body: 'Multi-agent frameworks enable complex reasoning workflows.',
          },
        ],
        reportFilePath: 'scientific-researcher/output/RESEARCH_REPORT.md',
        success: true,
      };

      const parseResult = reportGeneratorOutputSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);

      const invalidPayload = {
        title: '',
        executiveSummary: 123,
      };

      const invalidResult = reportGeneratorOutputSchema.safeParse(invalidPayload);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('presentationAgent', () => {
    test('initializes with correct id, name, tools, and structured output schema', () => {
      expect(presentationAgent).toBeInstanceOf(Agent);
      expect(presentationAgent.id).toBe('presentation-agent');
      expect(presentationAgent.name).toBe('Presentation Agent');

      const tools = presentationAgent.listTools();
      expect(tools).toHaveProperty('presentation_writer');
    });

    test('schema validates valid payload and rejects invalid payload', () => {
      const validPayload = {
        title: 'Multi-Agent Research Presentation',
        slides: [
          {
            slideNumber: 1,
            title: 'Overview',
            bulletPoints: ['Point 1', 'Point 2'],
            codeSnippet: 'console.log("slide 1");',
          },
        ],
        presentationFilePath: 'scientific-researcher/output/PRESENTATION.html',
        success: true,
      };

      const parseResult = presentationOutputSchema.safeParse(validPayload);
      expect(parseResult.success).toBe(true);

      const invalidPayload = {
        title: 'Test',
        slides: 'invalid slides',
      };

      const invalidResult = presentationOutputSchema.safeParse(invalidPayload);
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('Memory Isolation', () => {
    test('reportGeneratorAgent and presentationAgent have isolated memory configured', () => {
      expect(reportGeneratorAgent.hasOwnMemory()).toBe(true);
      expect(presentationAgent.hasOwnMemory()).toBe(true);
    });
  });
});
