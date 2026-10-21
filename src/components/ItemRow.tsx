import Link from "next/link";
import type { Item } from "@/db/schema";
import { typeLabel, typeShort } from "@/lib/data";
import { readingMinutes } from "@/lib/blocks";

export function Jalali({ date }: { date: Date | null }) {
  if (!date) return null;
  const formatted = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return <span>{formatted}</span>;
}

export function ItemRow({
  item,
  showAuthor = true,
}: {
  item: Item & { authorName?: string | null };
  showAuthor?: boolean;
}) {
  const minutes = readingMinutes(item.content);

  return (
    <article className="group my-3 border border-rule bg-paper-2 px-4 py-4 shadow-[0_8px_24px_rgba(22,35,63,0.035)] transition-colors hover:border-ink/35 sm:my-0 sm:border-x-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-7 sm:shadow-none">
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-8 sm:gap-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:block">
          <span className="bg-accent/10 px-2 py-0.5 text-[11.5px] font-bold text-accent sm:bg-transparent sm:px-0 sm:py-0 sm:text-[12px]">
            {typeShort(item.type)}
          </span>
          <span className="text-[11.5px] text-ink-soft sm:mt-1 sm:block">
            {item.publishedAt ? <Jalali date={item.publishedAt} /> : "منتشر نشده"}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="line-clamp-2 break-words text-[18px] font-black leading-[1.65] text-ink sm:text-[21px]">
            <Link
              href={`/item/${item.slug}`}
              className="decoration-accent decoration-1 underline-offset-[0.35em] hover:underline"
            >
              {item.title}
            </Link>
          </h3>
          {item.summary ? (
            <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-ink-soft sm:mt-2.5 sm:line-clamp-3 sm:text-[15px] sm:leading-9">
              {item.summary}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11.5px] text-ink-soft sm:mt-3.5 sm:gap-x-4 sm:gap-y-2 sm:text-[12px]">
            {showAuthor ? (
              item.userId && item.authorName ? (
                <Link href={`/students/${item.userId}`} className="max-w-full break-words font-bold text-ink-2 hover:text-accent [overflow-wrap:anywhere]">
                  {item.authorName}
                </Link>
              ) : !item.userId ? (
                <span className="border border-dashed border-rule px-2 py-0.5 text-[10.5px]">محتوای آرشیو</span>
              ) : null
            ) : null}
            {item.course ? <span className="max-w-full break-words text-ink-2 [overflow-wrap:anywhere]">{item.course}</span> : null}
            <span className="hidden sm:inline">{minutes} دقیقه مطالعه</span>
            {item.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="max-w-full truncate border border-rule px-2 py-0.5 text-[10.5px] text-ink-2 hover:border-ink"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-rule pt-3 sm:block sm:border-0 sm:pt-0">
          <span className="text-[11.5px] text-ink-soft sm:hidden">{minutes} دقیقه مطالعه</span>
          <Link
            href={`/item/${item.slug}`}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-ink/25 px-3.5 py-2 text-[12.5px] font-bold text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper-2 sm:min-h-0 sm:self-center sm:px-3.5 sm:text-[13px]"
          >
            ادامهٔ مطلب
            <span aria-hidden="true">←</span>
          </Link>
        </div>
      </div>
      <p className="sr-only">{typeLabel(item.type)}</p>
    </article>
  );
}
