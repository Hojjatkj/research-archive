import Link from "next/link";
import type { ReactNode } from "react";
import { Seal } from "@/components/Brand";
import { Grain } from "@/components/Grain";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Grain />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-rule bg-paper-2/85">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3.5 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-ink sm:gap-3">
              <Seal className="h-8 w-8 text-ink sm:h-9 sm:w-9" />
              <span className="leading-tight">
                <span className="block whitespace-nowrap text-[15px] font-black sm:text-[16px]">بایگانی پژوهش</span>
                <span className="num hidden text-[10px] text-ink-soft sm:block">RESEARCH ARCHIVE</span>
              </span>
            </Link>
            <Link href="/" className="whitespace-nowrap text-[11.5px] text-ink-soft underline-offset-4 hover:text-ink hover:underline sm:text-[13px]">
              بازگشت به وب‌سایت
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-rule px-5 py-5 text-center text-[12px] leading-7 text-ink-soft">
          این ورود فقط برای مدیر سایت است؛ بازدیدکنندگان بدون حساب می‌توانند مطالب را بخوانند و «من دیدم» را ثبت کنند.
        </footer>
      </div>
    </div>
  );
}
