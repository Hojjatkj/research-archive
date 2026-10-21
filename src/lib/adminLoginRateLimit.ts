import "server-only";

import { createHmac } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { adminLoginAttempts } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const STALE_AFTER_MS = 48 * 60 * 60 * 1000;

async function clientKey(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = (requestHeaders.get("x-real-ip")?.trim() || forwarded || "unknown").slice(0, 128);
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "")
    .update(address)
    .digest("hex");
}

/** Atomic database-backed limit, so it still works across serverless instances. */
export async function consumeAdminLoginAttempt(): Promise<boolean> {
  const key = await clientKey();
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const staleBefore = new Date(now.getTime() - STALE_AFTER_MS);

  await db.delete(adminLoginAttempts).where(lt(adminLoginAttempts.updatedAt, staleBefore));

  const [bucket] = await db
    .insert(adminLoginAttempts)
    .values({ ipHash: key, attempts: 1, windowStartedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: adminLoginAttempts.ipHash,
      set: {
        attempts: sql`CASE WHEN ${adminLoginAttempts.windowStartedAt} <= ${windowStart} THEN 1 ELSE ${adminLoginAttempts.attempts} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${adminLoginAttempts.windowStartedAt} <= ${windowStart} THEN ${now} ELSE ${adminLoginAttempts.windowStartedAt} END`,
        updatedAt: now,
      },
    })
    .returning({ attempts: adminLoginAttempts.attempts });

  return Number(bucket?.attempts ?? MAX_ATTEMPTS + 1) <= MAX_ATTEMPTS;
}

export async function clearAdminLoginAttempts(): Promise<void> {
  const key = await clientKey();
  await db.delete(adminLoginAttempts).where(and(eq(adminLoginAttempts.ipHash, key)));
}
