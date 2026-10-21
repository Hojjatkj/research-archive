import Link from "next/link";
import { ItemRow } from "@/components/ItemRow";
import { SearchForm } from "@/components/Pagination";
import { SeenStamp } from "@/components/Brand";
import { getCurrentUser } from "@/lib/auth";
import { countsByType, listPublished, reviewMap, sectionHref, siteStats, TYPES } from "@/lib/data";

export const dynamic = "force-dynamic";

const BLURBS: Record<string, string> = {
  assignment: "گزارش‌های پروژه، تکالیف درسی و مستندسازی مراحل کار",
  research: "متن‌های پژوهشی، یادداشت‌های تحلیلی و پیش‌نویس مقاله‌ها",
  presentation: "اسلایدها، فایل ارائه و ویدیوی جلسه‌ها",
  notes: "جزوه‌های درسی، خلاصهٔ مقاله‌ها و یادداشت‌های روزانه",
};

export default async function HomePage() {
  const [{ rows: latest }, counts, reviews, stats, user] = await Promise.all([
    listPublished({ perPage: 5 }),
    countsByType(),
    reviewMap(),
    siteStats(),
    getCurrentUser(),
  ]);

  return (
    <>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-2.5 text-[13px] font-bold text-accent">
              <span className="inline-block h-2 w-2 bg-accent" />
              بایگانی پژوهشی کلاس
            </p>
            <h1 className="mt-6 text-[clamp(2.2rem,5.4vw,3.9rem)] font-black leading-[1.22] text-ink">
              تکالیف، پژوهش، ارائه و جزوه؛
              <br />
              <span className="text-accent">منظم و قابل رصد.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-9 text-ink-soft">
              هر دانشجو حساب خودش را می‌سازد و کارهایش را در بخش‌های جدا منتشر می‌کند. استاد راهنما
              بدون نیاز به حساب، مطالب را می‌خواند و با مهر «مشاهده شد» تأیید می‌کند — و دانشجو می‌بیند
              کدام کار دیده شده است.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link href="/dashboard" className="border border-ink bg-ink px-5 py-3 text-[15px] font-bold text-paper-2 hover:bg-ink-2">
                  رفتن به میز کار
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="border border-accent bg-accent px-5 py-3 text-[15px] font-bold text-paper-2 hover:bg-accent-2">
                    ساخت حساب دانشجویی
                  </Link>
                  <Link href="/login" className="border border-ink px-5 py-3 text-[15px] font-bold text-ink hover:bg-ink hover:text-paper-2">
                    ورود
                  </Link>
                </>
              )}
              <Link href="/students" className="px-2 py-3 text-[14px] font-bold text-ink underline decoration-accent decoration-2 underline-offset-[0.45em]">
                استاد هستید؟ اطلاعات دانشجو
              </Link>
            </div>

            <SearchForm className="mt-9 max-w-lg" />
          </div>

          <div className="relative border border-ink/20 bg-paper-2 px-7 py-8 shadow-[0_24px_60px_rgba(22,35,63,0.08)] sm:px-10 sm:py-10">
            <p className="text-[12px] font-bold text-ink-soft">کارنامهٔ کلاس — هم‌اکنون</p>
            <dl className="mt-6 grid grid-cols-3 gap-px border border-rule bg-rule">
              {[
                ["دانشجو", stats.students],
                ["مطلب منتشرشده", stats.published],
                ["مشاهده‌شده", stats.seen],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-paper-2 px-3 py-5 text-center">
                  <dd className="num text-[34px] font-semibold leading-none text-ink">{String(value).padStart(2, "0")}</dd>
                  <dt className="mt-2 text-[11.5px] text-ink-soft">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <p className="max-w-[15rem] text-[13px] leading-7 text-ink-soft">
                هر مهر یعنی استاد مطلب را خوانده است؛ دانشجو همان لحظه آن را در میز کار خود می‌بیند.
              </p>
              <SeenStamp name="استاد راهنما" date="نمونهٔ مهر" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
          <h2 className="text-[26px] font-black text-ink">بخش‌های بایگانی</h2>
          <p className="text-[13px] text-ink-soft">تکلیف، ارائه، جزوه و متن پژوهشی جدا از هم</p>
        </div>
        <div className="mt-px grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((type) => (
            <Link key={type.id} href={type.id === "research" ? "/archive?type=research" : sectionHref(type.id)} className="group bg-paper px-6 py-8 transition-colors hover:bg-paper-2">
              <p className="num text-[46px] font-semibold leading-none text-ink">{String(counts[type.id] ?? 0).padStart(2, "0")}</p>
              <p className="mt-4 text-[17px] font-black text-ink">{type.label}</p>
              <p className="mt-2 text-[13px] leading-8 text-ink-soft">{BLURBS[type.id]}</p>
              <span className="mt-5 inline-block text-[13px] font-bold text-accent">مشاهدهٔ فهرست ←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 pb-8 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
          <h2 className="text-[26px] font-black text-ink">تازه‌ترین مطالب</h2>
          <Link href="/search" className="text-[13px] font-bold text-ink-soft hover:text-ink">جست‌وجو در همهٔ مطالب ←</Link>
        </div>
        {latest.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">هنوز مطلبی منتشر نشده است.</p>
        ) : (
          latest.map((item) => <ItemRow key={item.id} item={item} reviewed={reviews.get(item.id) ?? 0} />)
        )}
      </section>

      <section className="mt-16 border-y border-ink/20 bg-ink text-paper-2">
        <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold text-paper-2/70">روند کار</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-black leading-[1.45]">
              دانشجو منتشر می‌کند، استاد می‌بیند و مهر می‌زند.
            </h2>
          </div>
          <ol className="mt-12 grid gap-px bg-paper-2/15 md:grid-cols-3">
            {[
              ["01", "ثبت‌نام دانشجو", "نام، شماره دانشجویی، دانشگاه، کلاس، استاد و زمان کلاس یک بار ثبت می‌شود و صفحهٔ «اطلاعات دانشجو» ساخته می‌شود."],
              ["02", "انتشار منظم کارها", "تکالیف، گزارش‌ها، ارائه‌ها و جزوه‌ها با متن، تصویر، جدول، ویدیو، پیوست و منابع در بخش‌های جدا منتشر می‌شوند."],
              ["03", "«مشاهده شد» توسط استاد", "استاد بدون حساب کاربری مطلب را می‌خواند و مهر می‌زند؛ دانشجو در میز کارش می‌بیند کدام کار دیده شده است."],
            ].map(([n, title, text]) => (
              <li key={n} className="bg-ink px-7 py-9">
                <p className="num text-[13px] text-paper-2/55">{n}</p>
                <p className="mt-3 text-[18px] font-black">{title}</p>
                <p className="mt-3 text-[14px] leading-9 text-paper-2/75">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
