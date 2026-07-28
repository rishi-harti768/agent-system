import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

let cachedPythonBinary: string | null = null;

function resolvePythonBinary(): string | null {
  if (cachedPythonBinary) {
    return cachedPythonBinary;
  }

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

  for (const binary of candidateBinaries) {
    try {
      const check = Bun.spawnSync([binary, '--version']);
      if (check.exitCode === 0) {
        cachedPythonBinary = binary;
        return binary;
      }
    } catch {
      // Try next binary candidate
    }
  }

  return null;
}

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
    const sandboxDir = path.resolve(import.meta.dirname, '..', '..', '..', 'sandbox');

    try {
      if (!fs.existsSync(sandboxDir)) {
        fs.mkdirSync(sandboxDir, { recursive: true });
      }

      // Enforce strict path isolation within sandboxDir
      const safeBasename = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_') || 'script.py';
      const filePath = path.resolve(sandboxDir, safeBasename);

      fs.writeFileSync(filePath, code, 'utf-8');

      const binary = resolvePythonBinary();
      if (!binary) {
        const executionTimeMs = Date.now() - startTime;
        return {
          success: false,
          exitCode: null,
          stdout: '',
          stderr: 'Python executable not found in PATH or environment.',
          timedOut: false,
          executionTimeMs,
          error: 'Python executable not found in PATH or environment.',
        };
      }

      let proc: any = null;
      try {
        proc = Bun.spawn([binary, filePath], {
          cwd: sandboxDir,
          stdout: 'pipe',
          stderr: 'pipe',
        });
      } catch (spawnErr) {
        const executionTimeMs = Date.now() - startTime;
        const errDetail = spawnErr instanceof Error ? spawnErr.message : String(spawnErr);
        return {
          success: false,
          exitCode: null,
          stdout: '',
          stderr: `Failed to spawn process: ${errDetail}`,
          timedOut: false,
          executionTimeMs,
          error: `Failed to spawn process: ${errDetail}`,
        };
      }

      let timedOut = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const timeoutPromise = new Promise<'timeout'>((resolve) => {
        timer = setTimeout(() => {
          timedOut = true;
          try {
            proc.kill(9); // SIGKILL to ensure process stdio pipes close immediately
          } catch {
            // Ignore kill errors if already terminated
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
