import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createRestMutation, createRestQuery } from "./endpoint";

const mocks = vi.hoisted(() => ({
	limitRestRequest: vi.fn(),
	loggerError: vi.fn(),
}));

vi.mock("~/server/observability/logger", () => ({
	logger: {
		error: mocks.loggerError,
	},
}));

vi.mock("~/server/security/rate-limit", () => ({
	limitRestRequest: mocks.limitRestRequest,
}));

describe("REST endpoint execution", () => {
	beforeEach(() => {
		mocks.loggerError.mockReset();
		mocks.limitRestRequest.mockReset();
		mocks.limitRestRequest.mockResolvedValue({
			limit: 60,
			remaining: 59,
			reset: 123,
			success: true,
		});
	});

	it("runs a query handler and wraps the response body", async () => {
		const handler = vi.fn(async () => ({
			body: {
				data: ["post"],
			},
		}));
		const GET = createRestQuery({
			route: "GET /api/v1/posts",
			handler,
		});

		const response = await GET(new Request("https://example.com/api/v1/posts"));

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ data: ["post"] });
		expect(handler).toHaveBeenCalledOnce();
		expect(mocks.limitRestRequest).toHaveBeenCalledWith(
			expect.any(Request),
			"GET /api/v1/posts",
		);
	});

	it("returns a rate limit error before running the handler", async () => {
		mocks.limitRestRequest.mockResolvedValue({
			limit: 60,
			remaining: 0,
			reset: 456,
			success: false,
		});
		const handler = vi.fn(async () => ({ body: { data: [] } }));
		const GET = createRestQuery({
			route: "GET /api/v1/posts",
			handler,
		});

		const response = await GET(new Request("https://example.com/api/v1/posts"));

		expect(response.status).toBe(429);
		await expect(response.json()).resolves.toEqual({
			error: {
				code: "rate_limited",
				details: {
					limit: 60,
					remaining: 0,
					reset: 456,
				},
				message: "Too many requests",
			},
		});
		expect(handler).not.toHaveBeenCalled();
	});

	it("parses mutation input before calling the handler", async () => {
		const handler = vi.fn(async ({ input }: { input: { name: string } }) => ({
			body: {
				data: input,
			},
			init: {
				status: 201,
			},
		}));
		const POST = createRestMutation({
			route: "POST /api/v1/posts",
			input: z.object({
				name: z.string().trim().min(1),
			}),
			handler,
		});

		const response = await POST(
			new Request("https://example.com/api/v1/posts", {
				body: JSON.stringify({ name: "  Hello  " }),
				method: "POST",
			}),
		);

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toEqual({
			data: {
				name: "Hello",
			},
		});
		expect(handler).toHaveBeenCalledWith({
			input: {
				name: "Hello",
			},
			request: expect.any(Request),
		});
	});

	it("returns invalid_request for invalid JSON", async () => {
		const handler = vi.fn(async () => ({ body: { data: null } }));
		const POST = createRestMutation({
			route: "POST /api/v1/posts",
			input: z.object({
				name: z.string(),
			}),
			handler,
		});

		const response = await POST(
			new Request("https://example.com/api/v1/posts", {
				body: "{",
				method: "POST",
			}),
		);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: {
				code: "invalid_request",
				message: "Invalid JSON body",
			},
		});
		expect(handler).not.toHaveBeenCalled();
	});

	it("returns invalid_request for invalid mutation input", async () => {
		const handler = vi.fn(async () => ({ body: { data: null } }));
		const POST = createRestMutation({
			route: "POST /api/v1/posts",
			input: z.object({
				name: z.string().min(1),
			}),
			handler,
		});

		const response = await POST(
			new Request("https://example.com/api/v1/posts", {
				body: JSON.stringify({ name: "" }),
				method: "POST",
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error.code).toBe("invalid_request");
		expect(body.error.message).toBe("Invalid request body");
		expect(body.error.details.fieldErrors.name).toEqual([
			"String must contain at least 1 character(s)",
		]);
		expect(handler).not.toHaveBeenCalled();
	});

	it("returns an internal error when the handler throws", async () => {
		const GET = createRestQuery({
			route: "GET /api/v1/posts",
			handler: async () => {
				throw new Error("database unavailable");
			},
		});

		const response = await GET(new Request("https://example.com/api/v1/posts"));

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			error: {
				code: "internal_error",
				message: "Unexpected server error",
			},
		});
		expect(mocks.loggerError).toHaveBeenCalledOnce();
	});

	it("allows handlers to return a Response escape hatch", async () => {
		const GET = createRestQuery({
			route: "GET /api/v1/export",
			handler: async () => new Response("ok", { status: 202 }),
		});

		const response = await GET(
			new Request("https://example.com/api/v1/export"),
		);

		expect(response.status).toBe(202);
		await expect(response.text()).resolves.toBe("ok");
	});
});
