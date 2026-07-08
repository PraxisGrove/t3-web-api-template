import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"server-only": fileURLToPath(
				new URL("./src/test/server-only.ts", import.meta.url),
			),
			"~": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		globals: false,
		include: ["src/**/*.test.ts"],
		setupFiles: ["./src/test/setup.ts"],
	},
});
