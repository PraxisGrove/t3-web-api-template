import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createPost, getLatestPost } from "~/server/services/post";
import { createPostInputSchema } from "~/server/services/post.schema";

export const postRouter = createTRPCRouter({
	hello: publicProcedure.query(() => {
		return {
			greeting: "Hello from the internal tRPC API.",
		};
	}),

	create: publicProcedure
		.input(createPostInputSchema)
		.mutation(async ({ ctx, input }) => {
			return createPost(ctx.db, input);
		}),

	getLatest: publicProcedure.query(async ({ ctx }) => {
		const post = await getLatestPost(ctx.db);

		return post ?? null;
	}),
});
