import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockList } from "@/lib/render";
import { readingMinutes, tocOf, type Block } from "@/lib/blocks";
import { getStudent, getVisibleItem, neighbors, sectionHref, typeLabel } from "@/lib/data";
import { hasSeenItem } from "@/lib/seen";
import { Jalali } from "@/components/ItemRow";
import { ReviewPanel } from "@/components/ReviewPanel";

export const dynamic = "force-dynamic";

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getVisibleItem(decodeSlug(slug));
  return {
    title: item ? `${item.title} | بایگانی پژوهش` : "مطلب پیدا نشد | بایگانی پژوهش",
    description: item?.summary || undefined,
  };
}

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getVisibleItem(decodeSlug(slug));
  if (!item) notFound();

  const toc = tocOf(item.content);
  const [{ prev, next }, alreadySeen, author] = await Promise.all([
    neighbors(item),
    hasSeenItem(item.id),
    item.userId ? getStudent(item.userId) : Promise.resolve(null),
  ]);

  const attachments = item.content.filter(
    (block): block is Extract<Block, { type: "file" }> => block.type === "file" && block.fileId > 0,
  );

  const authorFacts: [string, string, boolean][] = author
    ? [
        ["شماره دانشجویی", author.studentNumber, true],
        ["دانشگاه", author.university, false],
        ["کلاس / درس", author.className, false],
        ["استاد", author.professorName, false],
        ["زمان کلاس", author.classTime, false],
      ]
    : [];

  return (
    <article className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-12 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={sectionHref(item.type)} className="hover:text-ink">{typeLabel(item.type)}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="max-w-[22rem] truncate text-ink-2">{item.title}</li>
        </ol>
      </nav>

      <header className="mt-6 border-b border-rule pb-7 sm:mt-8 sm:pb-10">
        <p className="text-[12px] font-bold text-accent">{typeLabel(item.type)}</p>
        <h1 className="mt-3 max-w-4xl break-words text-[clamp(1.8rem,7vw,3.3rem)] font-black leading-[1.38] text-ink sm:mt-4 sm:leading-[1.32]">
          {item.title}
        </h1>

        {item.summary ? (
          <p className="mt-4 max-w-3xl border-s-2 border-accent ps-4 text-[15px] leading-8 text-ink-2 sm:mt-6 sm:ps-5 sm:text-[17px] sm:leading-9">
            {item.summary}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2.5 text-[11.5px] text-ink-soft sm:mt-8 sm:gap-x-6 sm:gap-y-3 sm:text-[12.5px]">
          {author ? (
            <Link href={`/students/${author.id}`} className="max-w-full break-words font-bold text-ink hover:text-accent">
              {author.fullName}
            </Link>
          ) : !item.userId ? (
            <span className="border border-dashed border-rule px-2 py-0.5">محتوای بایگانی</span>
          ) : null}
          {item.course ? <span className="max-w-full break-words text-ink-2 [overflow-wrap:anywhere]">{item.course}</span> : null}
          {item.publishedAt ? (
            <span>
              انتشار: <Jalali date={item.publishedAt} />
            </span>
          ) : null}
          <span>{readingMinutes(item.content)} دقیقه مطالعه</span>
          <span className="flex flex-wrap items-center gap-2">
            {item.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="border border-rule px-2 py-0.5 text-[11px] text-ink-2 hover:border-ink"
              >
                {tag}
              </Link>
            ))}
          </span>
        </div>
      </header>

      {toc.length > 0 ? (
        <details className="group mt-5 border border-rule bg-paper-2 lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-bold text-ink-2 [&::-webkit-details-marker]:hidden">
            <span>فهرست این مطلب</span>
            <svg className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <ol className="max-h-64 space-y-1 overflow-y-auto border-t border-rule px-4 py-3">
            {toc.map((entry) => (
              <li key={entry.id} className={entry.level === 3 ? "ps-4" : ""}>
                <a href={`#${entry.id}`} className="block border-s border-rule py-1 ps-3 text-[12px] leading-6 text-ink-soft hover:border-accent hover:text-ink">
                  {entry.text}
                </a>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <div className="mt-8 grid gap-8 sm:mt-12 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-14">
        <div className="min-w-0">
          <BlockList blocks={item.content} />

          <nav aria-label="مطالب قبلی و بعدی" className="mt-16 grid gap-px border-y border-rule bg-rule sm:grid-cols-2">
            {prev ? (
              <Link href={`/item/${prev.slug}`} className="bg-paper px-6 py-7 hover:bg-paper-2">
                <p className="text-[11px] text-ink-soft">مطلب قبلی</p>
                <p className="mt-2 text-[15px] font-bold leading-8 text-ink">{prev.title}</p>
              </Link>
            ) : (
              <div className="bg-paper px-6 py-7 opacity-50">
                <p className="text-[11px] text-ink-soft">مطلب قبلی</p>
                <p className="mt-2 text-[14px] leading-8 text-ink-soft">مطلبی پیش از این نیست</p>
              </div>
            )}
            {next ? (
              <Link href={`/item/${next.slug}`} className="bg-paper px-6 py-7 hover:bg-paper-2 sm:text-left">
                <p className="text-[11px] text-ink-soft">مطلب بعدی</p>
                <p className="mt-2 text-[15px] font-bold leading-8 text-ink">{next.title}</p>
              </Link>
            ) : (
              <div className="bg-paper px-6 py-7 opacity-50 sm:text-left">
                <p className="text-[11px] text-ink-soft">مطلب بعدی</p>
                <p className="mt-2 text-[14px] leading-8 text-ink-soft">مطلبی پس از این نیست</p>
              </div>
            )}
          </nav>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:h-fit">
          {author ? (
            <section className="border border-ink/25 bg-paper-2">
              <div className="bg-ink px-5 py-4 text-paper-2">
                <p className="text-[11px] text-paper-2/65">اطلاعات دانشجو</p>
                <Link href={`/students/${author.id}`} className="mt-1 block text-[16px] font-black leading-7 hover:underline">
                  {author.fullName}
                </Link>
              </div>
              <dl className="divide-y divide-rule text-[12.5px]">
                {authorFacts
                  .filter(([, value]) => value)
                  .map(([label, value, ltr]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 px-5 py-2.5">
                      <dt className="text-ink-soft">{label}</dt>
                      <dd dir={ltr ? "ltr" : undefined} className={`text-left font-bold text-ink-2 ${ltr ? "num" : ""}`}>
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
              <Link href={`/students/${author.id}`} className="block border-t border-rule px-5 py-3 text-[12.5px] font-bold text-accent hover:bg-paper-3/50">
                همهٔ مطالب این دانشجو ←
              </Link>
            </section>
          ) : null}

          {toc.length > 0 ? (
            <nav className="hidden border border-rule bg-paper-2 px-5 py-5 lg:block" aria-label="فهرست مطالب">
              <p className="text-[12px] font-bold text-ink-2">در این صفحه</p>
              <ol className="mt-3 space-y-2">
                {toc.map((entry) => (
                  <li key={entry.id} className={entry.level === 3 ? "ps-4" : ""}>
                    <a href={`#${entry.id}`} className="block border-s border-rule ps-3 text-[12.5px] leading-7 text-ink-soft hover:border-accent hover:text-ink">
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {attachments.length > 0 ? (
            <div className="border border-rule bg-paper-2 px-5 py-5">
              <p className="text-[12px] font-bold text-ink-2">پیوست‌ها</p>
              <ul className="mt-3 space-y-2.5">
                {attachments.map((block, i) => (
                  <li key={i}>
                    <a href={`/api/files/${block.fileId}?download=1`} className="flex items-center gap-2 text-[12.5px] leading-7 text-ink-2 hover:text-accent">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      {block.label || "دریافت فایل"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ReviewPanel key={item.id} itemId={item.id} alreadySeen={alreadySeen} />
        </aside>
      </div>
    </article>
  );
}
