process.env.DATABASE_URL ??=
	"postgresql://postgres:password@localhost:5432/t3_web_api_template";
process.env.RATE_LIMIT_ENABLED ??= "true";
process.env.RATE_LIMIT_REQUESTS ??= "60";
process.env.RATE_LIMIT_WINDOW_SECONDS ??= "60";
