import "server-only";

import { NextResponse } from "next/server";

import { logger } from "~/server/observability/logger";
import { withCors } from "./cors";

type ErrorCode = "invalid_request" | "rate_limited" | "internal_error";

export function jsonOk<TBody>(
	request: Request,
	body: TBody,
	init?: ResponseInit,
) {
	return withCors(request, NextResponse.json(body, init));
}

export function jsonError(
	request: Request,
	code: ErrorCode,
	message: string,
	status: number,
	details?: unknown,
) {
	return withCors(
		request,
		NextResponse.json(
			{
				error: {
					code,
					message,
					details,
				},
			},
			{ status },
		),
	);
}

export function logAndReturnInternalError(
	request: Request,
	error: unknown,
	message = "Unexpected server error",
) {
	logger.error({ err: error }, message);
	return jsonError(request, "internal_error", message, 500);
}
