/**
 * Server-rendered sign-in and consent screens.
 *
 * There is no web frontend in this monorepo, so the authorization server owns
 * its own UI. Everything is inline — no external CSS, fonts or scripts — so
 * the page renders identically wherever Claude opens it.
 */
import { SCOPES, type Scope } from "./config";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #f6f6f7;
    color: #18181b;
    font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 16px;
    padding: 32px;
  }
  .brand { font-size: 13px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #71717a; margin-bottom: 20px; }
  h1 { font-size: 21px; line-height: 1.3; margin: 0 0 8px; font-weight: 650; }
  p.lede { margin: 0 0 24px; color: #52525b; }
  .client { font-weight: 600; color: #18181b; }
  ul.scopes { list-style: none; margin: 0 0 24px; padding: 0; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; }
  ul.scopes li { padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; }
  ul.scopes li + li { border-top: 1px solid #f1f1f3; }
  ul.scopes .tick { color: #16a34a; font-weight: 700; line-height: 1.4; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 0 0 6px; color: #3f3f46; }
  input[type=text], input[type=password] {
    width: 100%; padding: 11px 12px; margin-bottom: 16px; font-size: 15px;
    border: 1px solid #d4d4d8; border-radius: 10px; background: #fff; color: inherit;
  }
  input:focus { outline: 2px solid #2563eb; outline-offset: -1px; border-color: transparent; }
  .actions { display: flex; gap: 10px; margin-top: 4px; }
  button { flex: 1; padding: 11px 16px; font-size: 15px; font-weight: 600; border-radius: 10px; cursor: pointer; border: 1px solid transparent; font-family: inherit; }
  button.primary { background: #18181b; color: #fff; }
  button.primary:hover { background: #27272a; }
  button.secondary { background: #fff; color: #3f3f46; border-color: #d4d4d8; }
  button.secondary:hover { background: #fafafa; }
  .error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px 12px; border-radius: 10px; margin-bottom: 16px; font-size: 14px; }
  .redirect { margin-top: 20px; font-size: 12.5px; color: #71717a; word-break: break-all; }
  .redirect code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #3f3f46; }
  .warn { margin-top: 12px; padding: 10px 12px; font-size: 12.5px; border-radius: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  @media (prefers-color-scheme: dark) {
    body { background: #09090b; color: #fafafa; }
    .card { background: #131316; border-color: #27272a; }
    h1, .client { color: #fafafa; }
    p.lede, .brand, .redirect { color: #a1a1aa; }
    ul.scopes { border-color: #27272a; }
    ul.scopes li + li { border-top-color: #1f1f23; }
    label { color: #d4d4d8; }
    input[type=text], input[type=password] { background: #09090b; border-color: #3f3f46; color: #fafafa; }
    button.primary { background: #fafafa; color: #09090b; }
    button.primary:hover { background: #e4e4e7; }
    button.secondary { background: #131316; color: #d4d4d8; border-color: #3f3f46; }
    button.secondary:hover { background: #1c1c20; }
    .error { background: #2a1214; border-color: #7f1d1d; color: #fca5a5; }
    .warn { background: #221a06; border-color: #78350f; color: #fcd34d; }
    .redirect code { color: #d4d4d8; }
  }
`;

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body><main class="card">${body}</main></body>
</html>`;
}

export interface ConsentPageOptions {
  clientName: string;
  redirectUri: string;
  scopes: Scope[];
  requestToken: string;
  /** Shown above the form after a failed sign-in attempt. */
  error?: string;
  /** Pre-fills the username field so a retry doesn't start from scratch. */
  username?: string;
}

export function renderConsentPage(options: ConsentPageOptions): string {
  const redirectHost = safeHost(options.redirectUri);
  const scopeItems = options.scopes
    .map(
      (scope) =>
        `<li><span class="tick" aria-hidden="true">&check;</span><span>${escapeHtml(SCOPES[scope])}</span></li>`,
    )
    .join("");

  // RFC 8252 loopback redirects can be claimed by any local process, so the
  // MCP spec asks that the user be told when that is where they are headed.
  const loopbackWarning = isLoopback(options.redirectUri)
    ? `<div class="warn">This will hand access to an application running on this device. Only continue if you started the sign-in yourself.</div>`
    : "";

  return page(
    `Connect ${options.clientName} — Uplifting`,
    `
    <div class="brand">Uplifting</div>
    <h1>Connect <span class="client">${escapeHtml(options.clientName)}</span> to your account</h1>
    <p class="lede">Sign in to approve this connection.</p>
    ${options.error ? `<div class="error">${escapeHtml(options.error)}</div>` : ""}
    <ul class="scopes">${scopeItems}</ul>
    <form method="post" action="/oauth/authorize" autocomplete="on">
      <input type="hidden" name="request" value="${escapeHtml(options.requestToken)}">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" autocapitalize="none" autocorrect="off"
             autocomplete="username" required value="${escapeHtml(options.username ?? "")}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <div class="actions">
        <button class="secondary" type="submit" name="action" value="deny">Cancel</button>
        <button class="primary" type="submit" name="action" value="approve">Sign in &amp; allow</button>
      </div>
    </form>
    <p class="redirect">You will be returned to <code>${escapeHtml(redirectHost)}</code>.</p>
    ${loopbackWarning}
  `,
  );
}

export function renderErrorPage(title: string, detail: string): string {
  return page(
    `${title} — Uplifting`,
    `
    <div class="brand">Uplifting</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="lede">${escapeHtml(detail)}</p>
    <p class="redirect">Close this window and try connecting again from the app that sent you here.</p>
  `,
  );
}

function safeHost(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}

function isLoopback(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  } catch {
    return false;
  }
}
