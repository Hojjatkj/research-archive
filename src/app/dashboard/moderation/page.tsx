import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { reviewMap } from "@/lib/data";
import { DashboardShell } from "@/components/DashboardShell";
import { ModerationList, type ModItemDTO } from "@/components/ModerationList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "مدیریت انتشار | بایگانی پژوهش",
  robots: { index: false, follow: false },
};

export default async function ModerationPage() {
  const user = await requireAdmin("/dashboard/moderation");
  const [rows, reviews] = await Promise.all([
    db
      .select({
        id: items.id,
        title: items.title,
        slug: items.slug,
        type: items.type,
        userId: items.userId,
        hiddenByAdmin: items.hiddenByAdmin,
        moderationNote: items.moderationNote,
        publishedAt: items.publishedAt,
        authorName: users.fullName,
      })
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .where(eq(items.status, "published"))
      .orderBy(desc(items.publishedAt), desc(items.id)),
    reviewMap(),
  ]);

  const dto: ModItemDTO[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    authorName: row.authorName,
    authorId: row.userId,
    hiddenByAdmin: row.hiddenByAdmin,
    moderationNote: row.moderationNote,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    reviews: reviews.get(row.id) ?? 0,
  }));

  return (
    <DashboardShell user={user} active="moderation">
      <h1 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">مدیریت انتشار</h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-8 text-ink-soft">
        مطالب منتشرشده را بازبینی کنید؛ اگر مطلبی نباید در دید عموم باشد، آن را موقتاً از انتشار خارج کنید.
      </p>
      <div className="mt-5 border-s-4 border-ink/40 bg-paper-2 px-5 py-4 text-[13px] leading-7 text-ink-2">
        خارج کردن از انتشار، محتوا و ثبت‌های «من دیدم» را پاک نمی‌کند؛ مطلب هر زمان قابل بازگرداندن است.
      </div>
      <div className="mt-8">
        <ModerationList items={dto} />
      </div>
    </DashboardShell>
  );
}
