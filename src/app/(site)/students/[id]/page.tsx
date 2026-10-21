import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptySheet } from "@/components/Brand";
import { ItemRow, Jalali } from "@/components/ItemRow";
import { getStudent, listPublished, reviewMap, TYPES, typeLabel } from "@/lib/data";

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

  const [{ rows }, reviews] = await Promise.all([
    listPublished({ userId: student.id, perPage: 200 }),
    reviewMap(),
  ]);
  const seen = rows.filter((row) => (reviews.get(row.id) ?? 0) > 0).length;

  const facts: [string, string, boolean][] = [
    ["شماره دانشجویی", student.studentNumber, true],
    ["دانشگاه", student.university, false],
    ["کلاس / درس", student.className, false],
    ["استاد", student.professorName, false],
    ["زمان کلاس", student.classTime, false],
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/students" className="hover:text-ink">اطلاعات دانشجو</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">{student.fullName}</li>
        </ol>
      </nav>

      <div className="mt-7 grid items-start gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28">
          <section className="border border-ink/25 bg-paper-2">
            <div className="bg-ink px-6 py-5 text-paper-2">
              <p className="text-[11px] font-bold text-paper-2/65">اطلاعات دانشجو</p>
              <h1 className="mt-2 text-[24px] font-black leading-[1.5]">{student.fullName}</h1>
            </div>
            <dl className="divide-y divide-rule text-[13.5px]">
              {facts.map(([label, value, ltr]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 px-6 py-3">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd dir={ltr ? "ltr" : undefined} className={`text-left font-bold ${value ? "text-ink-2" : "text-ink-soft/50"} ${ltr ? "num" : ""}`}>
                    {value || "—"}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 px-6 py-3">
                <dt className="text-ink-soft">عضویت از</dt>
                <dd className="text-left text-ink-2"><Jalali date={student.createdAt} /></dd>
              </div>
            </dl>
            {student.bio ? (
              <p className="border-t border-rule px-6 py-4 text-[13.5px] leading-8 text-ink-2">{student.bio}</p>
            ) : null}
          </section>

          <div className="mt-5 grid grid-cols-3 gap-px border border-rule bg-rule text-center">
            {[
              ["منتشرشده", rows.length, "text-ink"],
              ["مشاهده‌شده", seen, "text-accent"],
              ["در انتظار", rows.length - seen, "text-ink-soft"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="bg-paper-2 px-2 py-4">
                <p className={`num text-[26px] font-semibold leading-none ${color}`}>{String(value).padStart(2, "0")}</p>
                <p className="mt-2 text-[11.5px] text-ink-soft">{label}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/review?student=${student.id}`}
            className="mt-5 block border border-ink px-4 py-2.5 text-center text-[13px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper-2"
          >
            کارنامهٔ بازبینی این دانشجو
          </Link>
        </aside>

        <div className="min-w-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
              <EmptySheet className="h-16 w-16 text-ink/30" />
              <p className="mt-5 text-[18px] font-bold text-ink">هنوز مطلبی منتشر نشده است</p>
              <p className="mt-2.5 max-w-sm text-[14px] leading-8 text-ink-soft">
                تکالیف، ارائه‌ها و جزوه‌های این دانشجو پس از انتشار این‌جا نمایش داده می‌شوند.
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
                    <ItemRow key={item.id} item={item} reviewed={reviews.get(item.id) ?? 0} showAuthor={false} />
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
