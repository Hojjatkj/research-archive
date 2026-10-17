import Link from "next/link";
import { Seal, SeenStamp } from "@/components/Brand";
import { ownerName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const name = ownerName();

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
      <nav aria-label="مسیر صفحه" className="text-[12px] text-ink-soft">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-ink">
              خانه
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2">دربارهٔ من</li>
        </ol>
      </nav>

      <header className="mt-7 border-b-2 border-ink pb-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold text-accent">دربارهٔ این بایگانی</p>
            <h1 className="mt-5 text-[clamp(2.1rem,4.6vw,3.35rem)] font-black leading-[1.35] text-ink">
              {name}
            </h1>
            <p className="mt-6 text-[17px] leading-9 text-ink-soft">
              این وب‌سایت یک بایگانی شخصی برای انتشار تکالیف، متن‌های پژوهشی، ارائه‌ها و
              جزوه‌هاست؛ جایی برای اینکه همهٔ کارهای دانشگاهی منظم، خوانا و قابل پیگیری باشند.
            </p>
          </div>
          <SeenStamp name="استاد راهنما" date="قابل ثبت روی هر مطلب" />
        </div>
      </header>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_17rem]">
        <div className="prose-fa max-w-3xl">
          <h2>این بایگانی چگونه کار می‌کند؟</h2>
          <p>
            هر مطلب در یکی از بخش‌های «تکالیف و پژوهش»، «ارائه‌ها» یا «جزوه‌ها» قرار می‌گیرد.
            برای هر مطلب می‌توان عنوان، خلاصه، درس، برچسب، تاریخ انتشار، تصویر، جدول، کد،
            پیوند، ویدیو، پیوست فایل و فهرست منابع ثبت کرد.
          </p>
          <p>
            مطالب به‌صورت پیش‌نویس نوشته می‌شوند و پس از انتشار در وب‌سایت نمایان می‌شوند.
            پیش‌نویس‌ها هرگز برای بازدیدکنندگان قابل مشاهده نیستند.
          </p>

          <h2>برای استاد راهنما</h2>
          <p>
            نیازی به ساخت حساب کاربری نیست. کافی است به بخش مربوط رفت، مطلب را خواند،
            پیوست‌ها را دید و در صورت تمایل مهر «مشاهده شد» را ثبت کرد. تاریخ و نام بیننده
            کنار همان مطلب باقی می‌ماند.
          </p>

          <blockquote>
            ترتیب بخش‌ها، جدا بودن تکلیف و ارائه و جزوه، و ثبت زمان بازبینی برای همین ساخته
            شده است: بازبینی کوتاه باشد و پیگیری ممکن.
          </blockquote>

          <h2>زبان و جهت متن</h2>
          <p>
            زبان اصلی این بایگانی فارسی است و چیدمان صفحه راست‌به‌چپ انجام می‌شود. با این
            حال هر بلوک متن می‌تواند جهت مستقل داشته باشد؛ برای نمونه یک پاراگراف انگلیسی مانند{" "}
            <span className="ltr-inline" dir="ltr">Research Archive</span>{" "}
            در دل یک متن فارسی درست نمایش داده می‌شود. عدد‌ها، آدرس‌ها و کد هم جهت خودشان را
            حفظ می‌کنند.
          </p>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border border-rule bg-paper-2 px-5 py-6">
            <Seal className="h-12 w-12 text-ink/70" />
            <p className="mt-4 text-[13px] font-bold text-ink-2">بخش‌ها</p>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              <li><Link href="/archive" className="text-ink-soft hover:text-ink">تکالیف و گزارش‌ها</Link></li>
              <li><Link href="/archive?type=research" className="text-ink-soft hover:text-ink">متن‌ها و مقاله‌های پژوهشی</Link></li>
              <li><Link href="/presentations" className="text-ink-soft hover:text-ink">ارائه‌ها</Link></li>
              <li><Link href="/notes" className="text-ink-soft hover:text-ink">جزوه‌ها</Link></li>
              <li><Link href="/review" className="text-ink-soft hover:text-ink">کارنامهٔ بازبینی</Link></li>
            </ul>
            <Link href="/search" className="mt-6 block border border-ink px-4 py-2.5 text-center text-[13px] font-bold text-ink hover:bg-ink hover:text-paper-2">
              جست‌وجو در بایگانی
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
