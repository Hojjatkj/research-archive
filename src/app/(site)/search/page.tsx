import Link from "next/link";
import { ItemRow } from "@/components/ItemRow";
import { SearchForm } from "@/components/Pagination";
import { EmptySheet } from "@/components/Brand";
import { searchPublished } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
  const results = await searchPublished(q);

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
          <li className="text-ink-2">جست‌وجو</li>
        </ol>
      </nav>

      <header className="mt-7 border-b-2 border-ink pb-8">
        <h1 className="break-words text-[clamp(1.8rem,7vw,2.85rem)] font-black leading-[1.4] text-ink [overflow-wrap:anywhere] sm:leading-normal">
          {q ? `نتایج جست‌وجو برای «${q}»` : "جست‌وجو در بایگانی"}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-7 text-ink-soft sm:mt-4 sm:text-[15px] sm:leading-9">
          جست‌وجو در عنوان، خلاصه، متن کامل مطالب، نام درس و برچسب‌ها انجام می‌شود. مطالب
          پیش‌نویس در نتایج نمایش داده نمی‌شوند.
        </p>
        <SearchForm big defaultValue={q} className="mt-7 max-w-2xl" />
      </header>

      {q && results.length === 0 ? (
        <div className="mt-12 flex flex-col items-center border border-dashed border-rule bg-paper-2/60 px-6 py-20 text-center">
          <EmptySheet className="h-16 w-16 text-ink/30" />
          <p className="mt-5 text-[18px] font-bold text-ink">نتیجه‌ای پیدا نشد</p>
          <p className="mt-2.5 max-w-md text-[14px] leading-8 text-ink-soft">
            عبارت دیگری را امتحان کنید یا از فهرست بخش‌ها استفاده کنید.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/archive" className="border border-ink px-4 py-2 text-[13px] font-bold hover:bg-ink hover:text-paper-2">
              تکالیف و پژوهش
            </Link>
            <Link href="/presentations" className="border border-rule px-4 py-2 text-[13px] hover:border-ink">
              ارائه‌ها
            </Link>
            <Link href="/notes" className="border border-rule px-4 py-2 text-[13px] hover:border-ink">
              جزوه‌ها
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {q ? (
            <p className="num border-b border-rule py-4 text-[12px] text-ink-soft">
              {String(results.length).padStart(2, "0")} نتیجه
            </p>
          ) : null}
          {results.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
          {!q ? (
            <p className="py-16 text-center text-[14px] text-ink-soft">
              برای شروع، واژه‌ای در کادر بالا بنویسید.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
