import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { githubSearchTool } from './github-tool';
import { huggingfaceSearchTool } from './huggingface-tool';
import { pythonSandboxTool } from './python-sandbox-tool';
import fs from 'node:fs';
import path from 'node:path';

describe('Code, Dataset, and Execution Sandbox Tools', () => {
  describe('githubSearchTool', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('searches GitHub repositories and returns formatted results', async () => {
      globalThis.fetch = mock(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('api.github.com/search/repositories')) {
          return new Response(
            JSON.stringify({
              total_count: 1,
              items: [
                {
                  name: 'diffusers',
                  full_name: 'huggingface/diffusers',
                  description: 'State-of-the-art diffusion models in PyTorch',
                  html_url: 'https://github.com/huggingface/diffusers',
                  stargazers_count: 25000,
                  forks_count: 4000,
                  language: 'Python',
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as unknown as typeof globalThis.fetch;

      const result = await (githubSearchTool.execute as Function)({
        query: 'diffusion',
        type: 'repositories',
        maxResults: 5,
      });

      expect(result.query).toBe('diffusion');
      expect(result.type).toBe('repositories');
      expect(result.count).toBe(1);
      expect(result.results[0]).toEqual({
        name: 'diffusers',
        fullName: 'huggingface/diffusers',
        description: 'State-of-the-art diffusion models in PyTorch',
        url: 'https://github.com/huggingface/diffusers',
        stars: 25000,
        forks: 4000,
        language: 'Python',
      });
    });

    it('handles GitHub API error status gracefully by returning empty results', async () => {
      globalThis.fetch = mock(async () => {
        return new Response('API Rate Limit Exceeded', { status: 403 });
      }) as unknown as typeof globalThis.fetch;

      const result = await (githubSearchTool.execute as Function)({
        query: 'rate_limit_test',
      });

      expect(result.query).toBe('rate_limit_test');
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('huggingfaceSearchTool', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('searches Hugging Face models and datasets', async () => {
      globalThis.fetch = mock(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('huggingface.co/api/models')) {
          return new Response(
            JSON.stringify([
              {
                id: 'meta-llama/Llama-3-8B',
                modelId: 'meta-llama/Llama-3-8B',
                downloads: 500000,
                likes: 12000,
                tags: ['text-generation', 'llama'],
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Not found', { status: 404 });
      }) as unknown as typeof globalThis.fetch;

      const result = await (huggingfaceSearchTool.execute as Function)({
        query: 'Llama-3',
        type: 'models',
        maxResults: 5,
      });

      expect(result.query).toBe('Llama-3');
      expect(result.type).toBe('models');
      expect(result.count).toBe(1);
      expect(result.results[0]).toEqual({
        id: 'meta-llama/Llama-3-8B',
        name: 'meta-llama/Llama-3-8B',
        downloads: 500000,
        likes: 12000,
        url: 'https://huggingface.co/meta-llama/Llama-3-8B',
        tags: ['text-generation', 'llama'],
      });
    });

    it('handles Hugging Face API errors gracefully', async () => {
      globalThis.fetch = mock(async () => {
        return new Response('Internal Server Error', { status: 500 });
      }) as unknown as typeof globalThis.fetch;

      const result = await (huggingfaceSearchTool.execute as Function)({
        query: 'error_test',
        type: 'datasets',
      });

      expect(result.query).toBe('error_test');
      expect(result.count).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('pythonSandboxTool', () => {
    const sandboxDir = path.resolve(process.cwd(), 'sandbox');

    afterEach(() => {
      if (fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
    });

    it('executes valid Python code in the isolated sandbox directory', async () => {
      const code = 'import sys; print(f"Hello Sandbox from Python {sys.version_info.major}")';
      const result = await (pythonSandboxTool.execute as Function)({
        code,
        filename: 'test_hello.py',
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello Sandbox from Python');
      expect(result.timedOut).toBe(false);
      expect(typeof result.executionTimeMs).toBe('number');
    });

    it('captures Python error output when execution fails', async () => {
      const code = 'raise ValueError("Explicit sandbox error test")';
      const result = await (pythonSandboxTool.execute as Function)({
        code,
        filename: 'test_error.py',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('ValueError: Explicit sandbox error test');
      expect(result.timedOut).toBe(false);
    });

    it('terminates processes that exceed timeout guard', async () => {
      const code = 'import time; time.sleep(10)';
      const result = await (pythonSandboxTool.execute as Function)({
        code,
        filename: 'test_timeout.py',
        timeoutMs: 500, // 500ms timeout for fast unit testing
      });

      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
      expect(result.error).toContain('timed out');
    });
  });
});
