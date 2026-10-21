import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { listStudents, reviewMap } from "@/lib/data";
import { DashboardShell } from "@/components/DashboardShell";
import { ModerationList, type ModItemDTO } from "@/components/ModerationList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مدیریت کلاس | میز کار" };

export default async function ModerationPage() {
  const user = await requireUser("/dashboard/moderation");
  if (!user.isAdmin) redirect("/dashboard");

  const [rows, reviews, students] = await Promise.all([
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
    listStudents(),
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
      <h1 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">مدیریت کلاس</h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-8 text-ink-soft">
        همهٔ مطالب منتشرشدهٔ کلاس این‌جاست. اگر مطلبی نباید در دید عموم باشد، آن را «از انتشار خارج»
        کنید.
      </p>

      <div className="mt-5 border-s-4 border-ink/40 bg-paper-2 px-5 py-4 text-[13px] leading-7 text-ink-2">
        <strong>قانون حفاظت از کار دانشجو:</strong> مدیر نمی‌تواند مطلب دانشجو را حذف کند. «خارج کردن
        از انتشار» فقط آن را از دید عموم پنهان می‌کند؛ مطلب با همهٔ محتوا و پیوست‌ها در میز کار دانشجو
        باقی می‌ماند و هر زمان قابل بازگرداندن است.
      </div>

      <div className="mt-8">
        <ModerationList items={dto} />
      </div>

      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="text-[19px] font-black text-ink">دانشجویان کلاس</h2>
          <p className="num text-[12px] text-ink-soft">{String(students.length).padStart(2, "0")} نفر</p>
        </div>
        {students.length === 0 ? (
          <p className="py-8 text-[13.5px] text-ink-soft">هنوز دانشجویی ثبت‌نام نکرده است.</p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-rule bg-paper-2">
            <table className="w-full min-w-[44rem] border-collapse text-right text-[13px]">
              <thead className="bg-paper-3/70 text-[12px] text-ink-2">
                <tr>
                  <th className="px-4 py-3 font-bold">نام</th>
                  <th className="px-4 py-3 font-bold">شماره دانشجویی</th>
                  <th className="px-4 py-3 font-bold">دانشگاه</th>
                  <th className="px-4 py-3 font-bold">کلاس</th>
                  <th className="px-4 py-3 font-bold">منتشرشده</th>
                  <th className="px-4 py-3 font-bold">مشاهده‌شده</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-rule">
                    <td className="px-4 py-3">
                      <Link href={`/students/${s.id}`} className="font-bold text-ink hover:text-accent">{s.fullName}</Link>
                    </td>
                    <td className="num px-4 py-3" dir="ltr">{s.studentNumber || "—"}</td>
                    <td className="px-4 py-3">{s.university || "—"}</td>
                    <td className="px-4 py-3">{s.className || "—"}</td>
                    <td className="num px-4 py-3">{s.published}</td>
                    <td className="num px-4 py-3">{s.seen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
