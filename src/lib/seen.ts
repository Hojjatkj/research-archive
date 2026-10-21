import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export const READER_COOKIE = "ra_reader_v1";
export const READER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export function createReaderToken(): string {
  return randomBytes(32).toString("hex");
}

export function isReaderToken(value: string | undefined): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value);
}

export function hashReaderToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Check whether this browser has already recorded a view of the given post. */
export async function hasSeenItem(itemId: number): Promise<boolean> {
  try {
    const token = (await cookies()).get(READER_COOKIE)?.value;
    if (!isReaderToken(token)) return false;

    const rows = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.itemId, itemId), eq(reviews.visitorTokenHash, hashReaderToken(token))))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}
