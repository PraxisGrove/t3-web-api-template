import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { setTimeout } from "node:timers/promises";

// Run only against a disposable database: this checks real API writes.
const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const deadline = Date.now() + 60_000;
let ready = false;
while (Date.now() < deadline) {
	try {
		const response = await fetch(new URL("/api/v1/posts", baseUrl), {
			signal: AbortSignal.timeout(2000),
		});
		if (response.ok) {
			await response.json();
			ready = true;
			break;
		}
		await response.body?.cancel();
	} catch {
		// The server may still be starting.
	}
	await setTimeout(1000);
}
assert(ready, "API/database did not become ready within 60 seconds");

const restName = `REST smoke ${randomUUID()}`;
const created = await fetch(new URL("/api/v1/posts", baseUrl), {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({ name: restName }),
	signal: AbortSignal.timeout(10_000),
});
assert.equal(created.status, 201, await created.clone().text());
const restPost = (await created.json()).data;
assert.equal(restPost.name, restName);
assert(Number.isInteger(restPost.id));

const trpcName = `tRPC smoke ${randomUUID()}`;
const trpcCreated = await fetch(new URL("/api/trpc/post.create", baseUrl), {
	method: "POST",
	headers: { "content-type": "application/json" },
	body: JSON.stringify({ json: { name: trpcName } }),
	signal: AbortSignal.timeout(10_000),
});
assert.equal(trpcCreated.status, 200, await trpcCreated.clone().text());

const listed = await fetch(new URL("/api/v1/posts", baseUrl), {
	signal: AbortSignal.timeout(10_000),
});
assert.equal(listed.status, 200);
const posts = (await listed.json()).data;
assert(posts.some((post) => post.id === restPost.id && post.name === restName));
assert(posts.some((post) => post.name === trpcName));
console.log("Smoke test passed: REST and tRPC writes persisted to Postgres.");
