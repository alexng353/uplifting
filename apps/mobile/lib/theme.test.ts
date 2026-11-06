import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const root = join(import.meta.dir, "..");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

test("the old blue accent is gone; Ember is the accent everywhere", () => {
  const offenders = ["app", "components", "hooks"]
    .flatMap((d) => sources(join(root, d)))
    .filter((file) => /blue-\d|#3b82f6|#2563eb|#60a5fa|#93c5fd/i.test(readFileSync(file, "utf8")))
    .map((file) => file.slice(root.length + 1));
  expect(offenders).toEqual([]);
});

test("the Tailwind config defines the Ember palette with its on-accent ink", () => {
  const config = require(join(root, "tailwind.config.js"));
  const ember = config.theme.extend.colors.ember;
  expect(ember[500]).toBe("#F2894B");
  expect(ember.ink).toBe("#1F0E04");
});
