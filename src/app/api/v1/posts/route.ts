import { db } from "~/server/db";
import { captureServerEvent } from "~/server/observability/analytics";
import { logger } from "~/server/observability/logger";
import { preflight } from "~/server/security/cors";
import { limitRestRequest } from "~/server/security/rate-limit";
import { jsonError, jsonOk } from "~/server/security/rest-response";
import { createPost, listRecentPosts } from "~/server/services/post";
import { createPostInputSchema } from "~/server/services/post.schema";

export function OPTIONS(request: Request) {
	return preflight(request);
}

export async function GET(request: Request) {
	const rateLimit = await limitRestRequest(request, "GET /api/v1/posts");
	if (!rateLimit.success) {
		return jsonError(request, "rate_limited", "Too many requests", 429, {
			limit: rateLimit.limit,
			remaining: rateLimit.remaining,
			reset: rateLimit.reset,
		});
	}

	const posts = await listRecentPosts(db);
	logger.info({ count: posts.length }, "REST posts listed");

	return jsonOk(request, {
		data: posts,
		meta: {
			count: posts.length,
		},
	});
}

export async function POST(request: Request) {
	const rateLimit = await limitRestRequest(request, "POST /api/v1/posts");
	if (!rateLimit.success) {
		return jsonError(request, "rate_limited", "Too many requests", 429, {
			limit: rateLimit.limit,
			remaining: rateLimit.remaining,
			reset: rateLimit.reset,
		});
	}

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return jsonError(request, "invalid_request", "Invalid JSON body", 400);
	}

	const parsed = createPostInputSchema.safeParse(json);

	if (!parsed.success) {
		return jsonError(
			request,
			"invalid_request",
			"Invalid request body",
			400,
			parsed.error.flatten(),
		);
	}

	const post = await createPost(db, parsed.data);
	logger.info({ postId: post.id }, "REST post created");
	captureServerEvent("anonymous", "post_created", {
		postId: post.id,
		source: "rest",
	});

	return jsonOk(request, { data: post }, { status: 201 });
}
