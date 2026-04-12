#!/usr/bin/env bun
/**
 * Generate a changelog entry from conventional commits between two
 * git tags (or a tag and HEAD).
 *
 * Usage:
 *   bun scripts/generate-changelog.ts [--from <tag>] [--to <ref>]
 *       [--version <version>] [--date <YYYY-MM-DD>] [--dry-run]
 *
 * Defaults:
 *   --from   latest git tag
 *   --to     HEAD
 *   --version  read from apps/mobile/app.json
 *   --date   today
 *
 * The script parses conventional commit messages, strips the
 * optional "[agent] " prefix, groups by type, and either prepends
 * the entry to CHANGELOG.md or prints it (--dry-run).
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ── CLI args ────────────────────────────────────────────────────

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

const dryRun = args.includes("--dry-run");

const root = execSync("git rev-parse --show-toplevel")
  .toString()
  .trim();

// ── Resolve from/to refs ────────────────────────────────────────

function latestTag(): string | undefined {
  try {
    return execSync("git describe --tags --abbrev=0 HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return undefined;
  }
}

const fromRef = flag("from") ?? latestTag();
const toRef = flag("to") ?? "HEAD";

if (!fromRef) {
  console.error(
    "Error: no git tags found and --from not specified."
  );
  process.exit(1);
}

// ── Resolve version ─────────────────────────────────────────────

function readAppVersion(): string {
  const appJson = JSON.parse(
    readFileSync(join(root, "apps/mobile/app.json"), "utf-8")
  );
  return appJson.expo.version;
}

const version = flag("version") ?? readAppVersion();
const date =
  flag("date") ??
  new Date().toISOString().split("T")[0];

// ── Parse commits ───────────────────────────────────────────────

interface Commit {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  breaking: boolean;
}

const CONVENTIONAL_RE =
  /^(?:\[agent\]\s*)?(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;

function parseCommits(from: string, to: string): Commit[] {
  const range = `${from}..${to}`;
  const raw = execSync(
    `git log ${range} --format="%h %s" --no-merges`,
    { encoding: "utf-8" }
  ).trim();

  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => {
      const hash = line.slice(0, 7);
      const msg = line.slice(8);
      const match = CONVENTIONAL_RE.exec(msg);
      if (!match) return null;
      return {
        hash,
        type: match[1],
        scope: match[2] || undefined,
        subject: match[4],
        breaking: match[3] === "!",
      } as Commit;
    })
    .filter((c): c is Commit => c !== null);
}

// ── Group and render ────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  feat: "Features",
  fix: "Bug Fixes",
  perf: "Performance",
  refactor: "Refactors",
  docs: "Documentation",
  style: "Styles",
  test: "Tests",
  build: "Build",
  ci: "CI",
  chore: "Chores",
};

// Types to include in the changelog (skip docs, style, test,
// build, ci, chore by default).
const VISIBLE_TYPES = new Set([
  "feat",
  "fix",
  "perf",
  "refactor",
]);

function render(commits: Commit[]): string {
  const groups = new Map<string, Commit[]>();

  for (const c of commits) {
    if (!VISIBLE_TYPES.has(c.type)) continue;
    const group = groups.get(c.type) ?? [];
    group.push(c);
    groups.set(c.type, group);
  }

  if (groups.size === 0) {
    return `## [${version}] - ${date}\n\n_No notable changes._\n`;
  }

  const order = [
    "feat",
    "fix",
    "perf",
    "refactor",
  ];

  const sections: string[] = [`## [${version}] - ${date}`];

  for (const type of order) {
    const items = groups.get(type);
    if (!items || items.length === 0) continue;
    const label = TYPE_LABELS[type] ?? type;
    sections.push("");
    sections.push(`### ${label}`);
    sections.push("");
    for (const c of items) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      const bang = c.breaking ? "**BREAKING:** " : "";
      sections.push(`- ${bang}${scope}${c.subject}`);
    }
  }

  return sections.join("\n") + "\n";
}

// ── Write to CHANGELOG.md ───────────────────────────────────────

function prependToChangelog(entry: string): void {
  const changelogPath = join(root, "CHANGELOG.md");
  const UNRELEASED_MARKER = "## [Unreleased]";
  const UNRELEASED_SECTION =
    /## \[Unreleased\]\n+(?:_[^_]+_\n+)?/;

  if (!existsSync(changelogPath)) {
    console.error("Error: CHANGELOG.md not found at", root);
    process.exit(1);
  }

  let content = readFileSync(changelogPath, "utf-8");

  // Replace the Unreleased section with a fresh one + the new entry
  const freshUnreleased =
    `${UNRELEASED_MARKER}\n\n_No unreleased changes._\n\n`;

  if (UNRELEASED_SECTION.test(content)) {
    content = content.replace(
      UNRELEASED_SECTION,
      freshUnreleased + entry + "\n"
    );
  } else if (content.includes(UNRELEASED_MARKER)) {
    // Unreleased header exists but format is unexpected —
    // insert after it
    content = content.replace(
      UNRELEASED_MARKER,
      freshUnreleased + entry + "\n"
    );
  } else {
    // No Unreleased section — prepend after the first heading
    const firstH2 = content.indexOf("\n## ");
    if (firstH2 !== -1) {
      content =
        content.slice(0, firstH2 + 1) +
        freshUnreleased +
        entry +
        "\n" +
        content.slice(firstH2 + 1);
    } else {
      content += "\n" + entry;
    }
  }

  writeFileSync(changelogPath, content);
  console.log(`Updated CHANGELOG.md with ${version}`);
}

// ── Main ────────────────────────────────────────────────────────

const commits = parseCommits(fromRef, toRef);
const entry = render(commits);

if (dryRun) {
  console.log(entry);
} else {
  prependToChangelog(entry);
}
