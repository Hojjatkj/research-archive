import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptySheet } from "@/components/Brand";
import { ItemRow, Jalali } from "@/components/ItemRow";
import { getStudent, listPublished, TYPES, typeLabel } from "@/lib/data";

export const dynamic = "force-dynamic";

async function load(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getStudent(id);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const student = await load((await params).id);
  return {
    title: student ? `${student.fullName} — اطلاعات دانشجو | بایگانی پژوهش` : "دانشجو پیدا نشد | بایگانی پژوهش",
  };
}

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await load((await params).id);
  if (!student) notFound();

  const { rows } = await listPublished({ userId: student.id, perPage: 200 });

  const facts: [string, string, boolean][] = [
    ["شماره دانشجویی", student.studentNumber, true],
    ["دانشگاه", student.university, false],
    ["کلاس / درس", student.className, false],
    ["استاد", student.professorName, false],
    ["زمان کلاس", student.classTime, false],
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/students" className="hover:text-ink">اطلاعات دانشجو</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">{student.fullName}</li>
        </ol>
      </nav>

      <div className="mt-5 grid items-start gap-7 sm:mt-7 sm:gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28">
          <section className="border border-ink/25 bg-paper-2">
            <div className="bg-ink px-4 py-4 text-paper-2 sm:px-6 sm:py-5">
              <p className="text-[11px] font-bold text-paper-2/65">اطلاعات دانشجو</p>
              <h1 className="mt-2 break-words text-[21px] font-black leading-[1.45] [overflow-wrap:anywhere] sm:text-[24px] sm:leading-[1.5]">{student.fullName}</h1>
            </div>
            <dl className="divide-y divide-rule text-[13.5px]">
              {facts.filter(([, value]) => value).map(([label, value, ltr]) => (
                <div key={label} className="grid grid-cols-[minmax(6rem,0.45fr)_minmax(0,1fr)] items-start gap-3 px-4 py-3 sm:flex sm:items-baseline sm:justify-between sm:gap-4 sm:px-6">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd dir={ltr ? "ltr" : undefined} className={`min-w-0 break-words text-left font-bold text-ink-2 [overflow-wrap:anywhere] ${ltr ? "num" : ""}`}>
                    {value}
                  </dd>
                </div>
              ))}
              <div className="grid grid-cols-[minmax(6rem,0.45fr)_minmax(0,1fr)] items-start gap-3 px-4 py-3 sm:flex sm:items-baseline sm:justify-between sm:gap-4 sm:px-6">
                <dt className="text-ink-soft">عضویت از</dt>
                <dd className="text-left text-ink-2"><Jalali date={student.createdAt} /></dd>
              </div>
            </dl>
            {student.bio ? (
              <p className="border-t border-rule px-4 py-3 text-[13px] leading-7 text-ink-2 sm:px-6 sm:py-4 sm:text-[13.5px] sm:leading-8">{student.bio}</p>
            ) : null}
          </section>

          <div className="mt-3 border border-rule bg-paper-2 px-4 py-3 text-center sm:mt-5 sm:px-5 sm:py-4">
            <p className="num text-[26px] font-semibold leading-none text-ink sm:text-[30px]">{String(rows.length).padStart(2, "0")}</p>
            <p className="mt-2 text-[12px] text-ink-soft">مطلب منتشرشده</p>
          </div>
        </aside>

        <div className="min-w-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
              <EmptySheet className="h-16 w-16 text-ink/30" />
              <p className="mt-5 text-[18px] font-bold text-ink">هنوز مطلبی منتشر نشده است</p>
              <p className="mt-2.5 max-w-sm text-[14px] leading-8 text-ink-soft">
                در حال حاضر مطلب منتشرشده‌ای برای این دانشجو در آرشیو ثبت نشده است.
              </p>
            </div>
          ) : (
            TYPES.map((type) => {
              const group = rows.filter((row) => row.type === type.id);
              if (!group.length) return null;
              return (
                <section key={type.id} className="mb-12">
                  <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
                    <h2 className="text-[20px] font-black text-ink">{typeLabel(type.id)}</h2>
                    <p className="num text-[12px] text-ink-soft">{String(group.length).padStart(2, "0")} مطلب</p>
                  </div>
                  {group.map((item) => (
                    <ItemRow key={item.id} item={item} showAuthor={false} />
                  ))}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
