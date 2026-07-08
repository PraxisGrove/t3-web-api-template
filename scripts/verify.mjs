import { spawnSync } from "node:child_process";
import process from "node:process";

const steps = [
	["pnpm", ["check"]],
	["pnpm", ["typecheck"]],
	["pnpm", ["test"]],
	["pnpm", ["build"], { SKIP_ENV_VALIDATION: "1" }],
];

for (const [command, args, env = {}] of steps) {
	const label = [command, ...args].join(" ");
	console.log(`\n> ${label}`);

	const result = spawnSync(command, args, {
		env: {
			...process.env,
			...env,
		},
		stdio: "inherit",
	});

	if (result.error) {
		console.error(result.error.message);
		process.exit(1);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}
