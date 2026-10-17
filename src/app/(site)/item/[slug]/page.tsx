import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockList } from "@/lib/render";
import { readingMinutes, tocOf } from "@/lib/blocks";
import { getPublishedItem, neighbors, reviewsFor, typeLabel } from "@/lib/data";
import { Jalali } from "@/components/ItemRow";
import { ReviewPanel } from "@/components/ReviewPanel";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublishedItem(slug);
  if (!item) notFound();

  const toc = tocOf(item.content);
  const [{ prev, next }, reviews] = await Promise.all([neighbors(item), reviewsFor(item.id)]);

  const attachments = item.content.filter((b) => b.type === "file");
  const sectionHref =
    item.type === "presentation" ? "/presentations" : item.type === "notes" ? "/notes" : "/archive";

  return (
    <article className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              خانه
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={sectionHref} className="hover:text-ink">
              {typeLabel(item.type)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-[22rem] truncate text-ink-2">{item.title}</li>
        </ol>
      </nav>

      <header className="mt-8 border-b border-rule pb-10">
        <p className="text-[12px] font-bold text-accent">{typeLabel(item.type)}</p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2rem,4.6vw,3.35rem)] font-black leading-[1.32] text-ink">
          {item.title}
        </h1>

        {item.summary ? (
          <p className="mt-6 max-w-3xl border-e-2 border-accent pe-5 text-[17px] leading-9 text-ink-2">
            {item.summary}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-ink-soft">
          {item.course ? <span className="text-ink-2">{item.course}</span> : null}
          {item.publishedAt ? (
            <span>
              انتشار: <Jalali date={item.publishedAt} />
            </span>
          ) : null}
          <span className="num">{readingMinutes(item.content)} دقیقه مطالعه</span>
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

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_17.5rem]">
        <div>
          <BlockList blocks={item.content} />

          <nav className="mt-16 grid gap-px border-y border-rule bg-rule sm:grid-cols-2">
            <Link
              href={prev ? `/item/${prev.slug}` : "#"}
              className={`bg-paper px-6 py-7 ${prev ? "hover:bg-paper-2" : "pointer-events-none opacity-45"}`}
            >
              <p className="text-[11px] text-ink-soft">مطلب قبلی</p>
              <p className="mt-2 text-[15px] font-bold leading-8 text-ink">
                {prev ? prev.title : "مطلبی پیش از این نیست"}
              </p>
            </Link>
            <Link
              href={next ? `/item/${next.slug}` : "#"}
              className={`bg-paper px-6 py-7 text-start sm:text-end ${next ? "hover:bg-paper-2" : "pointer-events-none opacity-45"}`}
            >
              <p className="text-[11px] text-ink-soft">مطلب بعدی</p>
              <p className="mt-2 text-[15px] font-bold leading-8 text-ink">
                {next ? next.title : "مطلبی پس از این نیست"}
              </p>
            </Link>
          </nav>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          {toc.length > 0 ? (
            <nav className="border border-rule bg-paper-2 px-5 py-5" aria-label="فهرست مطالب">
              <p className="text-[12px] font-bold text-ink-2">در این صفحه</p>
              <ol className="mt-3 space-y-2">
                {toc.map((entry) => (
                  <li key={entry.id} className={entry.level === 3 ? "ps-4" : ""}>
                    <a
                      href={`#${entry.id}`}
                      className="block border-e border-rule pe-3 text-[12.5px] leading-7 text-ink-soft hover:border-accent hover:text-ink"
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {attachments.length > 0 ? (
            <div className="mt-5 border border-rule bg-paper-2 px-5 py-5">
              <p className="text-[12px] font-bold text-ink-2">پیوست‌ها</p>
              <ul className="mt-3 space-y-2.5">
                {attachments.map((block, i) =>
                  block.type === "file" ? (
                    <li key={i}>
                      <a
                        href={`/api/files/${block.fileId}?download=1`}
                        className="flex items-center gap-2 text-[12.5px] leading-7 text-ink-2 hover:text-accent"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        {block.label || "دریافت فایل"}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ) : null}

          <ReviewPanel
            itemId={item.id}
            reviews={reviews.map((r) => ({
              id: r.id,
              reviewerName: r.reviewerName,
              note: r.note,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </aside>
      </div>
    </article>
  );
}
