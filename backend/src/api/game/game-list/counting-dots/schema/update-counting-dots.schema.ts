import z from 'zod';

export const UpdateCountingDotsSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  thumbnail_image: z.any().optional(),
  max_value: z.number().min(1).max(20).optional(),
  levels: z.number().min(1).max(10).optional(),
  is_publish_immediately: z.boolean().optional(),
});

export type IUpdateCountingDots = z.infer<typeof UpdateCountingDotsSchema>;