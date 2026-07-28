import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
export const pythonSandboxTool = createTool({
  id: 'python_sandbox',
  description: 'Execute Python code safely inside an isolated local sandbox directory with strict execution timeout guards.',
  inputSchema: z.object({
    code: z.string().describe('Python code snippet to execute.'),
    filename: z.string().optional().default('script.py').describe('Filename to save code as in the sandbox directory.'),
    timeoutMs: z.number().optional().default(30_000).describe('Execution timeout in milliseconds (max 30000ms).'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    exitCode: z.number().nullable(),
    stdout: z.string(),
    stderr: z.string(),
    timedOut: z.boolean(),
    executionTimeMs: z.number(),
    error: z.string().optional(),
  }),
  execute: async ({
    code,
    filename = 'script.py',
    timeoutMs = 30_000,
  }: {
    code: string;
    filename?: string;
    timeoutMs?: number;
  }) => {
    const startTime = Date.now();
    const effectiveTimeout = Math.min(Math.max(timeoutMs, 100), 30_000);
    const sandboxDir = path.resolve(process.cwd(), 'sandbox');

    try {
      if (!fs.existsSync(sandboxDir)) {
        fs.mkdirSync(sandboxDir, { recursive: true });
      }

      const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_') || 'script.py';
      const filePath = path.join(sandboxDir, safeFilename);

      fs.writeFileSync(filePath, code, 'utf-8');

      const userProfile = process.env.USERPROFILE || process.env.HOME || '';
      const rawCandidates = [
        process.env.PYTHON_PATH,
        'python',
        'python3',
        'py',
        path.join(userProfile, '.local', 'bin', 'python.exe'),
        path.join(userProfile, '.local', 'bin', 'python'),
      ];

      const candidateBinaries = rawCandidates.filter((b): b is string => {
        if (!b) return false;
        return !b.includes(path.sep) || fs.existsSync(b);
      });

      let proc: any = null;
      let lastError: unknown = null;

      for (const binary of candidateBinaries) {
        try {
          proc = Bun.spawn([binary, filePath], {
            cwd: sandboxDir,
            stdout: 'pipe',
            stderr: 'pipe',
          });
          if (proc) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!proc) {
        const executionTimeMs = Date.now() - startTime;
        const errDetail = lastError instanceof Error ? lastError.message : String(lastError);
        return {
          success: false,
          exitCode: null,
          stdout: '',
          stderr: `Failed to spawn Python process: ${errDetail}`,
          timedOut: false,
          executionTimeMs,
          error: `Failed to spawn Python process: ${errDetail}`,
        };
      }

      let timedOut = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill();
          } catch {
            // Ignore kill errors if process already exited
          }
          resolve('timeout');
        }, effectiveTimeout);
      });

      const exitPromise = proc.exited.then(() => 'exited');

      const outcome = await Promise.race([exitPromise, timeoutPromise]);

      if (timer) {
        clearTimeout(timer);
      }

      const executionTimeMs = Date.now() - startTime;

      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      if (outcome === 'timeout' || timedOut) {
        return {
          success: false,
          exitCode: proc.exitCode ?? null,
          stdout,
          stderr: stderr || 'Execution timed out',
          timedOut: true,
          executionTimeMs,
          error: `Execution timed out after ${effectiveTimeout}ms`,
        };
      }

      const exitCode = proc.exitCode;
      const success = exitCode === 0;

      return {
        success,
        exitCode,
        stdout,
        stderr,
        timedOut: false,
        executionTimeMs,
      };
    } catch (err: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        exitCode: null,
        stdout: '',
        stderr: errorMessage,
        timedOut: false,
        executionTimeMs,
        error: errorMessage,
      };
    }
  },
});
