import Link from "next/link";
import { ItemRow } from "@/components/ItemRow";
import { Pagination, SearchForm } from "@/components/Pagination";
import { EmptySheet } from "@/components/Brand";
import { allCourses, listPublished, typeLabel } from "@/lib/data";

export async function SectionIndex({
  title,
  lead,
  types,
  base,
  params,
  showTypeFilter = false,
}: {
  title: string;
  lead: string;
  types: string[];
  base: string;
  params: Record<string, string | string[] | undefined>;
  showTypeFilter?: boolean;
}) {
  const page = Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1;
  const course = Array.isArray(params.course) ? params.course[0] : params.course;
  const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const typeFilter = Array.isArray(params.type) ? params.type[0] : params.type;
  const activeTypes = showTypeFilter && typeFilter ? [typeFilter] : types;

  const [{ rows, total, pages }, courses] = await Promise.all([
    listPublished({ type: activeTypes, course, tag, page, perPage: 8 }),
    allCourses(),
  ]);

  const query: Record<string, string> = {};
  if (course) query.course = course;
  if (tag) query.tag = tag;
  if (typeFilter && showTypeFilter) query.type = typeFilter;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              خانه
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">{title}</li>
        </ol>
      </nav>

      <header className="mt-7 border-b-2 border-ink pb-7">
        <h1 className="text-[clamp(1.8rem,7vw,3.15rem)] font-black leading-[1.35] text-ink sm:leading-[1.3]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-ink-soft sm:mt-4 sm:text-[16px] sm:leading-9">{lead}</p>
      </header>

      <details className="group mt-5 border border-rule bg-paper-2 lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-bold text-ink-2 [&::-webkit-details-marker]:hidden">
          <span>فیلتر بر اساس درس</span>
          <span className="flex min-w-0 items-center gap-2 text-[12px] font-normal text-ink-soft">
            <span className="max-w-[11rem] truncate">{course || "همهٔ درس‌ها"}</span>
            <svg className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </summary>
        <ul className="max-h-64 overflow-y-auto border-t border-rule px-4 py-2">
          <li className="border-b border-rule/70">
            <Link
              href={base}
              className={`block py-2.5 text-[13px] ${!course ? "font-bold text-ink" : "text-ink-soft"}`}
            >
              همهٔ درس‌ها
            </Link>
          </li>
          {courses.map((c) => (
            <li key={c} className="border-b border-rule/70 last:border-0">
              <Link
                href={`${base}?course=${encodeURIComponent(c)}`}
                className={`block py-2.5 text-[13px] ${
                  course === c ? "font-bold text-ink" : "text-ink-soft"
                }`}
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </details>
      {tag ? (
        <p className="mt-3 border-e-2 border-accent bg-paper-2 px-4 py-3 text-[12px] text-ink-2 lg:hidden">
          برچسب فعال: <strong>{tag}</strong>{" "}
          <Link href={base} className="font-bold text-accent hover:underline">حذف فیلتر</Link>
        </p>
      ) : null}

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_17rem] lg:gap-10">
        <div>
          <div className="flex flex-wrap items-center gap-3 border-b border-rule pb-5">
            <p className="num text-[12px] text-ink-soft">
              {String(total).padStart(2, "0")} مطلب
            </p>

            {showTypeFilter ? (
              <div className="flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                {types.map((t) => {
                  const active = activeTypes.length === 1 && activeTypes[0] === t;
                  return (
                    <Link
                      key={t}
                      href={active ? base : `${base}?type=${t}`}
                      className={`shrink-0 border px-3 py-1.5 text-[12px] ${
                        active
                          ? "border-ink bg-ink text-paper-2"
                          : "border-rule text-ink-2 hover:border-ink"
                      }`}
                    >
                      {typeLabel(t)}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div className="ms-auto w-full sm:w-64">
              <SearchForm />
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="mt-10 flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
              <EmptySheet className="h-16 w-16 text-ink/30" />
              <p className="mt-5 text-[18px] font-bold text-ink">هنوز مطلبی در این بخش نیست</p>
              <p className="mt-2.5 max-w-sm text-[14px] leading-8 text-ink-soft">
                به‌محض انتشار اولین مطلب، همین‌جا نمایش داده می‌شود.
              </p>
              <Link
                href="/"
                className="mt-6 border border-ink px-4 py-2 text-[13px] font-bold text-ink hover:bg-ink hover:text-paper-2"
              >
                بازگشت به خانه
              </Link>
            </div>
          ) : (
            <div>
              {rows.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          <Pagination page={page} pages={pages} base={base} query={query} />
        </div>

        <aside className="hidden lg:sticky lg:top-28 lg:block lg:h-fit">
          <div className="border border-rule bg-paper-2">
            <p className="border-b border-rule px-5 py-3.5 text-[13px] font-bold text-ink-2">
              فیلتر بر اساس درس
            </p>
            <ul className="max-h-[22rem] overflow-y-auto px-5 py-3">
              <li>
                <Link
                  href={base}
                  className={`block py-1.5 text-[13px] ${!course ? "font-bold text-ink" : "text-ink-soft hover:text-ink"}`}
                >
                  همهٔ درس‌ها
                </Link>
              </li>
              {courses.map((c) => (
                <li key={c}>
                  <Link
                    href={`${base}?course=${encodeURIComponent(c)}`}
                    className={`block py-1.5 text-[13px] ${
                      course === c ? "font-bold text-ink" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {tag ? (
            <p className="mt-5 border-e-2 border-accent bg-paper-2 px-4 py-3 text-[13px] text-ink-2">
              برچسب فعال: <strong>{tag}</strong>{" "}
              <Link href={base} className="text-accent hover:underline">
                (حذف فیلتر)
              </Link>
            </p>
          ) : null}

          <div className="mt-5 border border-rule px-5 py-5">
            <p className="text-[13px] font-bold text-ink-2">راهنما</p>
            <p className="mt-2.5 text-[12.5px] leading-8 text-ink-soft">
              برای جست‌وجوی سریع، عنوان مطلب، نام درس یا برچسب را در کادر جست‌وجو بنویسید.
              متن کامل مطالب هم جست‌وجو می‌شود.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
