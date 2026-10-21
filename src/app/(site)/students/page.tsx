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
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">اطلاعات دانشجو</li>
        </ol>
      </nav>

      <header className="mt-7 flex flex-wrap items-end justify-between gap-6 border-b-2 border-ink pb-8">
        <div className="max-w-2xl">
          <p className="text-[12px] font-bold text-accent">آرشیو عمومی</p>
          <h1 className="mt-3 text-[clamp(1.8rem,7vw,3.1rem)] font-black leading-[1.35] text-ink sm:mt-4 sm:leading-[1.3]">اطلاعات دانشجو</h1>
          <p className="mt-3 text-[14px] leading-7 text-ink-soft sm:mt-4 sm:text-[16px] sm:leading-9">
            نام، شمارهٔ دانشجویی، دانشگاه، کلاس، استاد و زمان کلاس هر دانشجو در یک‌جا. برای دیدن مطالب
            منتشرشدهٔ هر نفر روی نامش بزنید.
          </p>
        </div>
        <p className="num text-[13px] text-ink-soft">{String(students.length).padStart(2, "0")} دانشجو</p>
      </header>

      {students.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
          <EmptySheet className="h-16 w-16 text-ink/30" />
          <p className="mt-5 text-[18px] font-bold text-ink">اطلاعات دانشجویی در این بخش موجود نیست</p>
          <p className="mt-2.5 max-w-sm text-[14px] leading-8 text-ink-soft">
            مطالب منتشرشده را می‌توانید از بخش‌های آرشیو یا جست‌وجو پیدا کنید.
          </p>
          <Link href="/archive" className="mt-6 border border-ink px-5 py-2.5 text-[14px] font-bold text-ink hover:bg-ink hover:text-paper-2">
            رفتن به آرشیو
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 hidden overflow-x-auto border border-rule bg-paper-2 xl:block">
            <table className="w-full min-w-[52rem] border-collapse text-right text-[13.5px]">
              <thead className="bg-paper-3/70 text-[12px] text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold">نام دانشجو</th>
                  <th scope="col" className="px-4 py-3 font-bold">شماره دانشجویی</th>
                  <th scope="col" className="px-4 py-3 font-bold">دانشگاه</th>
                  <th scope="col" className="px-4 py-3 font-bold">کلاس / درس</th>
                  <th scope="col" className="px-4 py-3 font-bold">استاد</th>
                  <th scope="col" className="px-4 py-3 font-bold">زمان کلاس</th>
                  <th scope="col" className="px-4 py-3 font-bold">مطالب</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t border-rule align-top transition-colors hover:bg-white/70">
                    <td className="px-4 py-3.5">
                      <Link href={`/students/${student.id}`} className="font-bold text-ink underline decoration-rule underline-offset-[0.35em] hover:decoration-accent">
                        {student.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5"><Value value={student.studentNumber} ltr /></td>
                    <td className="px-4 py-3.5"><Value value={student.university} /></td>
                    <td className="px-4 py-3.5"><Value value={student.className} /></td>
                    <td className="px-4 py-3.5"><Value value={student.professorName} /></td>
                    <td className="px-4 py-3.5 text-[12.5px]"><Value value={student.classTime} /></td>
                    <td className="num px-4 py-3.5">{student.published}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-3 xl:hidden sm:mt-8 sm:space-y-4">
            {students.map((student) => {
              const details = [
                ["شماره دانشجویی", student.studentNumber, true],
                ["دانشگاه", student.university, false],
                ["کلاس / درس", student.className, false],
                ["استاد", student.professorName, false],
                ["زمان کلاس", student.classTime, false],
              ] as const;

              return (
                <li key={student.id} className="border border-rule bg-paper-2 shadow-[0_6px_18px_rgba(22,35,63,0.035)]">
                  <Link href={`/students/${student.id}`} className="block px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-[16px] font-black text-ink sm:text-[17px]">{student.fullName}</p>
                    <dl className="mt-3 grid grid-cols-[minmax(6rem,0.45fr)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[12px] sm:text-[13px]">
                      {details.filter(([, value]) => value).map(([label, value, ltr]) => (
                        <div key={label} className="contents">
                          <dt className="text-ink-soft">{label}</dt>
                          <dd dir={ltr ? "ltr" : undefined} className={`min-w-0 break-words text-ink-2 [overflow-wrap:anywhere] ${ltr ? "num text-left" : ""}`}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 border-t border-rule pt-3 text-[12px] text-ink-soft">
                      <span className="num">{student.published}</span> مطلب منتشرشده
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
