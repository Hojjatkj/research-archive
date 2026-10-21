import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { reviewMap } from "@/lib/data";
import { DashboardShell } from "@/components/DashboardShell";
import { MyItems, type MyItemDTO } from "@/components/MyItems";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "آمار و مطالب | مدیریت بایگانی پژوهش",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await requireAdmin("/dashboard");
  const [rows, reviewCounts] = await Promise.all([
    db
      .select({
        id: items.id,
        title: items.title,
        slug: items.slug,
        type: items.type,
        course: items.course,
        status: items.status,
        hiddenByAdmin: items.hiddenByAdmin,
        moderationNote: items.moderationNote,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .orderBy(desc(items.updatedAt)),
    reviewMap(),
  ]);

  const dto: MyItemDTO[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    type: row.type,
    course: row.course,
    status: row.status === "published" ? "published" : "draft",
    hiddenByAdmin: row.hiddenByAdmin,
    moderationNote: row.moderationNote,
    updatedAt: row.updatedAt.toISOString(),
    reviews: reviewCounts.get(row.id) ?? 0,
  }));

  const totalMarks = dto.reduce((sum, item) => sum + item.reviews, 0);
  const stats: [string, number][] = [
    ["همهٔ مطالب", dto.length],
    ["منتشرشده", dto.filter((item) => item.status === "published" && !item.hiddenByAdmin).length],
    ["پیش‌نویس", dto.filter((item) => item.status !== "published").length],
    ["ثبت‌های «من دیدم»", totalMarks],
  ];

  return (
    <DashboardShell user={user} active="items">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[12px] font-bold text-accent">فقط مدیر</p>
          <h1 className="mt-2 text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">آمار و مطالب آرشیو</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">تعداد ثبت «من دیدم» برای هر مطلب در فهرست پایین نمایش داده می‌شود.</p>
        </div>
        <Link href="/" className="border border-ink px-4 py-2 text-[12.5px] font-bold text-ink hover:bg-ink hover:text-paper-2">
          مشاهدهٔ وب‌سایت
        </Link>
      </div>

      <div className="mt-5 border-s-4 border-ink/40 bg-paper-2 px-5 py-4 text-[13px] leading-7 text-ink-2">
        بازدیدکنندگان بدون حساب مطلب می‌خوانند و دکمهٔ «من این مطلب را دیدم» را می‌زنند. هر مرورگر برای هر مطلب فقط یک ثبت دارد؛
        ثبت‌ها به کوکی ناشناس مرورگر وابسته‌اند، نه به نام یا حساب شخصی.
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-paper-2 px-5 py-5">
            <p className="num text-[34px] font-semibold leading-none text-ink">{String(value).padStart(2, "0")}</p>
            <p className="mt-2.5 text-[12.5px] font-bold text-ink-2">{label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
          <h2 className="text-[21px] font-black text-ink">همهٔ مطالب</h2>
          <p className="text-[12.5px] text-ink-soft">شمار هر مطلب، تعداد ثبت‌های یکتای «من دیدم» است.</p>
        </div>
        <div className="mt-6">
          <MyItems items={dto} />
        </div>
      </section>
    </DashboardShell>
  );
}
