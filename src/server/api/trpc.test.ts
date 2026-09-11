import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTRPCContext, createTRPCRouter, publicProcedure } from "./trpc";

const mocks = vi.hoisted(() => ({ limitRequest: vi.fn() }));
vi.mock("~/server/security/rate-limit", () => ({
	limitRequest: mocks.limitRequest,
}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/observability/logger", () => ({ logger: { info: vi.fn() } }));

const run = vi.fn(() => "ok");
const router = createTRPCRouter({
	read: publicProcedure.query(run),
	write: publicProcedure.mutation(run),
});

describe("tRPC rate limiting", () => {
	beforeEach(() => {
		run.mockClear();
		mocks.limitRequest.mockReset().mockResolvedValue({ success: true });
	});

	it("limits queries and mutations before executing their handlers", async () => {
		mocks.limitRequest.mockResolvedValue({ success: false });
		const caller = router.createCaller(
			await createTRPCContext({ headers: new Headers() }),
		);
		await expect(caller.read()).rejects.toMatchObject({
			code: "TOO_MANY_REQUESTS",
		});
		await expect(caller.write()).rejects.toMatchObject({
			code: "TOO_MANY_REQUESTS",
		});
		expect(run).not.toHaveBeenCalled();
	});

	it("does not execute handlers when the rate limit backend fails", async () => {
		mocks.limitRequest.mockRejectedValue(new Error("Redis unavailable"));
		const caller = router.createCaller(
			await createTRPCContext({ headers: new Headers() }),
		);
		await expect(caller.write()).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
		});
		expect(run).not.toHaveBeenCalled();
	});

	it("charges each operation in an HTTP batch and ignores spoofed RSC headers", async () => {
		mocks.limitRequest
			.mockResolvedValueOnce({ success: true })
			.mockResolvedValue({ success: false });
		const req = new Request(
			"https://example.com/api/trpc/write,write?batch=1",
			{
				method: "POST",
				headers: { "content-type": "application/json", "x-trpc-source": "rsc" },
				body: JSON.stringify({ "0": { json: null }, "1": { json: null } }),
			},
		);
		const response = await fetchRequestHandler({
			endpoint: "/api/trpc",
			req,
			router,
			createContext: () => createTRPCContext({ headers: req.headers }),
		});
		expect(response.status).toBe(207);
		expect(mocks.limitRequest).toHaveBeenCalledTimes(2);
		expect(mocks.limitRequest).toHaveBeenCalledWith(
			expect.objectContaining({ headers: req.headers }),
			"trpc:write",
		);
		expect(run).toHaveBeenCalledOnce();
		const results = await response.json();
		expect(results[1].error.json.data.code).toBe("TOO_MANY_REQUESTS");
	});
});
