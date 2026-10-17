import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function getProfile() {
  const rows = await db.select().from(profiles).orderBy(desc(profiles.updatedAt)).limit(1);
  return rows[0] ?? null;
}

export async function saveProfile(data: {
  name: string;
  university: string;
  course: string;
  email: string;
  bio: string;
}) {
  const existing = await getProfile();
  if (existing) {
    return await db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning();
  }
  return await db.insert(profiles).values({ ...data, updatedAt: new Date() }).returning();
}
