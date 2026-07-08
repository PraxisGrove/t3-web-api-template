import { z } from "zod";

export const createPostInputSchema = z.object({
	name: z.string().trim().min(1).max(120),
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;
