import "server-only";

import { isIP } from "node:net";
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
const limitInMemory = createMemoryRateLimiter({
	limit: rateLimitRequests,
	windowMs,
	maxBuckets: env.RATE_LIMIT_MAX_BUCKETS ?? 10000,
});

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

export function getClientIp(request: Pick<Request, "headers">) {
	const header = env.RATE_LIMIT_IP_HEADER ?? "none";
	if (header === "none") return "unknown";

	// Only trust a header overwritten by the deployment's proxy. Do not fall
	// back to other headers, or accept an unsanitized forwarding chain.
	const ip = request.headers.get(header)?.trim() ?? "";
	const version = isIP(ip);
	if (version === 4) return ip;
	if (version === 6 && !ip.includes("%")) {
		return new URL(`http://[${ip}]/`).hostname.slice(1, -1);
	}
	return "unknown";
}

export async function limitRequest(
	request: Pick<Request, "headers">,
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
		const result = await upstash.limit(identifier);
		// The SDK permits requests on timeout by default. Keep the API closed
		// when the shared backend cannot confirm the quota.
		if (result.reason === "timeout") {
			throw new Error("Rate limit backend timed out");
		}
		return result;
	}

	logger.debug({ route }, "Using in-memory rate limiter");
	return limitInMemory(identifier);
}

export function createMemoryRateLimiter(options: {
	limit: number;
	windowMs: number;
	maxBuckets: number;
}) {
	const buckets = new Map<string, MemoryBucket>();
	return (identifier: string): RateLimitResult => {
		const now = Date.now();
		// Fixed windows expire in insertion order. Updating a count never moves
		// its key, so cleanup only visits expired buckets and needs no timer.
		for (const [key, bucket] of buckets) {
			if (bucket.reset > now) break;
			buckets.delete(key);
		}

		let bucket = buckets.get(identifier);
		if (bucket === undefined) {
			if (buckets.size >= options.maxBuckets) {
				// Reject new identities instead of evicting active limits, which
				// would let a caller reset its quota by rotating identities.
				return {
					limit: options.limit,
					remaining: 0,
					reset: buckets.values().next().value?.reset ?? now + options.windowMs,
					success: false,
				};
			}
			bucket = { count: 0, reset: now + options.windowMs };
			buckets.set(identifier, bucket);
		}

		const success = bucket.count < options.limit;
		if (success) bucket.count += 1;
		return {
			limit: options.limit,
			remaining: Math.max(options.limit - bucket.count, 0),
			reset: bucket.reset,
			success,
		};
	};
}
