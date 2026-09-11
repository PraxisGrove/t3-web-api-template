import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	createMemoryRateLimiter,
	getClientIp,
	limitRequest,
} from "./rate-limit";

const settings = vi.hoisted(() => ({
	RATE_LIMIT_IP_HEADER: "none",
	RATE_LIMIT_ENABLED: true,
	RATE_LIMIT_REQUESTS: 2,
	RATE_LIMIT_WINDOW_SECONDS: 60,
}));

vi.mock("~/env", () => ({ env: settings }));
vi.mock("~/server/observability/logger", () => ({
	logger: { debug: vi.fn() },
}));

afterEach(() => vi.useRealTimers());

describe("getClientIp", () => {
	beforeEach(() => {
		settings.RATE_LIMIT_IP_HEADER = "none";
	});

	it("ignores spoofed forwarding headers by default", () => {
		expect(
			getClientIp({
				headers: new Headers({
					"x-forwarded-for": "203.0.113.10",
					"cf-connecting-ip": "198.51.100.20",
					"x-real-ip": "192.0.2.1",
				}),
			}),
		).toBe("unknown");
	});

	it.each(["x-forwarded-for", "x-real-ip", "cf-connecting-ip"])(
		"uses only the explicitly trusted %s header",
		(header) => {
			settings.RATE_LIMIT_IP_HEADER = header;
			expect(
				getClientIp({ headers: new Headers({ [header]: "203.0.113.10" }) }),
			).toBe("203.0.113.10");
		},
	);

	it.each(["", "garbage", "203.0.113.10, 198.51.100.20", "fe80::1%eth0"])(
		"does not trust malformed or chained IPs: %s",
		(value) => {
			settings.RATE_LIMIT_IP_HEADER = "x-forwarded-for";
			expect(
				getClientIp({
					headers: new Headers({
						"x-forwarded-for": value,
						"x-real-ip": "203.0.113.10",
					}),
				}),
			).toBe("unknown");
		},
	);

	it("does not fall back to an untrusted header", () => {
		settings.RATE_LIMIT_IP_HEADER = "cf-connecting-ip";
		expect(
			getClientIp({
				headers: new Headers({ "x-forwarded-for": "203.0.113.10" }),
			}),
		).toBe("unknown");
	});

	it("normalizes equivalent IPv6 addresses to one identity", () => {
		settings.RATE_LIMIT_IP_HEADER = "x-real-ip";
		for (const ip of [
			"2001:0DB8:0000:0000:0000:0000:0000:0001",
			"2001:db8::1",
		]) {
			expect(getClientIp({ headers: new Headers({ "x-real-ip": ip }) })).toBe(
				"2001:db8::1",
			);
		}
	});
});

describe("memory rate limiting", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	it("enforces the quota and resets exactly when the window expires", () => {
		const limit = createMemoryRateLimiter({
			limit: 2,
			windowMs: 1000,
			maxBuckets: 2,
		});
		expect(limit("a")).toEqual({
			limit: 2,
			remaining: 1,
			reset: 1000,
			success: true,
		});
		expect(limit("a").success).toBe(true);
		expect(limit("a")).toEqual({
			limit: 2,
			remaining: 0,
			reset: 1000,
			success: false,
		});
		vi.setSystemTime(999);
		expect(limit("a").success).toBe(false);
		vi.setSystemTime(1000);
		expect(limit("a")).toEqual({
			limit: 2,
			remaining: 1,
			reset: 2000,
			success: true,
		});
	});

	it("rejects excess identities without evicting active quotas", () => {
		const limit = createMemoryRateLimiter({
			limit: 1,
			windowMs: 1000,
			maxBuckets: 2,
		});
		expect(limit("a").success).toBe(true);
		vi.setSystemTime(100);
		expect(limit("b").success).toBe(true);
		expect(limit("c")).toEqual({
			limit: 1,
			remaining: 0,
			reset: 1000,
			success: false,
		});
		expect(limit("a").success).toBe(false);
		// Expired identities are removed even when they never make another request.
		vi.setSystemTime(1000);
		expect(limit("c").success).toBe(true);
		expect(limit("b").success).toBe(false);
		expect(limit("d").success).toBe(false);
		vi.setSystemTime(1100);
		expect(limit("d").success).toBe(true);
	});

	it("keeps cleanup ordered when an older identity is accessed again", () => {
		const limit = createMemoryRateLimiter({
			limit: 2,
			windowMs: 1000,
			maxBuckets: 2,
		});
		limit("a");
		vi.setSystemTime(100);
		limit("b");
		limit("a");
		vi.setSystemTime(1000);
		expect(limit("c").success).toBe(true);
		expect(limit("b").remaining).toBe(0);
	});

	it("shares a route quota when forwarding headers are not trusted", async () => {
		settings.RATE_LIMIT_IP_HEADER = "none";
		for (let i = 0; i < 3; i++) {
			const result = await limitRequest(
				{ headers: new Headers({ "x-forwarded-for": `203.0.113.${i}` }) },
				"test:shared",
			);
			expect(result.success).toBe(i < 2);
		}
	});
});
