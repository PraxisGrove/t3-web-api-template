import "server-only";

import type { PrismaClient } from "../../../generated/prisma";

import type { CreatePostInput } from "./post.schema";

export async function createPost(db: PrismaClient, input: CreatePostInput) {
	return db.post.create({
		data: {
			name: input.name,
		},
	});
}

export async function getLatestPost(db: PrismaClient) {
	return db.post.findFirst({
		orderBy: { createdAt: "desc" },
	});
}

export async function listRecentPosts(db: PrismaClient, limit = 10) {
	return db.post.findMany({
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}
