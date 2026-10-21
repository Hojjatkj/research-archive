import Link from "next/link";
import { ItemRow } from "@/components/ItemRow";
import { SearchForm } from "@/components/Pagination";
import { getCurrentUser } from "@/lib/auth";
import { countsByType, listPublished, sectionHref, siteStats, TYPES } from "@/lib/data";

export const dynamic = "force-dynamic";

const BLURBS: Record<string, string> = {
  assignment: "گزارش‌های پروژه، تکالیف درسی و مستندسازی مراحل کار",
  research: "متن‌های پژوهشی، یادداشت‌های تحلیلی و پیش‌نویس مقاله‌ها",
  presentation: "اسلایدها، فایل ارائه و ویدیوی جلسه‌ها",
  notes: "جزوه‌های درسی، خلاصهٔ مقاله‌ها و یادداشت‌های روزانه",
};

export default async function HomePage() {
  const [{ rows: latest }, counts, stats, user] = await Promise.all([
    listPublished({ perPage: 5 }),
    countsByType(),
    siteStats(),
    getCurrentUser(),
  ]);

  return (
    <>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-10 sm:gap-12 sm:px-5 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-24">
          <div>
            <p className="flex items-center gap-2.5 text-[13px] font-bold text-accent">
              <span className="inline-block h-2 w-2 bg-accent" />
              بایگانی پژوهشی کلاس
            </p>
            <h1 className="mt-5 text-[clamp(1.9rem,5.4vw,3.9rem)] font-black leading-[1.3] text-ink sm:mt-6 sm:leading-[1.22]">
              تکالیف، پژوهش، ارائه و جزوه؛
              <br />
              <span className="text-accent">منظم و قابل خواندن.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-ink-soft sm:mt-6 sm:text-[17px] sm:leading-9">
              مطالب منتشرشده برای همه قابل خواندن است و ساخت حساب عمومی وجود ندارد. اگر مطلبی را خواندید،
              دکمهٔ «من این مطلب را دیدم» را بزنید؛ هر مرورگر برای هر مطلب فقط یک‌بار می‌تواند ثبت کند.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/archive" className="border border-accent bg-accent px-5 py-3 text-[15px] font-bold text-paper-2 hover:bg-accent-2">
                رفتن به آرشیو
              </Link>
              <Link href="/students" className="border border-ink px-5 py-3 text-[14px] font-bold text-ink hover:bg-ink hover:text-paper-2">
                اطلاعات دانشجو
              </Link>
              {user ? (
                <Link href="/dashboard" className="px-2 py-3 text-[14px] font-bold text-ink underline decoration-accent decoration-2 underline-offset-[0.45em]">
                  میز کار مدیر
                </Link>
              ) : null}
            </div>

            <SearchForm className="mt-7 max-w-lg sm:mt-9" />
          </div>

          <div className="relative border border-ink/20 bg-paper-2 px-4 py-5 shadow-[0_24px_60px_rgba(22,35,63,0.08)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <p className="text-[12px] font-bold text-ink-soft">نمای کلی بایگانی</p>
            <dl className="mt-6 grid grid-cols-3 gap-px border border-rule bg-rule">
              {[
                ["دانشجو", stats.students],
                ["مطلب منتشرشده", stats.published],
                ["بخش آرشیو", TYPES.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-paper-2 px-1.5 py-4 text-center sm:px-3 sm:py-5">
                  <dd className="num text-[26px] font-semibold leading-none text-ink sm:text-[34px]">{String(value).padStart(2, "0")}</dd>
                  <dt className="mt-2 text-[11.5px] text-ink-soft">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-8 border-s-2 border-accent/50 ps-4">
              <p className="text-[13px] font-bold text-ink-2">ثبت بازدید بدون حساب</p>
              <p className="mt-2 text-[13px] leading-8 text-ink-soft">
                برای حفظ حریم خصوصی، تعداد ثبت‌های هر مطلب فقط در میز کار مدیر نمایش داده می‌شود؛ نام یا ایمیل بازدیدکننده ذخیره نمی‌شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-5 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3 sm:gap-4 sm:pb-4">
          <h2 className="text-[21px] font-black text-ink sm:text-[26px]">بخش‌های بایگانی</h2>
          <p className="text-[13px] text-ink-soft">تکلیف، ارائه، جزوه و متن پژوهشی جدا از هم</p>
        </div>
        <div className="mt-px grid grid-cols-2 gap-px bg-rule lg:grid-cols-4">
          {TYPES.map((type) => (
            <Link key={type.id} href={type.id === "research" ? "/archive?type=research" : sectionHref(type.id)} className="group bg-paper px-3.5 py-5 transition-colors hover:bg-paper-2 sm:px-6 sm:py-8">
              <p className="num text-[32px] font-semibold leading-none text-ink sm:text-[46px]">{String(counts[type.id] ?? 0).padStart(2, "0")}</p>
              <p className="mt-3 text-[14px] font-black text-ink sm:mt-4 sm:text-[17px]">{type.label}</p>
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-6 text-ink-soft sm:mt-2 sm:text-[13px] sm:leading-8">{BLURBS[type.id]}</p>
              <span className="mt-3 inline-block text-[11.5px] font-bold text-accent sm:mt-5 sm:text-[13px]">مشاهدهٔ فهرست ←</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 pb-6 sm:px-5 sm:pb-8 lg:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-3 sm:gap-4 sm:pb-4">
          <h2 className="text-[21px] font-black text-ink sm:text-[26px]">تازه‌ترین مطالب</h2>
          <Link href="/search" className="text-[13px] font-bold text-ink-soft hover:text-ink">جست‌وجو در همهٔ مطالب ←</Link>
        </div>
        {latest.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">هنوز مطلبی منتشر نشده است.</p>
        ) : (
          latest.map((item) => <ItemRow key={item.id} item={item} />)
        )}
      </section>

      <section className="mt-10 border-y border-ink/20 bg-ink text-paper-2 sm:mt-16">
        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-5 sm:py-16 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold text-paper-2/70">روند کار</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,2.6rem)] font-black leading-[1.45]">
              مدیر منتشر می‌کند؛ همه می‌خوانند و ثبت می‌کنند.
            </h2>
          </div>
          <ol className="mt-7 grid gap-2 sm:mt-12 sm:gap-px md:grid-cols-3">
            {[
              ["01", "انتشار توسط مدیر", "فقط مدیر سایت وارد میز کار می‌شود و مطالب آرشیو را می‌نویسد، ویرایش می‌کند یا از انتشار خارج می‌کند."],
              ["02", "خواندن آزاد", "بازدیدکنندگان بدون ساخت حساب، مطالب منتشرشده را می‌خوانند و در میان بخش‌های آرشیو جست‌وجو می‌کنند."],
              ["03", "یک ثبت برای هر مطلب", "با دکمهٔ «من این مطلب را دیدم»، هر مرورگر برای هر مطلب یک‌بار ثبت می‌کند. شمار ثبت‌ها فقط برای مدیر نمایش داده می‌شود."],
            ].map(([n, title, text]) => (
              <li key={n} className="border border-paper-2/15 bg-ink px-5 py-5 sm:border-0 sm:px-7 sm:py-9">
                <p className="num text-[13px] text-paper-2/55">{n}</p>
                <p className="mt-3 text-[18px] font-black">{title}</p>
                <p className="mt-2 text-[13px] leading-7 text-paper-2/75 sm:mt-3 sm:text-[14px] sm:leading-9">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
