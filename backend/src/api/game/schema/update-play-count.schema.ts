import z from 'zod';

export const UpdatePlayCountSchema = z.object({
  game_id: z.uuid().optional(),
  game: z.string().optional(), // Template slug or game name
}).refine(
  (data) => data.game_id || data.game,
  {
    message: 'Either game_id or game must be provided',
    path: ['game_id'],
  },
);

export type IUpdatePlayCount = z.infer<typeof UpdatePlayCountSchema>;
