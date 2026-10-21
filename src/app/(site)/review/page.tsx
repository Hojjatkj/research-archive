import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getStudent, listPublished, reviewMap, TYPES, typeLabel } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "تعداد ثبت‌های مشاهده | بایگانی پژوهش",
  robots: { index: false, follow: false },
};

export default async function ReviewLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("/review");
  const params = await searchParams;
  const raw = Array.isArray(params.student) ? params.student[0] : params.student;
  const studentId = Number(raw);
  const student = Number.isInteger(studentId) && studentId > 0 ? await getStudent(studentId) : null;

  const [{ rows }, counts] = await Promise.all([
    listPublished({ userId: student?.id, perPage: 500 }),
    reviewMap(),
  ]);
  const totalMarks = rows.reduce((sum, item) => sum + (counts.get(item.id) ?? 0), 0);
  const markedItems = rows.filter((item) => (counts.get(item.id) ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">آمار ثبت‌های مشاهده</li>
        </ol>
      </nav>

      <header className="mt-7 border-b-2 border-ink pb-8">
        <p className="text-[12px] font-bold text-accent">فقط مدیر</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(2.05rem,4.6vw,3.1rem)] font-black leading-[1.32] text-ink">
              {student ? `ثبت‌های مشاهدهٔ ${student.fullName}` : "آمار ثبت‌های مشاهده"}
            </h1>
            <p className="mt-4 text-[15px] leading-9 text-ink-soft">
              تعداد دفعات یکتایی که بازدیدکنندگان برای هر مطلب دکمهٔ «من این مطلب را دیدم» را زده‌اند.
              این گزارش برای عموم نمایش داده نمی‌شود.
            </p>
            {student ? (
              <Link href="/review" className="mt-3 inline-block text-[13px] font-bold text-accent hover:underline">
                نمایش همهٔ مطالب
              </Link>
            ) : null}
          </div>
          <div className="flex items-end gap-8">
            <div>
              <p className="num text-[42px] font-semibold leading-none text-ink">{String(totalMarks).padStart(2, "0")}</p>
              <p className="mt-2 text-[12px] text-ink-soft">کل ثبت‌ها</p>
            </div>
            <div>
              <p className="num text-[42px] font-semibold leading-none text-accent">{String(markedItems).padStart(2, "0")}</p>
              <p className="mt-2 text-[12px] text-ink-soft">مطالب دارای ثبت</p>
            </div>
          </div>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="py-20 text-center text-ink-soft">هنوز مطلب منتشرشده‌ای وجود ندارد.</p>
      ) : (
        <div className="mt-10 space-y-12">
          {TYPES.map((type) => {
            const group = rows.filter((row) => row.type === type.id);
            if (!group.length) return null;
            return (
              <section key={type.id}>
                <div className="flex items-baseline justify-between border-b border-rule pb-3">
                  <h2 className="text-[19px] font-black text-ink">{typeLabel(type.id)}</h2>
                  <p className="num text-[11px] text-ink-soft">{String(group.length).padStart(2, "0")} مطلب</p>
                </div>
                <ul>
                  {group.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-rule py-6">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-black leading-8 text-ink">
                          <Link href={`/item/${item.slug}`} className="decoration-accent decoration-1 underline-offset-[0.35em] hover:underline">
                            {item.title}
                          </Link>
                        </h3>
                        {item.course ? <p className="mt-1 text-[12px] text-ink-soft">{item.course}</p> : null}
                      </div>
                      <p className="border border-rule bg-paper-2 px-4 py-2 text-[13px] text-ink-2">
                        ثبت «من دیدم»: <strong className="num text-[16px] text-accent">{counts.get(item.id) ?? 0}</strong>
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
