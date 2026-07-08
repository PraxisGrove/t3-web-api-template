import { describe, expect, it } from "vitest";

import { createPostInputSchema } from "./post.schema";

describe("createPostInputSchema", () => {
	it("trims and accepts a valid post name", () => {
		const result = createPostInputSchema.parse({ name: "  Hello T3  " });

		expect(result).toEqual({ name: "Hello T3" });
	});

	it("rejects an empty post name", () => {
		const result = createPostInputSchema.safeParse({ name: "   " });

		expect(result.success).toBe(false);
	});
});
