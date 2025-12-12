import z from 'zod';

import {
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

export const CreateCountingDotsSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}),
  is_publish_immediately: StringToBooleanSchema.default(false),
  max_value: z.number().min(1).max(10).default(5),
  levels: z.number().min(1).max(10).default(5),
});

export type ICreateCountingDots = z.infer<typeof CreateCountingDotsSchema>;