import { createClient } from "@hey-api/openapi-ts";
import Bun from "bun";
import z from "zod";

function boolFlag(args: string[], ...flags: string[]): boolean {
	return args.some((arg) => flags.includes(arg));
}

const force = boolFlag(process.argv, "--force", "-f");
const isVercel = !!process.env.VERCEL;

// On Vercel, use remote URL directly since the symlink won't resolve
if (isVercel) {
	const apiUrl = process.env.VITE_API_URL;
	if (!apiUrl) {
		throw new Error("VITE_API_URL is not set");
	}
	const remoteUrl = `${apiUrl}/docs/openapi.json`;
	console.log(`Running on Vercel, using remote openapi.json from ${remoteUrl}`);
	await createClient({
		input: remoteUrl,
		output: "./src/lib/api-openapi-gen",
		plugins: ["@hey-api/client-fetch"],
	});
	process.exit(0);
}

// Local development: use symlink with caching
const Z_CacheData = z.object({
	apiHash: z.string().nullable(),
	packageJsonHash: z.string().nullable(),
});

const cacheFile = Bun.file(".postinstall.json");
const defaultCache: z.infer<typeof Z_CacheData> = {
	apiHash: null,
	packageJsonHash: null,
};

let cache = defaultCache;
if (await cacheFile.exists()) {
	const result = Z_CacheData.safeParse(await cacheFile.json().catch());
	if (result.success) cache = result.data;
	else console.error("Error parsing cache file", result.error);
}

async function getHash(file: Bun.BunFile) {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(await file.bytes());
	return hasher.digest("hex");
}

const apiHash = await getHash(Bun.file("openapi.json"));
const packageJsonHash = await getHash(Bun.file("package.json"));

if (
	cache.apiHash !== apiHash ||
	cache.packageJsonHash !== packageJsonHash ||
	force
) {
	console.log("openapi file has changed, regenerating client");
	cache.apiHash = apiHash;
	cache.packageJsonHash = packageJsonHash;
	await createClient({
		input: "./openapi.json",
		output: "./src/lib/api-openapi-gen",
		plugins: ["@hey-api/client-fetch"],
	});
} else {
	console.log("openapi file has not changed, skipping client generation");
}

await cacheFile.write(JSON.stringify(cache, null, 2));
