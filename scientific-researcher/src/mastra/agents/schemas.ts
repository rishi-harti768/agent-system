import { z } from 'zod';

export const paperSourceSchema = z.enum([
  'arXiv',
  'Semantic Scholar',
  'Papers with Code',
  'Other',
]);

export const basePaperMetadataSchema = z.object({
  paperId: z.string().optional(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  abstract: z.string().optional(),
  url: z.string().optional(),
  publishedDate: z.string().optional(),
  year: z.number().nullable().optional(),
  citationCount: z.number().nullable().optional(),
  influentialCitationCount: z.number().nullable().optional(),
  externalIds: z.record(z.string()).optional(),
  source: paperSourceSchema.optional(),
});

export type PaperSource = z.infer<typeof paperSourceSchema>;
export type BasePaperMetadata = z.infer<typeof basePaperMetadataSchema>;
