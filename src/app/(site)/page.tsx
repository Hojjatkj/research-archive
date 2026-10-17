import Link from "next/link";
import { ItemRow } from "@/components/ItemRow";
import { SearchForm } from "@/components/Pagination";
import { SeenStamp } from "@/components/Brand";
import { countsByType, listPublished, reviewMap, TYPES } from "@/lib/data";

export const dynamic = "force-dynamic";

const BLURBS: Record<string, string> = {
  assignment: "گزارش‌های پروژه، تکالیف درسی و مستندسازی مراحل کار",
  research: "متن‌های پژوهشی، یادداشت‌های تحلیلی و پیش‌نویس مقاله‌ها",
  presentation: "اسلایدها، فایل ارائه و ویدیوی جلسه‌ها",
  notes: "جزوه‌های درسی، خلاصهٔ مقاله‌ها و یادداشت‌های روزانه",
};

export default async function HomePage() {
  const [{ rows: latest }, counts, reviews] = await Promise.all([
    listPublished({ perPage: 5, page: 1 }),
    countsByType(),
    reviewMap(),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* ── hero ───────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-2.5 text-[13px] font-bold text-accent">
              <span className="inline-block h-2 w-2 bg-accent" />
              بایگانی شخصی دانشجو · نیم‌سال جاری
            </p>
            <h1 className="mt-6 text-[clamp(2.35rem,5.6vw,4.15rem)] font-black leading-[1.18] text-ink">
              تکالیف، پژوهش، ارائه و جزوه؛
              <br />
              <span className="text-accent">منظم و قابل رصد.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-9 text-ink-soft">
              هر مطلب در بخش خودش منتشر می‌شود و استاد راهنما می‌تواند آن را بخواند،
              پیوست‌ها را ببیند و با یک مهر «مشاهده شد» تأیید کند — من هم می‌بینم که کدام
              کار دیده شده است.
            </p>

            <SearchForm big className="mt-9 max-w-lg" />

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
              <Link href="/archive" className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-[0.4em]">
                رفتن به تکالیف و پژوهش
              </Link>
              <Link href="/about" className="text-ink-soft hover:text-ink">
                دربارهٔ این بایگانی
              </Link>
              <span className="num text-[12px] text-ink-soft">
                {String(total).padStart(2, "0")} مطلب منتشرشده
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden border border-rule bg-gradient-to-br from-paper-2 to-paper-3">
            <div className="text-center px-8 py-14 lg:py-20">
              <p className="text-[13px] font-bold text-ink-soft">نمونهٔ چیدمان محتوا</p>
              <h2 className="mt-4 text-[clamp(1.6rem,3.5vw,2.5rem)] font-black leading-[1.4] text-ink">
                مطالب منظم، خوانا و قابل پیگیری
              </h2>
              <div className="mt-6 flex justify-center">
                <SeenStamp name="استاد راهنما" date="آخرین بازبینی" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── section index ──────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
          <h2 className="text-[26px] font-black text-ink">بخش‌های بایگانی</h2>
          <p className="text-[13px] text-ink-soft">
            جداسازی تکلیف، ارائه، جزوه و متن پژوهشی برای دسترسی سریع‌تر
          </p>
        </div>

        <div className="mt-px grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((type) => (
            <Link
              key={type.id}
              href={type.id === "presentation" ? "/presentations" : type.id === "notes" ? "/notes" : "/archive"}
              className="group bg-paper px-6 py-8 transition-colors hover:bg-paper-2"
            >
              <p className="num text-[46px] font-semibold leading-none text-ink">
                {String(counts[type.id] ?? 0).padStart(2, "0")}
              </p>
              <p className="mt-4 text-[17px] font-black text-ink">{type.label}</p>
              <p className="mt-2 text-[13px] leading-8 text-ink-soft">{BLURBS[type.id]}</p>
              <span className="mt-5 inline-block text-[13px] font-bold text-accent">
                مشاهدهٔ فهرست ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── latest ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-5 pb-8 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
          <h2 className="text-[26px] font-black text-ink">تازه‌ترین مطالب</h2>
          <Link href="/search" className="text-[13px] font-bold text-ink-soft hover:text-ink">
            جست‌وجو در همهٔ مطالب ←
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">هنوز مطلبی منتشر نشده است.</p>
        ) : (
          <div>
            {latest.map((item) => (
              <ItemRow key={item.id} item={item} reviewed={reviews.get(item.id) ?? 0} />
            ))}
          </div>
        )}
      </section>

      {/* ── professor flow ─────────────────────────── */}
      <section className="mt-16 border-y border-ink/20 bg-ink text-paper-2">
        <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-[13px] font-bold text-paper-2/70">روند کار با استاد راهنما</p>
              <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.65rem)] font-black leading-[1.45]">
                استاد می‌بیند، مهر می‌زند و می‌رود؛
                <br />
                من می‌بینم که دیده شده است.
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-5">
              <SeenStamp name="استاد راهنما" date="تاریخ ثبت" />
              <Link
                href="/review"
                className="border border-paper-2/40 px-5 py-2.5 text-[13px] font-bold text-paper-2 transition-colors hover:bg-paper-2 hover:text-ink"
              >
                دیدن کارنامهٔ بازبینی ←
              </Link>
            </div>
          </div>

          <ol className="mt-12 grid gap-px bg-paper-2/15 md:grid-cols-3">
            {[
              ["۱", "دسترسی بدون حساب کاربری", "لینک بایگانی برای استاد باز می‌شود؛ نیازی به ثبت‌نام یا رمز عبور نیست."],
              ["۲", "خواندن منظم مطالب", "تکالیف، گزارش‌ها، ارائه‌ها و جزوه‌ها در بخش‌های جدا قرار دارند و هر مطلب پیوست و منابع خودش را دارد."],
              ["۳", "ثبت «مشاهده شد»", "استاد با یک کلیک مهر «مشاهده شد» را می‌زند؛ تاریخ و نام ثبت می‌شود و برای من قابل پیگیری است."],
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
