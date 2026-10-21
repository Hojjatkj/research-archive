import Link from "next/link";

export function SearchForm({
  defaultValue = "",
  big = false,
  className = "",
}: {
  defaultValue?: string;
  big?: boolean;
  className?: string;
}) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className={`flex items-stretch gap-2 ${className}`}
    >
      <label htmlFor="q" className="sr-only">
        جست‌وجو در بایگانی
      </label>
      <input
        id="q"
        name="q"
        defaultValue={defaultValue}
        placeholder="جست‌وجو در عنوان و متن مطالب…"
        className={`min-h-11 min-w-0 flex-1 border border-rule bg-paper-2 px-3 text-ink placeholder:text-ink-soft/70 focus:border-ink focus:bg-white focus:outline-none sm:px-4 ${
          big ? "py-3.5 text-[16px]" : "py-2.5 text-[14px]"
        }`}
      />
      <button
        type="submit"
        className={`min-h-11 shrink-0 border border-ink bg-ink font-bold text-paper-2 transition-colors hover:bg-ink-2 ${
          big ? "px-4 text-[15px] sm:px-6 sm:text-[16px]" : "px-3.5 text-[14px] sm:px-4"
        }`}
      >
        جست‌وجو
      </button>
    </form>
  );
}

export function Pagination({
  page,
  pages,
  base,
  query = {},
}: {
  page: number;
  pages: number;
  base: string;
  query?: Record<string, string>;
}) {
  if (pages <= 1) return null;
  const current = Math.min(Math.max(1, page), pages);
  const link = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) });
    return `${base}?${params.toString()}`;
  };
  const numbers = pages <= 5
    ? Array.from({ length: pages }, (_, i) => i + 1)
    : [...new Set([1, current - 1, current, current + 1, pages].filter((p) => p >= 1 && p <= pages))].sort((a, b) => a - b);
  const entries: (number | "gap")[] = [];
  numbers.forEach((number, index) => {
    if (index > 0 && number - numbers[index - 1] > 1) entries.push("gap");
    entries.push(number);
  });

  return (
    <nav className="mt-8" aria-label="صفحه‌بندی">
      <div className="flex items-center justify-between gap-3 sm:hidden">
        {current > 1 ? (
          <Link href={link(current - 1)} className="inline-flex min-h-11 items-center border border-rule px-4 text-[13px] hover:border-ink">
            قبلی
          </Link>
        ) : <span />}
        <span className="num text-[12px] text-ink-soft">صفحهٔ {current} از {pages}</span>
        {current < pages ? (
          <Link href={link(current + 1)} className="inline-flex min-h-11 items-center border border-rule px-4 text-[13px] hover:border-ink">
            بعدی
          </Link>
        ) : <span />}
      </div>

      <div className="hidden items-center justify-center gap-2 sm:flex">
        {current > 1 ? (
          <Link href={link(current - 1)} className="min-h-10 border border-rule px-3.5 py-2 text-[13px] hover:border-ink">
            قبلی
          </Link>
        ) : null}
        {entries.map((entry, index) => entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-soft" aria-hidden="true">…</span>
        ) : (
          <Link
            key={entry}
            href={link(entry)}
            aria-current={entry === current ? "page" : undefined}
            className={`num min-h-10 min-w-10 border px-3 py-2 text-center text-[13px] ${
              entry === current ? "border-ink bg-ink text-paper-2" : "border-rule hover:border-ink"
            }`}
          >
            {entry}
          </Link>
        ))}
        {current < pages ? (
          <Link href={link(current + 1)} className="min-h-10 border border-rule px-3.5 py-2 text-[13px] hover:border-ink">
            بعدی
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
