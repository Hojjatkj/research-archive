import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";
import { typeLabel, TYPES } from "@/lib/data";
import { SeenStamp } from "@/components/Brand";

export const dynamic = "force-dynamic";

function formatDate(iso: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(iso);
}

export default async function ReviewLogPage() {
  const rows = await db
    .select()
    .from(items)
    .where(eq(items.status, "published"))
    .orderBy(asc(items.type), desc(items.publishedAt), desc(items.id));

  const stampRows = await db
    .select({
      itemId: reviews.itemId,
      reviewerName: reviews.reviewerName,
      note: reviews.note,
      createdAt: reviews.createdAt,
      n: sql<number>`count(*)`,
    })
    .from(reviews)
    .groupBy(reviews.itemId, reviews.reviewerName, reviews.note, reviews.createdAt)
    .orderBy(desc(reviews.createdAt));

  const latestByItem = new Map(stampRows.map((r) => [r.itemId, r]));
  const seenCount = rows.filter((r) => latestByItem.has(r.id)).length;
  const pending = rows.length - seenCount;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              خانه
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">کارنامهٔ بازبینی</li>
        </ol>
      </nav>

      <header className="mt-7 border-b-2 border-ink pb-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold text-accent">ویژهٔ استاد راهنما</p>
            <h1 className="mt-5 text-[clamp(2.05rem,4.6vw,3.15rem)] font-black leading-[1.32] text-ink">
              کارنامهٔ بازبینی
            </h1>
            <p className="mt-5 text-[16px] leading-9 text-ink-soft">
              فهرست یک‌جای همهٔ مطالب منتشرشده؛ مواردی که دیده شده‌اند مهر «مشاهده شد»
              دارند و موارد باقی‌مانده مشخص‌اند. برای خواندن هر مطلب کافی است روی عنوان آن
              بزنید.
            </p>
          </div>

          <div className="flex items-center gap-10">
            <div>
              <p className="num text-[46px] font-semibold leading-none text-ink">
                {String(seenCount).padStart(2, "0")}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">مشاهده‌شده</p>
            </div>
            <div>
              <p className="num text-[46px] font-semibold leading-none text-accent">
                {String(pending).padStart(2, "0")}
              </p>
              <p className="mt-2 text-[13px] text-ink-soft">در انتظار بازبینی</p>
            </div>
          </div>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">هنوز مطلبی منتشر نشده است.</p>
      ) : (
        <div className="mt-12 space-y-14">
          {TYPES.map((type) => {
            const group = rows.filter((r) => r.type === type.id);
            if (!group.length) return null;
            return (
              <section key={type.id}>
                <div className="flex items-baseline justify-between border-b border-rule pb-3">
                  <h2 className="text-[19px] font-black text-ink">{typeLabel(type.id)}</h2>
                  <p className="num text-[11px] text-ink-soft">
                    {String(group.length).padStart(2, "0")} مطلب
                  </p>
                </div>

                <ul>
                  {group.map((item) => {
                    const stamp = latestByItem.get(item.id);
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-x-8 gap-y-5 border-b border-rule py-7"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[18px] font-black leading-8 text-ink">
                            <Link
                              href={`/item/${item.slug}`}
                              className="decoration-accent decoration-1 underline-offset-[0.35em] hover:underline"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p className="num mt-2 text-[11px] text-ink-soft">
                            {item.course ? `${item.course} · ` : ""}
                            {item.publishedAt ? formatDate(item.publishedAt) : ""}
                          </p>
                          {stamp?.note ? (
                            <p className="mt-2.5 border-e-2 border-rule pe-3 text-[12px] leading-7 text-ink-soft">
                              یادداشت بازبینی: {stamp.note}
                            </p>
                          ) : null}
                        </div>

                        {stamp ? (
                          <SeenStamp name={stamp.reviewerName} date={formatDate(stamp.createdAt)} />
                        ) : (
                          <span className="border border-rule px-3.5 py-2 text-[12px] text-ink-soft">
                            در انتظار بازبینی
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
