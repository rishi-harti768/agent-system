import fs from 'node:fs';
import path from 'node:path';

export function getSafeOutputPath(filename: string, fallbackFilename: string): { outputDir: string; filePath: string } {
  const cwd = process.cwd();
  const projectBase = cwd.endsWith('scientific-researcher')
    ? cwd
    : path.resolve(cwd, 'scientific-researcher');
  const outputDir = path.resolve(projectBase, 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const safeBasename =
    path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_') || fallbackFilename;
  const filePath = path.resolve(outputDir, safeBasename);

  return { outputDir, filePath };
}
