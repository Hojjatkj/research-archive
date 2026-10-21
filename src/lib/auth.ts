import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/validation";

export const ADMIN_SESSION_COOKIE = "ra_admin_session_v1";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export type SessionUser = {
  email: string;
  fullName: string;
  role: "admin";
  isAdmin: true;
};

type SessionPayload = {
  version: 1;
  email: string;
  expiresAt: number;
  nonce: string;
};

function configuredEmail(): string {
  return normalizeEmail(process.env.ADMIN_EMAIL);
}

function configuredPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

function configuredSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

/** A single email/password pair is the entire admin allow-list. */
export function adminAuthConfigured(): boolean {
  return (
    configuredEmail().length > 0 &&
    Array.from(configuredPassword().normalize("NFKC")).length >= 16 &&
    Buffer.byteLength(configuredSessionSecret(), "utf8") >= 32
  );
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function credentialFingerprint(email: string, password: string): string {
  return digest(`${email}\0${password.normalize("NFKC")}`).toString("hex");
}

function constantTimeStringEqual(left: string, right: string): boolean {
  return timingSafeEqual(digest(left), digest(right));
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!adminAuthConfigured()) return false;

  const expectedEmail = configuredEmail();
  const suppliedEmail = normalizeEmail(email);
  const expectedPassword = configuredPassword().normalize("NFKC");
  const suppliedPassword = password.normalize("NFKC");

  // Always perform both comparisons to avoid exposing which value was wrong.
  const emailMatches = constantTimeStringEqual(suppliedEmail, expectedEmail);
  const passwordMatches = constantTimeStringEqual(suppliedPassword, expectedPassword);
  return emailMatches && passwordMatches;
}

function signingKey(): Buffer {
  const email = configuredEmail();
  return createHmac("sha256", configuredSessionSecret())
    .update(credentialFingerprint(email, configuredPassword()))
    .digest();
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", signingKey()).update(encodedPayload).digest("base64url");
}

async function isSecureRequest(): Promise<boolean> {
  if (process.env.VERCEL) return true;
  try {
    const forwarded = (await headers()).get("x-forwarded-proto") ?? "";
    return forwarded.split(",")[0]?.trim() === "https";
  } catch {
    return false;
  }
}

export async function createAdminSession(): Promise<void> {
  if (!adminAuthConfigured()) throw new Error("Administrator login is not configured.");

  const email = configuredEmail();
  const expiresAt = Date.now() + SESSION_MS;
  const payload: SessionPayload = {
    version: 1,
    email,
    expiresAt,
    nonce: randomBytes(16).toString("hex"),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${encodedPayload}.${sign(encodedPayload)}`;

  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

function decodeSession(token: string): SessionPayload | null {
  if (!adminAuthConfigured() || token.length > 2048) return null;
  const [encodedPayload, suppliedSignature, extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra !== undefined) return null;

  const expectedSignature = sign(encodedPayload);
  if (!constantTimeStringEqual(suppliedSignature, expectedSignature)) return null;

  try {
    const value: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!value || typeof value !== "object") return null;
    const payload = value as Partial<SessionPayload>;
    const email = configuredEmail();

    if (
      payload.version !== 1 ||
      payload.email !== email ||
      typeof payload.expiresAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now() ||
      payload.expiresAt > Date.now() + SESSION_MS + 60_000 ||
      typeof payload.nonce !== "string" ||
      !/^[0-9a-f]{32}$/.test(payload.nonce)
    ) {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Uncached session read, safe in route handlers and server actions. */
export async function readSessionUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    if (!token || !decodeSession(token)) return null;

    return {
      email: configuredEmail(),
      fullName: "مدیر سایت",
      role: "admin",
      isAdmin: true,
    };
  } catch {
    return null;
  }
}

/** Deduplicated within a server-component render. */
export const getCurrentUser = cache(readSessionUser);

/** All management routes require the one environment-configured administrator. */
export async function requireAdmin(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(value: unknown): string {
  const path = typeof value === "string" ? value.trim() : "";
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/dashboard";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/dashboard";
  return path;
}
