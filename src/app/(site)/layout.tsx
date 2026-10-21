import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Grain } from "@/components/Grain";
import { Seal } from "@/components/Brand";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const user = await getCurrentUser();

  return (
    <div className="relative min-h-screen">
      <Grain />
      <div className="relative z-10">
        <header className="no-print sticky top-0 z-40 border-b border-ink/25 bg-ink text-paper-2">
          <div className="relative mx-auto flex max-w-[1180px] items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-3 lg:px-8">
            <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
              <Seal className="h-9 w-9 text-paper-2/90 sm:h-10 sm:w-10" />
              <span className="leading-tight">
                <span className="block whitespace-nowrap text-[15px] font-black sm:text-[17px]">بایگانی پژوهش</span>
                <span className="num hidden text-[10px] text-paper-2/60 sm:block">RESEARCH ARCHIVE</span>
              </span>
            </Link>
            <Nav user={user ? { name: user.fullName } : null} />
          </div>
        </header>

        <main>{children}</main>

        <footer className="no-print mt-24 border-t border-rule bg-paper-2/70">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-8 sm:gap-8 sm:px-5 sm:py-12 md:grid-cols-3 lg:px-8">
            <div>
              <p className="text-[15px] font-black text-ink">بایگانی پژوهش</p>
              <p className="mt-2.5 text-[13px] leading-8 text-ink-soft">
                آرشیو عمومی تکالیف، متن‌های پژوهشی، ارائه‌ها و جزوه‌ها. همه می‌توانند مطالب منتشرشده را بخوانند؛
                مدیریت و انتشار محتوا فقط در اختیار مدیر سایت است.
              </p>
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink-2">بخش‌ها</p>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
                <li><Link className="hover:text-ink" href="/archive">تکالیف و پژوهش</Link></li>
                <li><Link className="hover:text-ink" href="/presentations">ارائه‌ها</Link></li>
                <li><Link className="hover:text-ink" href="/notes">جزوه‌ها</Link></li>
                <li><Link className="hover:text-ink" href="/students">اطلاعات دانشجو</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink-2">ثبت بازدید</p>
              <p className="mt-3 text-[13px] leading-8 text-ink-soft">
                برای ثبت «من دیدم» حساب نمی‌خواهید؛ فقط روی دکمهٔ زیر مطلب کلیک کنید. هر مرورگر برای هر مطلب یک‌بار ثبت دارد.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block border border-ink px-3.5 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-ink hover:text-paper-2"
              >
                ورود مدیر سایت
              </Link>
            </div>
          </div>
          <div className="border-t border-rule px-5 py-5 text-center">
            <p className="num text-[11px] text-ink-soft">RESEARCH ARCHIVE · READ ONLY · RTL / LTR</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
