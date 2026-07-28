import { describe, expect, test } from 'bun:test';
import { Agent } from '@mastra/core/agent';
import { Mastra } from '@mastra/core/mastra';

import { chiefResearchAgent } from './agents/chief-research-agent';
import { mastra } from './index';

describe('Chief Research Agent & Mastra Integration', () => {
  describe('Chief Research Agent Definition', () => {
    test('chiefResearchAgent is defined with correct id, name, and description', async () => {
      expect(chiefResearchAgent).toBeInstanceOf(Agent);
      expect(chiefResearchAgent.id).toBe('chief-research-agent');
      expect(chiefResearchAgent.name).toBe('Chief Research Agent');
      const description = await chiefResearchAgent.getDescription();
      expect(description).toContain('Central Supervisor Agent');
    });

    test('chiefResearchAgent delegates to all 11 specialized sub-agents', async () => {
      const subAgents = await chiefResearchAgent.listAgents();
      expect(Object.keys(subAgents).length).toBe(11);
      expect(subAgents).toHaveProperty('paperSearchAgent');
      expect(subAgents).toHaveProperty('citationAgent');
      expect(subAgents).toHaveProperty('summarizationAgent');
      expect(subAgents).toHaveProperty('benchmarkAgent');
      expect(subAgents).toHaveProperty('githubCodeSearchAgent');
      expect(subAgents).toHaveProperty('datasetAgent');
      expect(subAgents).toHaveProperty('gapDetectionAgent');
      expect(subAgents).toHaveProperty('noveltyCheckerAgent');
      expect(subAgents).toHaveProperty('experimentPlannerAgent');
      expect(subAgents).toHaveProperty('reportGeneratorAgent');
      expect(subAgents).toHaveProperty('presentationAgent');
    });

    test('chiefResearchAgent contains all research tools', async () => {
      const tools = await chiefResearchAgent.listTools();
      expect(tools).toHaveProperty('arxiv_search');
      expect(tools).toHaveProperty('semantic_scholar_search');
      expect(tools).toHaveProperty('papers_with_code_search');
      expect(tools).toHaveProperty('github_search');
      expect(tools).toHaveProperty('huggingface_search');
      expect(tools).toHaveProperty('python_sandbox');
      expect(tools).toHaveProperty('report_writer');
      expect(tools).toHaveProperty('presentation_writer');
    });
  });

  describe('Mastra Studio & Instance Integration', () => {
    test('mastra instance is properly configured with agents and storage', () => {
      expect(mastra).toBeInstanceOf(Mastra);

      const registeredAgent = mastra.getAgent('chief-research-agent');
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent.name).toBe('Chief Research Agent');

      const namedAgent = mastra.getAgent('chiefResearchAgent');
      expect(namedAgent).toBeDefined();

      const legacyAgent = mastra.getAgent('agent');
      expect(legacyAgent).toBeDefined();
    });

    test('end-to-end full research execution instructions & workflow structure', async () => {
      const instructions = await chiefResearchAgent.getInstructions();
      expect(instructions).toContain('Phase 1: Literature Search');
      expect(instructions).toContain('Phase 2: Code & Dataset Discovery');
      expect(instructions).toContain('Phase 3: Synthesis, Novelty & Verification');
      expect(instructions).toContain('Phase 4: Output Artifact Generation');
      expect(instructions).toContain('RESEARCH_REPORT.md');
      expect(instructions).toContain('PRESENTATION.html');
    });
  });
});
