import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";
import { adminEmails, requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { CopyLink } from "@/components/CopyLink";
import { MyItems, type MyItemDTO } from "@/components/MyItems";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "میز کار | بایگانی پژوهش" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("/dashboard");
  const welcome = (await searchParams).welcome === "1";

  const rows = await db
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
    .where(eq(items.userId, user.id))
    .orderBy(desc(items.updatedAt));

  const stamps = rows.length
    ? await db
        .select({ itemId: reviews.itemId, reviewerName: reviews.reviewerName, createdAt: reviews.createdAt })
        .from(reviews)
        .where(inArray(reviews.itemId, rows.map((row) => row.id)))
        .orderBy(desc(reviews.createdAt))
    : [];

  const stampInfo = new Map<number, { count: number; reviewer: string; at: Date }>();
  for (const stamp of stamps) {
    const current = stampInfo.get(stamp.itemId);
    if (current) current.count += 1;
    else stampInfo.set(stamp.itemId, { count: 1, reviewer: stamp.reviewerName, at: stamp.createdAt });
  }

  const dto: MyItemDTO[] = rows.map((row) => {
    const info = stampInfo.get(row.id);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.type,
      course: row.course,
      status: row.status === "published" ? "published" : "draft",
      hiddenByAdmin: row.hiddenByAdmin,
      moderationNote: row.moderationNote,
      updatedAt: row.updatedAt.toISOString(),
      reviews: info?.count ?? 0,
      lastReviewer: info?.reviewer ?? null,
      lastReviewAt: info ? info.at.toISOString() : null,
    };
  });

  const stats: [string, number][] = [
    ["همهٔ مطالب", dto.length],
    ["منتشرشده", dto.filter((d) => d.status === "published" && !d.hiddenByAdmin).length],
    ["پیش‌نویس", dto.filter((d) => d.status !== "published").length],
    ["مشاهده‌شده توسط استاد", dto.filter((d) => d.reviews > 0).length],
  ];
  const firstName = user.fullName.split(" ")[0] || user.fullName;

  return (
    <DashboardShell user={user} active="items">
      {welcome ? (
        <section className="mb-10 border border-moss/40 bg-moss/10 px-6 py-6">
          <p className="text-[12px] font-bold text-moss">حساب شما ساخته شد</p>
          <h2 className="mt-2 text-[22px] font-black text-ink">خوش آمدید، {firstName}!</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            <li className="border-s-2 border-moss/50 ps-4 text-[13.5px] leading-7 text-ink-2">
              <span className="num block text-[11px] text-moss">01</span>
              <Link href="/dashboard/edit" className="font-bold text-ink underline decoration-moss underline-offset-4">اولین مطلب را بنویسید</Link>
              ؛ تکلیف، گزارش، ارائه یا جزوه.
            </li>
            <li className="border-s-2 border-moss/50 ps-4 text-[13.5px] leading-7 text-ink-2">
              <span className="num block text-[11px] text-moss">02</span>
              منتشرش کنید؛ پیش‌نویس‌ها فقط برای خودتان دیده می‌شوند.
            </li>
            <li className="border-s-2 border-moss/50 ps-4 text-[13.5px] leading-7 text-ink-2">
              <span className="num block text-[11px] text-moss">03</span>
              لینک صفحهٔ خود را (کادر پایین) برای استاد بفرستید.
            </li>
          </ol>
          {user.isAdmin ? (
            <p className="mt-5 border-t border-moss/30 pt-4 text-[13px] leading-7 text-ink-2">
              شما <strong>مدیر سایت</strong> هستید؛ در تب «مدیریت مطالب» می‌توانید مطلبی را از دید عموم
              خارج یا دوباره منتشر کنید (بدون حذف) و در تب «حساب‌ها» حساب‌های دیگر را مدیریت کنید.
            </p>
          ) : null}
        </section>
      ) : null}

      {adminEmails().length === 0 ? (
        <p className="mb-8 border-s-4 border-ink/40 bg-paper-2 px-4 py-3 text-[13px] leading-7 text-ink-2">
          <strong>مدیر سایت هنوز تعیین نشده است.</strong> اگر صاحب این سایت هستید، در Vercel متغیر{" "}
          <code className="inline-code">ADMIN_EMAILS</code> را برابر ایمیل خود قرار دهید و Redeploy کنید؛
          بخش «مدیریت» فقط برای همان ایمیل فعال می‌شود.
        </p>
      ) : null}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div>
          <h1 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">مطالب من</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-soft">
            سلام {firstName}؛ وضعیت انتشار و بازبینی همهٔ کارهایتان این‌جاست.
          </p>
        </div>
        <div className="border border-ink/20 bg-paper-2 px-5 py-5">
          <p className="text-[13px] font-bold text-ink-2">لینک صفحهٔ شما برای استاد</p>
          <p className="mt-1 text-[12px] leading-6 text-ink-soft">
            استاد با این لینک «اطلاعات دانشجو» و همهٔ مطالب منتشرشدهٔ شما را می‌بیند.
          </p>
          <div className="mt-3">
            <CopyLink path={`/students/${user.id}`} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-paper-2 px-5 py-5">
            <p className="num text-[34px] font-semibold leading-none text-ink">{String(value).padStart(2, "0")}</p>
            <p className="mt-2.5 text-[12.5px] font-bold text-ink-2">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <MyItems items={dto} />
      </div>
    </DashboardShell>
  );
}
