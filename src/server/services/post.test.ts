import { describe, expect, it, vi } from "vitest";

import { createPost, listRecentPosts } from "./post";

describe("post service", () => {
	it("creates a post through Prisma", async () => {
		const create = vi.fn(async ({ data }: { data: { name: string } }) => ({
			id: 1,
			name: data.name,
		}));
		const db = { post: { create } } as unknown as Parameters<
			typeof createPost
		>[0];

		await expect(createPost(db, { name: "Hello from test" })).resolves.toEqual({
			id: 1,
			name: "Hello from test",
		});
		expect(create).toHaveBeenCalledWith({
			data: {
				name: "Hello from test",
			},
		});
	});

	it("lists recent posts newest first", async () => {
		const findMany = vi.fn(async () => []);
		const db = {
			post: { findMany },
		} as unknown as Parameters<typeof listRecentPosts>[0];

		await listRecentPosts(db, 5);

		expect(findMany).toHaveBeenCalledWith({
			orderBy: { createdAt: "desc" },
			take: 5,
		});
	});
});
