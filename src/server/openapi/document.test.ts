import { describe, expect, it } from "vitest";

import { openApiDocument } from "./document";

describe("openApiDocument", () => {
	it("documents the posts REST endpoints", () => {
		expect(openApiDocument.openapi).toBe("3.1.0");
		expect(openApiDocument.paths["/posts"].get.operationId).toBe(
			"listRecentPosts",
		);
		expect(openApiDocument.paths["/posts"].post.operationId).toBe("createPost");
	});

	it("documents rate limit responses for REST endpoints", () => {
		expect(openApiDocument.paths["/posts"].get.responses["429"]).toBeDefined();
		expect(openApiDocument.paths["/posts"].post.responses["429"]).toBeDefined();
	});
});
