import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "~/env";
import { logger } from "~/server/observability/logger";

type RateLimitResult = {
	limit: number;
	remaining: number;
	reset: number;
	success: boolean;
};

type MemoryBucket = {
	count: number;
	reset: number;
};

const rateLimitEnabled = env.RATE_LIMIT_ENABLED ?? true;
const rateLimitRequests = env.RATE_LIMIT_REQUESTS ?? 60;
const rateLimitWindowSeconds = env.RATE_LIMIT_WINDOW_SECONDS ?? 60;
const windowMs = rateLimitWindowSeconds * 1000;
const memoryBuckets = new Map<string, MemoryBucket>();

const upstash =
	env.UPSTASH_REDIS_REST_URL === undefined ||
	env.UPSTASH_REDIS_REST_TOKEN === undefined
		? null
		: new Ratelimit({
				redis: new Redis({
					token: env.UPSTASH_REDIS_REST_TOKEN,
					url: env.UPSTASH_REDIS_REST_URL,
				}),
				limiter: Ratelimit.slidingWindow(
					rateLimitRequests,
					`${rateLimitWindowSeconds} s`,
				),
			});

export function getClientIp(request: Request) {
	const forwardedFor = request.headers.get("x-forwarded-for");
	const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

	return (
		firstForwardedIp ??
		request.headers.get("cf-connecting-ip") ??
		request.headers.get("x-real-ip") ??
		"unknown"
	);
}

export async function limitRestRequest(
	request: Request,
	route: string,
): Promise<RateLimitResult> {
	if (!rateLimitEnabled) {
		return {
			limit: rateLimitRequests,
			remaining: rateLimitRequests,
			reset: Date.now() + windowMs,
			success: true,
		};
	}

	const identifier = `${route}:${getClientIp(request)}`;

	if (upstash !== null) {
		return upstash.limit(identifier);
	}

	logger.debug({ route }, "Using in-memory rate limiter");
	return limitInMemory(identifier);
}

function limitInMemory(identifier: string): RateLimitResult {
	const now = Date.now();
	const existing = memoryBuckets.get(identifier);
	const bucket =
		existing === undefined || existing.reset <= now
			? {
					count: 0,
					reset: now + windowMs,
				}
			: existing;

	bucket.count += 1;
	memoryBuckets.set(identifier, bucket);

	const remaining = Math.max(rateLimitRequests - bucket.count, 0);

	return {
		limit: rateLimitRequests,
		remaining,
		reset: bucket.reset,
		success: bucket.count <= rateLimitRequests,
	};
}
