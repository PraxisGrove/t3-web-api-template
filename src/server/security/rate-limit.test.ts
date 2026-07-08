import { describe, expect, it } from "vitest";

import { getClientIp } from "./rate-limit";

describe("getClientIp", () => {
	it("uses the first x-forwarded-for IP", () => {
		const request = new Request("https://example.com", {
			headers: {
				"x-forwarded-for": "203.0.113.10, 198.51.100.20",
			},
		});

		expect(getClientIp(request)).toBe("203.0.113.10");
	});

	it("falls back to unknown", () => {
		const request = new Request("https://example.com");

		expect(getClientIp(request)).toBe("unknown");
	});
});
