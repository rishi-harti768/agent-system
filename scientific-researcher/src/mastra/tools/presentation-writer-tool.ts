import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

export interface SlideInput {
  title: string;
  bulletPoints?: string[];
  codeSnippet?: string;
}

export function generatePresentationHtml(
  title: string,
  slides: SlideInput[],
): string {
  const slidesHtml = slides
    .map((slide, index) => {
      const bulletsHtml = slide.bulletPoints
        ? `<ul>${slide.bulletPoints.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      const codeHtml = slide.codeSnippet
        ? `<pre><code>${escapeHtml(slide.codeSnippet)}</code></pre>`
        : '';

      return `
        <div class="slide ${index === 0 ? 'active' : ''}" data-slide="${index + 1}">
          <div class="slide-header">
            <span class="slide-number">Slide ${index + 1} of ${slides.length}</span>
            <h2>${escapeHtml(slide.title)}</h2>
          </div>
          <div class="slide-content">
            ${bulletsHtml}
            ${codeHtml}
          </div>
        </div>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: rgba(30, 41, 59, 0.8);
      --accent-color: #38bdf8;
      --text-color: #f8fafc;
      --text-muted: #94a3b8;
      --code-bg: #020617;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
    }
    .deck-container {
      width: 90%;
      max-width: 960px;
      height: 600px;
      position: relative;
      background: var(--card-bg);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      padding: 40px;
      display: flex;
      flex-direction: column;
    }
    .main-title {
      font-size: 1.5rem;
      color: var(--accent-color);
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .slide {
      display: none;
      flex: 1;
      flex-direction: column;
      animation: fadeIn 0.4s ease-in-out;
    }
    .slide.active {
      display: flex;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .slide-header {
      margin-bottom: 24px;
    }
    .slide-number {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .slide-header h2 {
      font-size: 2rem;
      margin-top: 4px;
      color: #ffffff;
    }
    .slide-content {
      flex: 1;
      overflow-y: auto;
      font-size: 1.125rem;
      line-height: 1.6;
    }
    .slide-content ul {
      margin-left: 24px;
      margin-bottom: 20px;
    }
    .slide-content li {
      margin-bottom: 12px;
      color: var(--text-color);
    }
    pre {
      background-color: var(--code-bg);
      border: 1px solid #334155;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.95rem;
      color: #e2e8f0;
      overflow-x: auto;
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    button {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #0369a1; }
    button:disabled { background: #334155; cursor: not-allowed; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="deck-container">
    <h1 class="main-title">${escapeHtml(title)}</h1>
    ${slidesHtml}
    <div class="controls">
      <button id="prevBtn" onclick="changeSlide(-1)">Previous</button>
      <span id="counter">1 / ${slides.length}</span>
      <button id="nextBtn" onclick="changeSlide(1)">Next</button>
    </div>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const counter = document.getElementById('counter');

    function updateDeck() {
      slides.forEach((s, idx) => {
        s.classList.toggle('active', idx === currentSlide);
      });
      counter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === totalSlides - 1;
    }

    function changeSlide(direction) {
      currentSlide = Math.max(0, Math.min(totalSlides - 1, currentSlide + direction));
      updateDeck();
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
      if (e.key === 'ArrowLeft') changeSlide(-1);
    });

    updateDeck();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const presentationWriterTool = createTool({
  id: 'presentation_writer',
  description:
    'Write or update interactive animated HTML slide decks in the scientific-researcher/output/ directory.',
  inputSchema: z.object({
    content: z
      .string()
      .optional()
      .describe('Raw HTML content for the presentation slide deck.'),
    title: z
      .string()
      .optional()
      .describe('Title of the presentation slide deck.'),
    slides: z
      .array(
        z.object({
          title: z.string(),
          bulletPoints: z.array(z.string()).optional(),
          codeSnippet: z.string().optional(),
        }),
      )
      .optional()
      .describe('Structured list of presentation slides.'),
    filename: z.string().optional().default('PRESENTATION.html'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
    bytesWritten: z.number(),
    slideCount: z.number(),
    error: z.string().optional(),
  }),
  execute: async ({
    content,
    title,
    slides,
    filename = 'PRESENTATION.html',
  }: {
    content?: string;
    title?: string;
    slides?: SlideInput[];
    filename?: string;
  }) => {
    const outputDir = path.resolve(
      import.meta.dirname,
      '..',
      '..',
      '..',
      'output',
    );

    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let finalHtml = content || '';
      let slideCount = 0;

      if (!finalHtml && slides && slides.length > 0) {
        finalHtml = generatePresentationHtml(
          title || 'Scientific Research Presentation',
          slides,
        );
        slideCount = slides.length;
      } else if (finalHtml) {
        // Estimate slide count from raw HTML if present
        const match = finalHtml.match(/class=["']slide/g);
        slideCount = match ? match.length : 1;
      }

      if (!finalHtml) {
        return {
          success: false,
          filePath: path.join(outputDir, filename),
          bytesWritten: 0,
          slideCount: 0,
          error:
            'Either raw HTML content or structured slides must be provided.',
        };
      }

      const safeBasename =
        path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_') ||
        'PRESENTATION.html';
      const filePath = path.resolve(outputDir, safeBasename);

      fs.writeFileSync(filePath, finalHtml, 'utf-8');
      const bytesWritten = Buffer.byteLength(finalHtml, 'utf-8');

      return {
        success: true,
        filePath,
        bytesWritten,
        slideCount,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        filePath: path.join(outputDir, filename),
        bytesWritten: 0,
        slideCount: 0,
        error: errorMessage,
      };
    }
  },
});
