import { watch } from "node:fs";
import { spawn } from "bun";

const file = "openapi.json";

console.log(`Watching ${file} for changes...`);

// Run postinstall once on startup with --force to ensure client is up to date
await spawn(["bun", "scripts/postinstall.ts", "--force"], {
	stdio: ["inherit", "inherit", "inherit"],
}).exited;

let debounceTimer: Timer | null = null;

watch(file, async (eventType) => {
	if (eventType !== "change") return;

	// Debounce rapid changes
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(async () => {
		console.log(`\n${file} changed, regenerating client...`);
		await spawn(["bun", "scripts/postinstall.ts", "--force"], {
			stdio: ["inherit", "inherit", "inherit"],
		}).exited;
	}, 100);
});

// Keep the process running
await new Promise(() => {});
