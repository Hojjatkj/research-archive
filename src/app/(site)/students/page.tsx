import type { Metadata } from "next";
import Link from "next/link";
import { EmptySheet } from "@/components/Brand";
import { listStudents } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "اطلاعات دانشجو | بایگانی پژوهش" };

function Value({ value, ltr = false }: { value: string; ltr?: boolean }) {
  if (!value) return <span className="text-ink-soft/50">—</span>;
  return (
    <span dir={ltr ? "ltr" : undefined} className={ltr ? "num" : undefined}>
      {value}
    </span>
  );
}

export default async function StudentsPage() {
  const students = await listStudents();

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">اطلاعات دانشجو</li>
        </ol>
      </nav>

      <header className="mt-7 flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-8">
        <div className="max-w-2xl">
          <p className="text-[12px] font-bold text-accent">ویژهٔ استاد راهنما</p>
          <h1 className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] font-black leading-[1.3] text-ink">اطلاعات دانشجو</h1>
          <p className="mt-4 text-[16px] leading-9 text-ink-soft">
            نام، شمارهٔ دانشجویی، دانشگاه، کلاس، استاد و زمان کلاس هر دانشجو در یک‌جا. برای دیدن تکالیف،
            ارائه‌ها و جزوه‌های هر نفر روی نامش بزنید.
          </p>
        </div>
        <p className="num text-[13px] text-ink-soft">{String(students.length).padStart(2, "0")} دانشجو</p>
      </header>

      {students.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
          <EmptySheet className="h-16 w-16 text-ink/30" />
          <p className="mt-5 text-[18px] font-bold text-ink">هنوز دانشجویی ثبت‌نام نکرده است</p>
          <p className="mt-2.5 max-w-sm text-[14px] leading-8 text-ink-soft">
            به‌محض اینکه اولین دانشجو حساب بسازد، اطلاعاتش این‌جا نمایش داده می‌شود.
          </p>
          <Link href="/signup" className="mt-6 border border-accent bg-accent px-5 py-2.5 text-[14px] font-bold text-paper-2 hover:bg-accent-2">
            ساخت حساب دانشجویی
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 hidden overflow-x-auto border border-rule bg-paper-2 md:block">
            <table className="w-full min-w-[58rem] border-collapse text-right text-[13.5px]">
              <thead className="bg-paper-3/70 text-[12px] text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">نام دانشجو</th>
                  <th scope="col" className="px-4 py-3 font-bold">شماره دانشجویی</th>
                  <th scope="col" className="px-4 py-3 font-bold">دانشگاه</th>
                  <th scope="col" className="px-4 py-3 font-bold">کلاس / درس</th>
                  <th scope="col" className="px-4 py-3 font-bold">استاد</th>
                  <th scope="col" className="px-4 py-3 font-bold">زمان کلاس</th>
                  <th scope="col" className="px-4 py-3 font-bold">مطالب</th>
                  <th scope="col" className="px-4 py-3 font-bold">مشاهده‌شده</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-rule align-top transition-colors hover:bg-white/70">
                    <td className="px-4 py-3.5">
                      <Link href={`/students/${s.id}`} className="font-bold text-ink underline decoration-rule underline-offset-[0.35em] hover:decoration-accent">
                        {s.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5"><Value value={s.studentNumber} ltr /></td>
                    <td className="px-4 py-3.5"><Value value={s.university} /></td>
                    <td className="px-4 py-3.5"><Value value={s.className} /></td>
                    <td className="px-4 py-3.5"><Value value={s.professorName} /></td>
                    <td className="px-4 py-3.5 text-[12.5px]"><Value value={s.classTime} /></td>
                    <td className="num px-4 py-3.5">{s.published}</td>
                    <td className="num px-4 py-3.5">{s.seen > 0 ? <span className="font-bold text-accent">{s.seen} ✓</span> : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-8 space-y-4 md:hidden">
            {students.map((s) => (
              <li key={s.id} className="border border-rule bg-paper-2">
                <Link href={`/students/${s.id}`} className="block px-5 py-5">
                  <p className="text-[17px] font-black text-ink">{s.fullName}</p>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
                    <dt className="text-ink-soft">شماره دانشجویی</dt>
                    <dd className="text-ink-2"><Value value={s.studentNumber} ltr /></dd>
                    <dt className="text-ink-soft">دانشگاه</dt>
                    <dd className="text-ink-2"><Value value={s.university} /></dd>
                    <dt className="text-ink-soft">کلاس / درس</dt>
                    <dd className="text-ink-2"><Value value={s.className} /></dd>
                    <dt className="text-ink-soft">استاد</dt>
                    <dd className="text-ink-2"><Value value={s.professorName} /></dd>
                    <dt className="text-ink-soft">زمان کلاس</dt>
                    <dd className="text-ink-2"><Value value={s.classTime} /></dd>
                  </dl>
                  <p className="mt-3 border-t border-rule pt-3 text-[12px] text-ink-soft">
                    <span className="num">{s.published}</span> مطلب منتشرشده · <span className="num">{s.seen}</span> مشاهده‌شده
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
