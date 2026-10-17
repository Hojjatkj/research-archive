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
        className={`min-w-0 flex-1 border border-rule bg-paper-2 px-4 text-ink placeholder:text-ink-soft/70 focus:border-ink focus:bg-white focus:outline-none ${
          big ? "py-3.5 text-[16px]" : "py-2.5 text-[14px]"
        }`}
      />
      <button
        type="submit"
        className={`border border-ink bg-ink font-bold text-paper-2 transition-colors hover:bg-ink-2 ${
          big ? "px-6 text-[16px]" : "px-4 text-[14px]"
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
  const link = (p: number) => {
    const params = new URLSearchParams({ ...query, page: String(p) });
    return `${base}?${params.toString()}`;
  };

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="صفحه‌بندی">
      {page > 1 ? (
        <Link href={link(page - 1)} className="border border-rule px-3.5 py-2 text-[13px] hover:border-ink">
          قبلی
        </Link>
      ) : null}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={link(p)}
          aria-current={p === page ? "page" : undefined}
          className={`num border px-3.5 py-2 text-[13px] ${
            p === page ? "border-ink bg-ink text-paper-2" : "border-rule hover:border-ink"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < pages ? (
        <Link href={link(page + 1)} className="border border-rule px-3.5 py-2 text-[13px] hover:border-ink">
          بعدی
        </Link>
      ) : null}
    </nav>
  );
}
