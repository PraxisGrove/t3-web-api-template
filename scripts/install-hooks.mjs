import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

// Git hooks belong in developer checkouts, not CI, containers, or source ZIPs.
if (existsSync(".git") && !process.env.CI && process.env.LEFTHOOK !== "0") {
	const result = spawnSync("lefthook", ["install"], { stdio: "inherit" });
	if (result.error) throw result.error;
	process.exitCode = result.status ?? 1;
}
