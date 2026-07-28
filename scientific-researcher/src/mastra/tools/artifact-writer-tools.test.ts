import { describe, expect, test, afterEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

import { reportWriterTool } from './report-writer-tool';
import { presentationWriterTool } from './presentation-writer-tool';

const outputDir = path.resolve(import.meta.dirname, '..', '..', '..', 'output');

describe('Artifact Writer Tools', () => {
  afterEach(() => {
    // Clean up test output files if created
    const testReport = path.join(outputDir, 'TEST_REPORT.md');
    const defaultReport = path.join(outputDir, 'RESEARCH_REPORT.md');
    const testDeck = path.join(outputDir, 'TEST_PRESENTATION.html');
    if (fs.existsSync(testReport)) fs.unlinkSync(testReport);
    if (fs.existsSync(defaultReport)) fs.unlinkSync(defaultReport);
    if (fs.existsSync(testDeck)) fs.unlinkSync(testDeck);
  });

  describe('reportWriterTool', () => {
    test('has correct id and description', () => {
      expect(reportWriterTool.id).toBe('report_writer');
      expect(reportWriterTool.description.toLowerCase()).toContain('markdown');
    });

    test('writes markdown report file into output directory', async () => {
      const markdownContent = `# Autonomous Scientific Research Report

## Executive Summary
This report summarizes recent advances in multi-agent research frameworks.

## Key Findings
- Agent systems improve research workflow efficiency.
- Native HTTP tools provide reliable API access.
`;

      const result = await (reportWriterTool.execute as Function)({
        content: markdownContent,
        filename: 'TEST_REPORT.md',
      });

      expect(result.success).toBe(true);
      expect(result.bytesWritten).toBeGreaterThan(0);
      expect(result.filePath).toContain('TEST_REPORT.md');
      expect(fs.existsSync(result.filePath)).toBe(true);

      const savedContent = fs.readFileSync(result.filePath, 'utf-8');
      expect(savedContent).toBe(markdownContent);
    });

    test('writes default RESEARCH_REPORT.md when filename is omitted', async () => {
      const defaultReportPath = path.join(outputDir, 'RESEARCH_REPORT.md');

      const result = await (reportWriterTool.execute as Function)({
        content: '# Default Research Report\n\nContent goes here.',
      });

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(defaultReportPath);
      expect(fs.existsSync(defaultReportPath)).toBe(true);
    });
  });

  describe('presentationWriterTool', () => {
    test('has correct id and description', () => {
      expect(presentationWriterTool.id).toBe('presentation_writer');
      expect(presentationWriterTool.description.toLowerCase()).toContain('html slide decks');
    });

    test('writes direct HTML content into output directory', async () => {
      const rawHtml = `<!DOCTYPE html>
<html>
<head><title>Research Presentation</title></head>
<body><h1>Slide 1: Overview</h1></body>
</html>`;

      const result = await (presentationWriterTool.execute as Function)({
        content: rawHtml,
        filename: 'TEST_PRESENTATION.html',
      });

      expect(result.success).toBe(true);
      expect(result.bytesWritten).toBeGreaterThan(0);
      expect(result.filePath).toContain('TEST_PRESENTATION.html');
      expect(fs.existsSync(result.filePath)).toBe(true);

      const savedContent = fs.readFileSync(result.filePath, 'utf-8');
      expect(savedContent).toBe(rawHtml);
    });

    test('generates standalone animated HTML slide deck from structured slides', async () => {
      const title = 'Multi-Agent Autonomous Research';
      const slides = [
        {
          title: 'Introduction & Vision',
          bulletPoints: [
            'Automates literature search across arXiv & Semantic Scholar',
            'Integrates Python code sandbox for experiment verification',
          ],
        },
        {
          title: 'Experimental Benchmarks',
          bulletPoints: [
            'SOTA accuracy on benchmark tasks',
            '30s execution timeout for sandbox safety',
          ],
          codeSnippet: 'print("Hello from sandbox")',
        },
      ];

      const result = await (presentationWriterTool.execute as Function)({
        title,
        slides,
        filename: 'TEST_PRESENTATION.html',
      });

      expect(result.success).toBe(true);
      expect(result.slideCount).toBe(2);
      expect(fs.existsSync(result.filePath)).toBe(true);

      const generatedHtml = fs.readFileSync(result.filePath, 'utf-8');
      expect(generatedHtml).toContain('<!DOCTYPE html>');
      expect(generatedHtml).toContain(title);
      expect(generatedHtml).toContain('Introduction &amp; Vision');
      expect(generatedHtml).toContain('print(&quot;Hello from sandbox&quot;)');
      expect(generatedHtml).toContain('script'); // CSS/JS animation interactivity
    });
  });
});
