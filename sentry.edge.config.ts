import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN !== undefined) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.APP_ENV ?? process.env.NODE_ENV,
		tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
	});
}
