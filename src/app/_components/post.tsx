"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
	const [latestPost] = api.post.getLatest.useSuspenseQuery();

	const utils = api.useUtils();
	const [name, setName] = useState("");
	const createPost = api.post.create.useMutation({
		onSuccess: async () => {
			await utils.post.invalidate();
			setName("");
		},
	});

	return (
		<div className="w-full max-w-md space-y-4">
			{latestPost ? (
				<p className="truncate text-slate-200">
					Latest post via tRPC: {latestPost.name}
				</p>
			) : (
				<p className="text-slate-300">No posts yet. Create one below.</p>
			)}
			<form
				className="flex flex-col gap-3"
				onSubmit={(e) => {
					e.preventDefault();
					createPost.mutate({ name });
				}}
			>
				<input
					className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white outline-none"
					onChange={(e) => setName(e.target.value)}
					placeholder="Post title"
					type="text"
					value={name}
				/>
				<button
					className="rounded-full bg-cyan-400 px-10 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
					disabled={createPost.isPending}
					type="submit"
				>
					{createPost.isPending ? "Creating..." : "Create post"}
				</button>
			</form>
		</div>
	);
}
