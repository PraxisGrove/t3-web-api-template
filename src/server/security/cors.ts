import "server-only";

import { NextResponse } from "next/server";

import { env } from "~/env";

const allowedOrigins = new Set(
	(env.ALLOWED_ORIGINS ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
);

export function getCorsHeaders(request: Request): Record<string, string> {
	const origin = request.headers.get("origin");

	if (origin === null || !allowedOrigins.has(origin)) {
		return {} satisfies Record<string, string>;
	}

	return {
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": "content-type, authorization",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Origin": origin,
		Vary: "Origin",
	} satisfies Record<string, string>;
}

export function preflight(request: Request) {
	return new NextResponse(null, {
		headers: getCorsHeaders(request),
		status: 204,
	});
}

export function withCors<TBody>(
	request: Request,
	response: NextResponse<TBody>,
) {
	const headers = getCorsHeaders(request);

	for (const [name, value] of Object.entries(headers)) {
		response.headers.set(name, value);
	}

	return response;
}
