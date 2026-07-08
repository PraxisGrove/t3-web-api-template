import "server-only";

import type { z } from "zod";

import { withCors } from "~/server/security/cors";
import { limitRestRequest } from "~/server/security/rate-limit";
import {
	jsonError,
	jsonOk,
	logAndReturnInternalError,
} from "~/server/security/rest-response";

type RestHandlerResult<TBody> =
	| Response
	| {
			body: TBody;
			init?: ResponseInit;
	  };

type RestQueryOptions<TBody> = {
	route: string;
	handler: (ctx: { request: Request }) => Promise<RestHandlerResult<TBody>>;
};

type RestMutationOptions<TSchema extends z.ZodTypeAny, TBody> = {
	route: string;
	input: TSchema;
	handler: (ctx: {
		input: z.infer<TSchema>;
		request: Request;
	}) => Promise<RestHandlerResult<TBody>>;
};

export function createRestQuery<TBody>(options: RestQueryOptions<TBody>) {
	return async function restQuery(request: Request) {
		return runWithRateLimit(request, options.route, () =>
			options.handler({ request }),
		);
	};
}

export function createRestMutation<TSchema extends z.ZodTypeAny, TBody>(
	options: RestMutationOptions<TSchema, TBody>,
) {
	return async function restMutation(request: Request) {
		return runWithRateLimit(request, options.route, async () => {
			let json: unknown;
			try {
				json = await request.json();
			} catch {
				return jsonError(request, "invalid_request", "Invalid JSON body", 400);
			}

			const parsed = options.input.safeParse(json);
			if (!parsed.success) {
				return jsonError(
					request,
					"invalid_request",
					"Invalid request body",
					400,
					parsed.error.flatten(),
				);
			}

			return options.handler({ input: parsed.data, request });
		});
	};
}

async function runWithRateLimit<TBody>(
	request: Request,
	route: string,
	handler: () => Promise<RestHandlerResult<TBody>>,
) {
	try {
		const rateLimit = await limitRestRequest(request, route);
		if (!rateLimit.success) {
			return jsonError(request, "rate_limited", "Too many requests", 429, {
				limit: rateLimit.limit,
				remaining: rateLimit.remaining,
				reset: rateLimit.reset,
			});
		}

		return toResponse(request, await handler());
	} catch (error) {
		return logAndReturnInternalError(request, error);
	}
}

function toResponse<TBody>(request: Request, result: RestHandlerResult<TBody>) {
	if (result instanceof Response) {
		return withCors(request, result);
	}

	return jsonOk(request, result.body, result.init);
}
