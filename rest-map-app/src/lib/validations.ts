import { z } from 'zod';

export const spotTypeSchema = z.enum(['toilet', 'smoking']);
export const smokingTypeSchema = z.enum(['designated_area', 'inside_ok', 'outdoor_ok', 'heated_only', 'unclear']);
export const confidenceSchema = z.enum(['sure', 'maybe', 'unsure']);
export const reportReasonSchema = z.enum(['illegal_or_danger', 'outdated', 'harassment', 'wrong_location', 'other']);

export const createSpotSchema = z.object({
  type: spotTypeSchema,
  title: z.string().max(100).optional(),
  description: z.string().min(20, '説明は20文字以上必要です').max(1000),
  evidence_hint: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  // Toilet specific
  toilet_is_free: z.boolean().optional(),
  toilet_open_24h: z.boolean().optional(),
  toilet_barrier_free: z.boolean().optional(),
  // Smoking specific
  smoking_type: smokingTypeSchema.optional(),
  smoking_ashtray: z.boolean().optional(),
  // Agreement
  agreed_to_rules: z.literal(true, {
    errorMap: () => ({ message: '利用規約への同意が必要です' }),
  }),
});

export const createReviewSchema = z.object({
  spot_id: z.string().uuid(),
  body: z.string().min(10, '口コミは10文字以上必要です').max(1000),
  confidence: confidenceSchema,
  visited_at: z.string().optional(),
});

export const createReportSchema = z.object({
  target_type: z.enum(['spot', 'review']),
  target_id: z.string().uuid(),
  reason: reportReasonSchema,
  note: z.string().max(500).optional(),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
