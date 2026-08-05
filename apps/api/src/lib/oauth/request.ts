/**
 * The authorization request survives the login/consent round trip as an
 * HMAC-signed blob embedded in the form, rather than as server-side state.
 *
 * That keeps the authorize endpoint stateless, and — more importantly — means
 * the parameters that were validated when the form was rendered are the exact
 * parameters used when it is submitted. A user cannot edit the hidden fields
 * to widen the scope or redirect somewhere else, because the signature would
 * no longer verify.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { AUTHORIZATION_REQUEST_TTL_MS, type Scope } from "./config";

export interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  scopes: Scope[];
  state?: string;
  code_challenge: string;
  code_challenge_method: string;
  resource: string;
  exp: number;
}

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required to sign authorization requests");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeAuthorizationRequest(request: Omit<AuthorizationRequest, "exp">): string {
  const withExpiry: AuthorizationRequest = {
    ...request,
    exp: Date.now() + AUTHORIZATION_REQUEST_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(withExpiry)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeAuthorizationRequest(token: string): AuthorizationRequest | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const presented = token.slice(separator + 1);
  const expected = sign(payload);

  if (presented.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(presented), Buffer.from(expected))) return null;

  let parsed: AuthorizationRequest;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return null;
  return parsed;
}
