import { db } from "~/server/db";
import { captureServerEvent } from "~/server/observability/analytics";
import { logger } from "~/server/observability/logger";
import { createRestMutation, createRestQuery } from "~/server/rest/endpoint";
import { preflight } from "~/server/security/cors";
import { createPost, listRecentPosts } from "~/server/services/post";
import { createPostInputSchema } from "~/server/services/post.schema";

export function OPTIONS(request: Request) {
	return preflight(request);
}

export const GET = createRestQuery({
	route: "GET /api/v1/posts",
	handler: async () => {
		const posts = await listRecentPosts(db);
		logger.info({ count: posts.length }, "REST posts listed");

		return {
			body: {
				data: posts,
				meta: {
					count: posts.length,
				},
			},
		};
	},
});

export const POST = createRestMutation({
	route: "POST /api/v1/posts",
	input: createPostInputSchema,
	handler: async ({ input }) => {
		const post = await createPost(db, input);
		logger.info({ postId: post.id }, "REST post created");
		captureServerEvent("anonymous", "post_created", {
			postId: post.id,
			source: "rest",
		});

		return {
			body: { data: post },
			init: { status: 201 },
		};
	},
});
