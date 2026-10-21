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
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
            <Link href="/" className="flex items-center gap-3 text-ink">
              <Seal className="h-9 w-9 text-ink" />
              <span className="leading-tight">
                <span className="block text-[16px] font-black">بایگانی پژوهش</span>
                <span className="num block text-[10px] text-ink-soft">RESEARCH ARCHIVE</span>
              </span>
            </Link>
            <Link href="/" className="text-[13px] text-ink-soft underline-offset-4 hover:text-ink hover:underline">
              بازگشت به وب‌سایت
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-rule px-5 py-5 text-center text-[12px] leading-7 text-ink-soft">
          حساب کاربری فقط برای دانشجویان است؛ استاد راهنما برای خواندن مطالب و ثبت «مشاهده شد» به
          حساب نیاز ندارد.
        </footer>
      </div>
    </div>
  );
}
