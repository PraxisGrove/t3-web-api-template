import { LatestPost } from "~/app/_components/post";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
	const hello = await api.post.hello();

	void api.post.getLatest.prefetch();

	return (
		<HydrateClient>
			<main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] text-white">
				<div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-16">
					<section className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
						<div className="space-y-6">
							<p className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-cyan-200 text-sm">
								T3 template for web and external clients
							</p>
							<div className="space-y-4">
								<h1 className="max-w-3xl font-semibold text-5xl tracking-tight sm:text-6xl">
									Build web with tRPC. Expose REST for mobile.
								</h1>
								<p className="max-w-2xl text-lg text-slate-300">
									This starter keeps the internal web API on tRPC and adds a
									versioned REST boundary for mobile apps or third-party
									clients.
								</p>
							</div>
							<div className="grid gap-4 sm:grid-cols-3">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-slate-400 text-sm uppercase tracking-[0.2em]">
										Web
									</p>
									<p className="mt-2 font-medium text-lg">Next.js + tRPC</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-slate-400 text-sm uppercase tracking-[0.2em]">
										Data
									</p>
									<p className="mt-2 font-medium text-lg">Prisma + Postgres</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<p className="text-slate-400 text-sm uppercase tracking-[0.2em]">
										Mobile
									</p>
									<p className="mt-2 font-medium text-lg">REST for clients</p>
								</div>
							</div>
						</div>
						<div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-cyan-950/30">
							<p className="text-slate-400 text-sm uppercase tracking-[0.2em]">
								Included boundaries
							</p>
							<div className="mt-4 space-y-4 text-slate-300 text-sm">
								<div>
									<p className="font-medium text-white">Internal tRPC</p>
									<p>{hello.greeting}</p>
								</div>
								<div>
									<p className="font-medium text-white">REST example</p>
									<p className="font-mono text-cyan-200">GET /api/v1/posts</p>
									<p className="font-mono text-cyan-200">POST /api/v1/posts</p>
								</div>
							</div>
						</div>
					</section>

					<section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
						<div className="rounded-3xl border border-white/10 bg-white/5 p-6">
							<h2 className="font-semibold text-2xl">Project rules</h2>
							<div className="mt-4 space-y-3 text-slate-300">
								<p>Use tRPC for internal web features and admin surfaces.</p>
								<p>
									Use versioned REST routes for mobile apps and external
									clients.
								</p>
								<p>Keep business logic in services so both layers stay thin.</p>
								<p>Add Clerk later instead of coupling auth to the template.</p>
							</div>
						</div>
						<div className="rounded-3xl border border-white/10 bg-white/5 p-6">
							<h2 className="font-semibold text-2xl">Smoke test the sample</h2>
							<div className="mt-4 space-y-4 text-slate-300 text-sm">
								<p className="font-mono text-cyan-200">
									curl http://localhost:3000/api/v1/posts
								</p>
								<p className="font-mono text-cyan-200">
									curl -X POST http://localhost:3000/api/v1/posts -H
									&quot;content-type: application/json&quot; -d &apos;{"{"}
									"name":"Hello from REST"{"}"}&apos;
								</p>
								<LatestPost />
							</div>
						</div>
					</section>
				</div>
			</main>
		</HydrateClient>
	);
}
