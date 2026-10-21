import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { normalizeEmail } from "@/lib/validation";

export const SESSION_COOKIE = "ra_session";
const SESSION_DAYS = 30;

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export type SessionUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isAdmin: boolean;
};

/**
 * Owner-only admin. ONLY the emails in `ADMIN_EMAILS` (or `ADMIN_EMAIL`) get the
 * admin area. There is deliberately no "first account becomes admin" fallback,
 * so nobody can obtain admin rights by signing up early — and changing the env
 * var takes effect on the next request, because rights are never cached in the DB.
 */
export function adminEmails(): string[] {
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL].filter(Boolean).join(",");
  return Array.from(
    new Set(
      raw
        .split(/[,;\s]+/)
        .map((email) => normalizeEmail(email))
        .filter(Boolean),
    ),
  );
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(normalizeEmail(email));
}

/* ── passwords: scrypt with a per-user random salt ──────────── */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ── sessions: random token in an httpOnly cookie, only its hash in the DB ── */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
    } catch {
      // The cookie is removed below either way.
    }
  }
  jar.delete(SESSION_COOKIE);
}

/** Uncached read — safe in route handlers and server actions. */
export async function readSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    token = (await cookies()).get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    const rows = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName, role: users.role })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    // The `role` column is informational only; admin rights come from the env allow-list.
    return { ...row, isAdmin: isAdminEmail(row.email) };
  } catch {
    return null;
  }
}

/** Deduplicated per request inside server components. */
export const getCurrentUser = cache(readSessionUser);

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Owner-only pages: signed-in users who are not on the allow-list go back to their dashboard. */
export async function requireAdmin(next: string): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(value: unknown): string {
  const path = typeof value === "string" ? value.trim() : "";
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/dashboard";
  if (path.startsWith("/login") || path.startsWith("/signup")) return "/dashboard";
  return path;
}
