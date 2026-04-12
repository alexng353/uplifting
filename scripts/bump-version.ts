#!/usr/bin/env bun
/**
 * Bump the app version in apps/mobile/app.json and
 * apps/mobile/package.json.
 *
 * Usage:
 *   bun scripts/bump-version.ts <patch|minor|major>
 *   bun scripts/bump-version.ts 2.1.0        # explicit
 *
 * Prints the new version to stdout (for use in shell scripts).
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const root = execSync("git rev-parse --show-toplevel", {
  encoding: "utf-8",
}).trim();

const appJsonPath = join(root, "apps/mobile/app.json");
const pkgJsonPath = join(root, "apps/mobile/package.json");

// ── Read current version ────────────────────────────────────────

const appJson = JSON.parse(readFileSync(appJsonPath, "utf-8"));
const current: string = appJson.expo.version;
const [major, minor, patch] = current.split(".").map(Number);

// ── Compute next version ────────────────────────────────────────

const arg = process.argv[2];

if (!arg) {
  console.error("Usage: bump-version.ts <patch|minor|major|X.Y.Z>");
  process.exit(1);
}

let next: string;

switch (arg) {
  case "patch":
    next = `${major}.${minor}.${patch + 1}`;
    break;
  case "minor":
    next = `${major}.${minor + 1}.0`;
    break;
  case "major":
    next = `${major + 1}.0.0`;
    break;
  default:
    if (/^\d+\.\d+\.\d+$/.test(arg)) {
      next = arg;
    } else {
      console.error(`Invalid version or bump type: ${arg}`);
      process.exit(1);
    }
}

// ── Write updated files ─────────────────────────────────────────

appJson.expo.version = next;
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");

const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
pkgJson.version = next;
writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");

console.log(next);
