import "server-only";

import pino from "pino";

import { env } from "~/env";

export const logger = pino({
	base: undefined,
	level: env.LOG_LEVEL ?? "info",
	redact: {
		paths: [
			"password",
			"token",
			"accessToken",
			"refreshToken",
			"authorization",
			"headers.authorization",
			"cookie",
			"headers.cookie",
		],
		remove: true,
	},
});
