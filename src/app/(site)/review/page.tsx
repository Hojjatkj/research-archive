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
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">آمار ثبت‌های مشاهده</li>
        </ol>
      </nav>

      <header className="mt-6 border-b-2 border-ink pb-6 sm:mt-7 sm:pb-8">
        <p className="text-[12px] font-bold text-accent">فقط مدیر</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(1.8rem,7vw,3.1rem)] font-black leading-[1.35] text-ink sm:leading-[1.32]">
              {student ? `ثبت‌های مشاهدهٔ ${student.fullName}` : "آمار ثبت‌های مشاهده"}
            </h1>
            <p className="mt-3 text-[14px] leading-7 text-ink-soft sm:mt-4 sm:text-[15px] sm:leading-9">
              تعداد دفعات یکتایی که بازدیدکنندگان برای هر مطلب دکمهٔ «من این مطلب را دیدم» را زده‌اند.
              این گزارش برای عموم نمایش داده نمی‌شود.
            </p>
            {student ? (
              <Link href="/review" className="mt-3 inline-block text-[13px] font-bold text-accent hover:underline">
                نمایش همهٔ مطالب
              </Link>
            ) : null}
          </div>
          <div className="flex items-end gap-5 sm:gap-8">
            <div>
              <p className="num text-[34px] font-semibold leading-none text-ink sm:text-[42px]">{String(totalMarks).padStart(2, "0")}</p>
              <p className="mt-2 text-[12px] text-ink-soft">کل ثبت‌ها</p>
            </div>
            <div>
              <p className="num text-[34px] font-semibold leading-none text-accent sm:text-[42px]">{String(markedItems).padStart(2, "0")}</p>
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
                    <li key={item.id} className="my-3 flex flex-col gap-3 border border-rule bg-paper-2 px-4 py-4 shadow-[0_6px_18px_rgba(22,35,63,0.035)] sm:my-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4 sm:border-x-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-6 sm:shadow-none">
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
