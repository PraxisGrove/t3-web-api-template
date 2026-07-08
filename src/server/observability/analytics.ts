import "server-only";

import { PostHog } from "posthog-node";

import { env } from "~/env";
import { logger } from "./logger";

const posthog =
	env.NEXT_PUBLIC_POSTHOG_KEY === undefined
		? null
		: new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
				host: env.NEXT_PUBLIC_POSTHOG_HOST,
			});

export function captureServerEvent(
	distinctId: string,
	event: string,
	properties?: Record<string, unknown>,
) {
	if (posthog === null) {
		logger.debug({ event, distinctId, properties }, "PostHog disabled");
		return;
	}

	posthog.capture({
		distinctId,
		event,
		properties,
	});
}

export async function shutdownAnalytics() {
	await posthog?.shutdown();
}
