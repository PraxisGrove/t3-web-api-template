import { beforeEach, describe, expect, it, vi } from "vitest";

import { limitRequest } from "./rate-limit";

const mocks = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock("~/env", () => ({
	env: {
		RATE_LIMIT_ENABLED: true,
		RATE_LIMIT_IP_HEADER: "x-real-ip",
		UPSTASH_REDIS_REST_URL: "https://redis.example.invalid",
		UPSTASH_REDIS_REST_TOKEN: "test-only",
	},
}));
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => ({
	Ratelimit: class {
		static slidingWindow() {
			return {};
		}
		limit = mocks.limit;
	},
}));

describe("shared Redis rate limiting", () => {
	beforeEach(() => {
		mocks.limit.mockReset();
	});

	it("uses the route and trusted IP for a shared quota", async () => {
		mocks.limit.mockResolvedValue({
			success: false,
			limit: 60,
			remaining: 0,
			reset: 1000,
		});
		const request = { headers: new Headers({ "x-real-ip": "203.0.113.1" }) };
		await expect(
			limitRequest(request, "trpc:post.create"),
		).resolves.toMatchObject({ success: false });
		expect(mocks.limit).toHaveBeenCalledWith("trpc:post.create:203.0.113.1");
	});

	it("rejects the SDK's fail-open timeout response", async () => {
		mocks.limit.mockResolvedValue({ success: true, reason: "timeout" });
		await expect(
			limitRequest({ headers: new Headers() }, "test:timeout"),
		).rejects.toThrow("Rate limit backend timed out");
	});

	it("propagates backend errors without granting a fresh memory quota", async () => {
		mocks.limit.mockRejectedValue(new Error("Redis unavailable"));
		await expect(
			limitRequest({ headers: new Headers() }, "test:error"),
		).rejects.toThrow("Redis unavailable");
	});
});
