import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();
const changelogPath = resolve(root, "CHANGELOG.md");
const args = new Set(process.argv.slice(2));

const shouldWrite = args.has("--write");
const shouldCheck = args.has("--check");

if (!shouldWrite && !shouldCheck) {
	console.error("Usage: node scripts/release-date.mjs --write|--check");
	process.exit(1);
}

const releaseDate = process.env.RELEASE_DATE ?? getShanghaiDate();

if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
	console.error("RELEASE_DATE must use YYYY-MM-DD.");
	process.exit(1);
}

const tagDate = releaseDate.replaceAll("-", ".");
const changelog = readFileSync(changelogPath, "utf8");
const match = changelog.match(
	/(## Unreleased\s*\n)([\s\S]*?)(?=\n## \d{4}-\d{2}-\d{2}(?:\.\d+)?\n|$)/,
);

if (!match) {
	console.error("CHANGELOG.md must contain a '## Unreleased' section.");
	process.exit(1);
}

const unreleasedBody = match[2]?.trim();

if (!unreleasedBody) {
	console.error("CHANGELOG.md has no unreleased entries.");
	process.exit(1);
}

const releaseSequence = getNextReleaseSequence(changelog, releaseDate);
const releaseName =
	releaseSequence === 0 ? releaseDate : `${releaseDate}.${releaseSequence}`;
const releaseTag =
	releaseSequence === 0 ? `v${tagDate}` : `v${tagDate}.${releaseSequence}`;

if (shouldCheck) {
	console.log(releaseTag);
	process.exit(0);
}

const nextChangelog = changelog.replace(
	match[0],
	`## Unreleased\n\n## ${releaseName}\n\n${unreleasedBody}\n`,
);

writeFileSync(changelogPath, nextChangelog);

console.log(`Prepared ${releaseTag}`);
console.log(`Updated ${relative(root, changelogPath)}`);

function getShanghaiDate() {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date());

	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		throw new Error("Failed to format release date.");
	}

	return `${year}-${month}-${day}`;
}

function getNextReleaseSequence(content, date) {
	const escapedDate = date.replaceAll("-", "\\-");
	const releaseHeadingPattern = new RegExp(
		`^## ${escapedDate}(?:\\.(\\d+))?$`,
		"gm",
	);
	const releases = [...content.matchAll(releaseHeadingPattern)];

	if (releases.length === 0) {
		return 0;
	}

	const existingSequences = releases.map((release) =>
		release[1] ? Number(release[1]) : 0,
	);

	return Math.max(...existingSequences) + 1;
}
