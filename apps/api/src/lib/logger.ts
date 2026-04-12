import { Elysia } from "elysia";

const colorStatus = (status: number): string => {
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // cyan
  return `\x1b[32m${status}\x1b[0m`; // green
};

const colorMethod = (method: string): string => {
  const colors: Record<string, string> = {
    GET: "\x1b[32m",
    POST: "\x1b[34m",
    PUT: "\x1b[33m",
    DELETE: "\x1b[31m",
    PATCH: "\x1b[35m",
    OPTIONS: "\x1b[90m",
  };
  return `${colors[method] ?? "\x1b[0m"}${method.padEnd(7)}\x1b[0m`;
};

export const logger = new Elysia({ name: "logger" })
  .derive({ as: "global" }, () => ({
    requestStartedAt: performance.now(),
  }))
  .onAfterResponse({ as: "global" }, ({ request, requestStartedAt, set }) => {
    const url = new URL(request.url);
    const ms = (performance.now() - requestStartedAt).toFixed(1);
    const status = set.status ?? 200;

    console.log(
      `${colorMethod(request.method)} ${url.pathname} ${colorStatus(status as number)} ${ms}ms`,
    );
  })
  .onError({ as: "global" }, ({ request, requestStartedAt, set, code, error }) => {
    const url = new URL(request.url);
    const ms = requestStartedAt ? (performance.now() - requestStartedAt).toFixed(1) : "?";
    const status = set.status ?? (code === "NOT_FOUND" ? 404 : 500);

    console.log(
      `${colorMethod(request.method)} ${url.pathname} ${colorStatus(status as number)} ${ms}ms`,
    );
    if (Number(status) >= 500) {
      console.error(`  \x1b[31m${error}\x1b[0m`);
    }
  });
