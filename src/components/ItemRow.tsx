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
  return (
    <article className="group border-b border-rule py-8">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <div className="w-full shrink-0 sm:w-[8.5rem]">
          <p className="text-[12px] font-bold text-accent">{typeShort(item.type)}</p>
          <p className="mt-1 text-[11.5px] text-ink-soft">
            {item.publishedAt ? <Jalali date={item.publishedAt} /> : "منتشر نشده"}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[21px] font-black leading-[1.65] text-ink">
            <Link
              href={`/item/${item.slug}`}
              className="decoration-accent decoration-1 underline-offset-[0.35em] hover:underline"
            >
              {item.title}
            </Link>
          </h3>
          {item.summary ? (
            <p className="mt-2.5 line-clamp-3 text-[15px] leading-9 text-ink-soft">{item.summary}</p>
          ) : null}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-soft">
            {showAuthor ? (
              item.userId && item.authorName ? (
                <Link href={`/students/${item.userId}`} className="font-bold text-ink-2 hover:text-accent">
                  {item.authorName}
                </Link>
              ) : !item.userId ? (
                <span className="border border-dashed border-rule px-2 py-0.5 text-[11px]">محتوای آرشیو</span>
              ) : null
            ) : null}
            {item.course ? <span className="text-ink-2">{item.course}</span> : null}
            <span>{readingMinutes(item.content)} دقیقه مطالعه</span>
            {item.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="border border-rule px-2 py-0.5 text-[11px] text-ink-2 hover:border-ink"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href={`/item/${item.slug}`}
          className="shrink-0 self-center border border-ink/20 px-3.5 py-2 text-[13px] font-bold text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper-2"
        >
          خواندن
        </Link>
      </div>
      <p className="sr-only">{typeLabel(item.type)}</p>
    </article>
  );
}
